import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError } from '../../../common/errors';
import { isUuid } from '../../../common/ids/uuid-v7';
import { parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf, SYSTEM_ACTOR } from '../../audit';
import { CompaniesService, CompanyCard } from '../../companies';
import { AutoCheck, slaState } from '../domain/opportunity-checks';
import {
  nextOpportunityStatus,
  nextRevisionStatus,
  OpportunityStatus,
  RevisionStatus,
} from '../domain/opportunity-state';
import { OPPORTUNITY_TYPES, OpportunityContent } from '../domain/opportunity-type.policy';
import { applicationCounts } from './application-views';
import { contentChanges, contentColumns, contentOf, draftContent } from './opportunity-content';
import { NO_REVISION } from './opportunities.service';

export const REVIEW_REASONS = [
  'PAY_UNCLEAR',
  'SCHEDULE_INCONSISTENT',
  'CONTACT_DETAILS_IN_TEXT',
  'WRONG_CATEGORY',
  'MISSING_WORKING_HOURS',
  'FEE_REQUESTED',
  'MISLEADING',
  'OTHER',
] as const;

const ADMIN_STATUSES = ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED', 'PUBLISHED', 'REJECTED', 'CLOSED'] as const;
const SORTS = {
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  published_at: 'publishedAt',
  review_due_at: 'reviewDueAt',
} as const;
const NULLABLE_SORTS = new Set<string>(['publishedAt', 'reviewDueAt']);

const listSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(
      new RegExp(`^-?(${Object.keys(SORTS).join('|')})$`),
      `must be one of ${Object.keys(SORTS).join(', ')}, optionally prefixed with -`,
    )
    .optional(),
  q: z.string().trim().max(100).optional(),
  status: z.enum(ADMIN_STATUSES).optional(),
  type: z.enum(OPPORTUNITY_TYPES).optional(),
  city: z.string().trim().max(100).optional(),
  company_id: z.string().uuid().optional(),
});

/** contracts/admin `ReviewRequest`: the message goes to the company as from "Back of House". */
const reviewSchema = z
  .object({
    reasons: z.array(z.enum(REVIEW_REASONS)).max(REVIEW_REASONS.length).optional(),
    message: z.string({ error: 'is required' }).trim().min(1, 'is required').max(2000),
  })
  .strict();

const approveSchema = z.object({}).strict();

const closeSchema = z
  .object({ reason: z.string({ error: 'is required' }).trim().min(1, 'is required').max(2000) })
  .strict();

/** contracts/admin `OpportunityAdmin`, before presentation. */
export interface OpportunityAdminView {
  id: string;
  status: OpportunityStatus;
  content: OpportunityContent;
  company: CompanyCard;
  publishedAt: Date | null;
  submittedAt: Date | null;
  reviewDueAt: Date | null;
  slaState: 'OK' | 'DUE_SOON' | 'OVERDUE';
  resubmitted: boolean;
  autoFlagged: boolean;
  checks: AutoCheck[];
  history: {
    id: string;
    decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
    revision: boolean;
    reasons: string[];
    message: string | null;
    reviewer: { id: string; name: string };
    createdAt: Date;
  }[];
  applicationsCount: number;
  views: number;
  /** The pending revision of a live listing, with what it changes (the queue's "Revision"). */
  revision: {
    status: RevisionStatus;
    draft: OpportunityContent;
    changes: { field: string; before: unknown; after: unknown }[];
  } | null;
  updatedAt: Date;
}

type Row = Prisma.OpportunityGetPayload<object>;
type Decision = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

const DECISION = {
  APPROVE: 'APPROVED',
  REQUEST_CHANGES: 'CHANGES_REQUESTED',
  REJECT: 'REJECTED',
} as const;

/** Listings waiting for review: new ones, and revisions of live ones. */
const IN_REVIEW: Prisma.OpportunityWhereInput = { OR: [{ status: 'IN_REVIEW' }, { revisionStatus: 'IN_REVIEW' }] };

/**
 * Listing review in the back office (contracts/admin /opportunities*, execution-plan
 * Phase 5). Reviewers approve, ask for changes or reject a submitted listing or the
 * revision of a live one; approving a revision replaces the live content. Messages reach
 * the company as from "Back of House", never the reviewer's name. Staff never write
 * application status (companies own that decision).
 */
@Injectable()
export class OpportunityReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly companies: CompaniesService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** The queue (`status=IN_REVIEW`, oldest deadline first) and every listing. */
  async list(actor: Actor | undefined, input: unknown): Promise<{ items: OpportunityAdminView[]; total: number }> {
    this.requireStaff(actor, 'opportunities.view');
    const query = parseInput(listSchema, input);
    return this.page(query, query.company_id ? { companyId: query.company_id } : {});
  }

  /** contracts/admin GET /companies/{id}/opportunities (`companies.view`). */
  async ofCompany(
    actor: Actor | undefined,
    companyId: string,
    input: unknown,
  ): Promise<{ items: OpportunityAdminView[]; total: number }> {
    this.requireStaff(actor, 'companies.view');
    const query = parseInput(listSchema.pick({ page: true, page_size: true, sort: true, status: true }), input);
    if (!isUuid(companyId) || !(await this.companies.exists(companyId))) throw new NotFoundError('Company not found');
    return this.page(query, { companyId });
  }

  async get(actor: Actor | undefined, opportunityId: string): Promise<OpportunityAdminView> {
    this.requireStaff(actor, 'opportunities.view');
    return this.one(opportunityId);
  }

  /** Publishes a submitted listing, or puts an approved revision live. */
  async approve(actor: Actor | undefined, opportunityId: string, input: unknown): Promise<OpportunityAdminView> {
    const staff = this.requireStaff(actor, 'opportunities.review');
    parseInput(approveSchema, input ?? {});
    return this.decide(staff, opportunityId, 'APPROVE', { reasons: [], message: null });
  }

  async requestChanges(actor: Actor | undefined, opportunityId: string, input: unknown): Promise<OpportunityAdminView> {
    const staff = this.requireStaff(actor, 'opportunities.review');
    const data = parseInput(reviewSchema, input);
    return this.decide(staff, opportunityId, 'REQUEST_CHANGES', { reasons: data.reasons ?? [], message: data.message });
  }

  /** Rejects a submitted listing (final), or drops a revision (the live listing stays). */
  async reject(actor: Actor | undefined, opportunityId: string, input: unknown): Promise<OpportunityAdminView> {
    const staff = this.requireStaff(actor, 'opportunities.review');
    const data = parseInput(reviewSchema, input);
    return this.decide(staff, opportunityId, 'REJECT', { reasons: data.reasons ?? [], message: data.message });
  }

  /** Takes a live listing down (`moderation.act`), with a reason the company sees. */
  async close(actor: Actor | undefined, opportunityId: string, input: unknown): Promise<OpportunityAdminView> {
    const staff = this.requireStaff(actor, 'moderation.act');
    const data = parseInput(closeSchema, input);
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, opportunityId);
      await this.closeRow(
        tx,
        row,
        data.reason,
        auditActorOf(staff),
        { type: 'STAFF', user_id: staff.staffId },
        'STAFF',
      );
    });
    return this.one(opportunityId);
  }

  // ---- Jobs and events ----

  /** The `opportunity.autoclose` job: live listings past `closes_at` close. */
  async closeExpired(limit = 100): Promise<number> {
    const now = this.clock.now();
    const due = await this.prisma.opportunity.findMany({
      where: { status: 'PUBLISHED', closesAt: { lte: now } },
      select: { id: true },
      orderBy: { closesAt: 'asc' },
      take: limit,
    });
    let closed = 0;
    for (const { id } of due) {
      closed += await this.transactions.run(async (tx) => {
        const row = await this.lockSkip(tx, id);
        if (!row || row.status !== 'PUBLISHED' || !row.closesAt || row.closesAt > now) return 0;
        await this.closeRow(tx, row, null, SYSTEM_ACTOR, { type: 'SYSTEM', user_id: null }, 'SYSTEM');
        return 1;
      });
    }
    return closed;
  }

  /**
   * The `opportunity.sla` job: each submission still waiting after its deadline is announced
   * once to the review staff (the admin bell).
   */
  async alertOverdue(limit = 100): Promise<number> {
    const now = this.clock.now();
    const overdue = await this.prisma.opportunity.findMany({
      where: { AND: [IN_REVIEW, { reviewDueAt: { lt: now }, slaAlertedAt: null }] },
      select: { id: true, companyId: true, type: true, revisionStatus: true, reviewDueAt: true },
      orderBy: { reviewDueAt: 'asc' },
      take: limit,
    });
    for (const row of overdue) {
      await this.transactions.run(async (tx) => {
        const updated = await tx.opportunity.updateMany({
          where: { id: row.id, slaAlertedAt: null },
          data: { slaAlertedAt: now },
        });
        if (updated.count === 0) return;
        await this.outbox.emit({
          name: 'opportunity.review_overdue',
          aggregateType: 'opportunity',
          aggregateId: row.id,
          actor: { type: 'SYSTEM', user_id: null },
          data: {
            opportunity_id: row.id,
            company_id: row.companyId,
            type: row.type,
            revision: row.revisionStatus === 'IN_REVIEW',
            due_at: row.reviewDueAt!.toISOString(),
          },
        });
      });
    }
    return overdue.length;
  }

  /** Moderation removed the listing (`moderation.case.resolved` CONTENT_REMOVED): it closes. */
  async closeByModeration(opportunityId: string, message: string | null): Promise<void> {
    await this.transactions.run(async (tx) => {
      const row = await this.lockSkip(tx, opportunityId);
      if (!row || row.status === 'CLOSED' || row.status === 'REJECTED') return;
      if (row.status === 'PUBLISHED') {
        await this.closeRow(tx, row, message, SYSTEM_ACTOR, { type: 'SYSTEM', user_id: null }, 'STAFF');
        return;
      }
      // Not live yet: it cannot go live any more.
      await tx.opportunity.update({
        where: { id: row.id },
        data: { status: 'REJECTED', reviewerNote: message, ...NO_REVISION },
      });
      await this.audit.record({
        actor: SYSTEM_ACTOR,
        action: 'opportunity.reject',
        entityType: 'opportunity',
        entityId: row.id,
        changes: { before: { status: row.status }, after: { status: 'REJECTED', source: 'moderation' } },
      });
    });
  }

  // ---- Shared ----

  private async decide(
    staff: StaffActor,
    opportunityId: string,
    decision: Decision,
    note: { reasons: string[]; message: string | null },
  ): Promise<OpportunityAdminView> {
    await this.transactions.run(async (tx) => {
      const row = await this.lock(tx, opportunityId);
      const revision = row.revisionStatus === 'IN_REVIEW';
      const now = this.clock.now();
      let data: Prisma.OpportunityUncheckedUpdateInput;
      let after: Record<string, unknown>;
      if (revision) {
        const next = nextRevisionStatus(row.status, row.revisionStatus, decision);
        if (!next) throw this.notInReview();
        const draft = draftContent(row.revisionDraft, row.type);
        data =
          decision === 'APPROVE'
            ? { ...contentColumns(draft), ...NO_REVISION }
            : next === 'NONE'
              ? { ...NO_REVISION }
              : { revisionStatus: next, revisionNote: note.message };
        after = { revision_status: next === 'NONE' ? null : next };
      } else {
        const status = nextOpportunityStatus(row.status, decision);
        if (!status) throw this.notInReview();
        data =
          decision === 'APPROVE'
            ? { status, publishedAt: now, reviewerNote: null }
            : { status, reviewerNote: note.message };
        after = { status };
      }
      await tx.opportunity.update({ where: { id: row.id }, data });
      await tx.opportunityReview.create({
        data: {
          opportunityId: row.id,
          decision: DECISION[decision],
          revision,
          reasons: note.reasons,
          message: note.message,
          staffId: staff.staffId,
        },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: `opportunity.${decision.toLowerCase()}`,
        entityType: 'opportunity',
        entityId: row.id,
        changes: {
          before: revision ? { revision_status: row.revisionStatus } : { status: row.status },
          after: { ...after, ...(note.reasons.length ? { reasons: note.reasons } : {}) },
        },
      });
      const card = await this.companies.card(row.companyId);
      await this.outbox.emit({
        name:
          decision === 'APPROVE'
            ? 'opportunity.published'
            : decision === 'REQUEST_CHANGES'
              ? 'opportunity.changes_requested'
              : 'opportunity.rejected',
        aggregateType: 'opportunity',
        aggregateId: row.id,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: {
          opportunity_id: row.id,
          company_id: row.companyId,
          owner_user_id: card?.accountUserId ?? null,
          type: row.type,
          title: decision === 'APPROVE' && revision ? draftContent(row.revisionDraft, row.type).title : row.title,
          revision,
          message: note.message,
        },
      });
    });
    return this.one(opportunityId);
  }

  private async closeRow(
    tx: Tx,
    row: Row,
    reason: string | null,
    auditActor: ReturnType<typeof auditActorOf>,
    eventActor: { type: 'STAFF' | 'SYSTEM'; user_id: string | null },
    by: 'STAFF' | 'SYSTEM',
  ): Promise<void> {
    const status = nextOpportunityStatus(row.status, 'CLOSE');
    if (!status) {
      throw new DomainError(
        ErrorCode.INVALID_TRANSITION,
        `Cannot close a ${row.status.toLowerCase()} listing`,
        HttpStatus.CONFLICT,
      );
    }
    await tx.opportunity.update({
      where: { id: row.id },
      data: { status, closedAt: this.clock.now(), closeReason: reason, ...NO_REVISION },
    });
    await this.audit.record({
      actor: auditActor,
      action: 'opportunity.close',
      entityType: 'opportunity',
      entityId: row.id,
      changes: { before: { status: row.status }, after: { status, ...(reason ? { reason } : {}) } },
    });
    const card = await this.companies.card(row.companyId);
    await this.outbox.emit({
      name: 'opportunity.closed',
      aggregateType: 'opportunity',
      aggregateId: row.id,
      actor: eventActor,
      data: {
        opportunity_id: row.id,
        company_id: row.companyId,
        owner_user_id: card?.accountUserId ?? null,
        title: row.title,
        type: row.type,
        closed_by: by,
        message: reason,
      },
    });
  }

  private async page(
    query: Partial<z.infer<typeof listSchema>> & { page: number; page_size: number },
    scope: Prisma.OpportunityWhereInput,
  ): Promise<{ items: OpportunityAdminView[]; total: number }> {
    const and: Prisma.OpportunityWhereInput[] = [scope];
    if (query.status === 'IN_REVIEW') and.push(IN_REVIEW);
    else if (query.status) and.push({ status: query.status });
    if (query.type) and.push({ type: query.type });
    if (query.city) and.push({ city: { equals: query.city, mode: 'insensitive' } });
    if (query.q) {
      const like = { contains: query.q, mode: 'insensitive' as const };
      and.push({ OR: [{ title: like }, { summary: like }, { description: like }] });
    }
    const where: Prisma.OpportunityWhereInput = { AND: and };
    const sort = query.sort ?? (query.status === 'IN_REVIEW' ? 'review_due_at' : '-updated_at');
    const field = SORTS[sort.replace(/^-/, '') as keyof typeof SORTS];
    const direction = sort.startsWith('-') ? 'desc' : 'asc';
    const [rows, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        orderBy: [
          { [field]: NULLABLE_SORTS.has(field) ? { sort: direction, nulls: 'last' } : direction },
          { id: 'asc' },
        ],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.opportunity.count({ where }),
    ]);
    return { items: await this.views(rows, false), total };
  }

  private async one(opportunityId: string): Promise<OpportunityAdminView> {
    const row = isUuid(opportunityId)
      ? await this.prisma.opportunity.findUnique({ where: { id: opportunityId } })
      : null;
    if (!row) throw new NotFoundError('Opportunity not found');
    return (await this.views([row], true))[0];
  }

  private async views(rows: Row[], withHistory: boolean): Promise<OpportunityAdminView[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [cards, counts, reviews] = await Promise.all([
      this.companies.cards(rows.map((r) => r.companyId)),
      applicationCounts(this.prisma, ids),
      withHistory
        ? this.prisma.opportunityReview.findMany({
            where: { opportunityId: { in: ids } },
            include: { staff: { select: { name: true } } },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          })
        : [],
    ]);
    const now = this.clock.now();
    return rows.map((row) => {
      const live = contentOf(row);
      const inReview = row.status === 'IN_REVIEW' || row.revisionStatus === 'IN_REVIEW';
      const draft = row.revisionStatus ? draftContent(row.revisionDraft, row.type) : null;
      return {
        id: row.id,
        status: row.status,
        content: live,
        company: cards.get(row.companyId)!,
        publishedAt: row.publishedAt,
        submittedAt: row.submittedAt,
        reviewDueAt: row.reviewDueAt,
        slaState: inReview ? slaState(row.submittedAt, row.reviewDueAt, now) : 'OK',
        resubmitted: row.resubmitted,
        autoFlagged: row.autoFlagged,
        checks: Array.isArray(row.checks) ? (row.checks as unknown as AutoCheck[]) : [],
        history: reviews
          .filter((r) => r.opportunityId === row.id)
          .map((r) => ({
            id: r.id,
            decision: r.decision,
            revision: r.revision,
            reasons: r.reasons ?? [],
            message: r.message,
            reviewer: { id: r.staffId, name: r.staff.name },
            createdAt: r.createdAt,
          })),
        // Applications arrive with Phase 5B.
        applicationsCount: counts.get(row.id) ?? 0,
        views: row.views,
        revision:
          row.revisionStatus && draft
            ? { status: row.revisionStatus, draft, changes: contentChanges(live, draft) }
            : null,
        updatedAt: row.updatedAt,
      };
    });
  }

  private async lock(tx: Tx, opportunityId: string): Promise<Row> {
    if (!isUuid(opportunityId)) throw new NotFoundError('Opportunity not found');
    const [found] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM app.opportunities WHERE id = ${opportunityId}::uuid FOR UPDATE
    `;
    if (!found) throw new NotFoundError('Opportunity not found');
    return tx.opportunity.findUniqueOrThrow({ where: { id: opportunityId } });
  }

  private async lockSkip(tx: Tx, opportunityId: string): Promise<Row | null> {
    if (!isUuid(opportunityId)) return null;
    const [found] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM app.opportunities WHERE id = ${opportunityId}::uuid FOR UPDATE SKIP LOCKED
    `;
    return found ? tx.opportunity.findUniqueOrThrow({ where: { id: opportunityId } }) : null;
  }

  private notInReview(): DomainError {
    return new DomainError(ErrorCode.INVALID_TRANSITION, 'This listing is not waiting for review', HttpStatus.CONFLICT);
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}
