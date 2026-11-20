import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import { isUuid, uuidv7 } from '../../../common/ids/uuid-v7';
import { parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf } from '../../audit';
import { CompaniesService, CompanyCard, requireCompanyActor } from '../../companies';
import { SettingsService } from '../../settings';
import { listingText, runChecks } from '../domain/opportunity-checks';
import {
  isEditable,
  nextOpportunityStatus,
  nextRevisionStatus,
  OpportunityAction,
  OpportunityStatus,
  RevisionAction,
  RevisionStatus,
} from '../domain/opportunity-state';
import {
  INDIVIDUAL_TYPES,
  OPPORTUNITY_TYPES,
  OpportunityContent,
  submitGaps,
  TYPE_RULES,
} from '../domain/opportunity-type.policy';
import {
  contentColumns,
  contentOf,
  draftContent,
  draftJson,
  EMPTY_CONTENT,
  mergeInput,
  opportunityInputSchema,
} from './opportunity-content';

const HOUR_MS = 3_600_000;
const OWN_LIST_LIMIT = 200;

const listSchema = z.object({
  type: z.enum(OPPORTUNITY_TYPES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(50),
});

/** contracts/app `Opportunity`, before presentation. */
export interface OpportunityView {
  id: string;
  status: OpportunityStatus;
  content: OpportunityContent;
  company: CompanyCard;
  postedAt: Date;
  applicants: number;
  /** Owner only. */
  reviewerNote?: string | null;
  /** Owner only. */
  revision?: { status: RevisionStatus; draft: OpportunityContent; reviewerNote: string | null } | null;
}

type Row = Prisma.OpportunityGetPayload<object>;
type Viewer = { kind: 'member'; userId: string } | { kind: 'company'; userId: string; card: CompanyCard };

/**
 * Listings in the app (contracts/app /opportunities*, /companies/{id}/opportunities and
 * /company/opportunities*, execution-plan Phase 5). Companies write drafts, submit them
 * for review (every listing, D9) and revise live listings without taking them down (P2).
 * Individuals see individual-facing listings; companies also see the supplier requests
 * that invite their type. Listings of a suspended company are hidden.
 */
@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly companies: CompaniesService,
    private readonly settings: SettingsService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  // ---- Discover (individuals and companies) ----

  /** Live listings for the viewer, newest first (no match score yet: `match_score` is null). */
  async list(actor: Actor | undefined, input: unknown): Promise<{ items: OpportunityView[]; hasMore: boolean }> {
    const viewer = await this.viewer(actor);
    const query = parseInput(listSchema, input);
    const and: Prisma.OpportunityWhereInput[] = [this.visibleTo(viewer)];
    if (query.type) and.push({ type: query.type });
    if (query.q) {
      const like = { contains: query.q, mode: 'insensitive' as const };
      and.push({ OR: [{ title: like }, { summary: like }, { description: like }, { city: like }] });
    }
    const rows = await this.prisma.opportunity.findMany({
      where: { AND: and },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.page_size,
      take: query.page_size + 1,
    });
    return { items: await this.views(rows.slice(0, query.page_size), false), hasMore: rows.length > query.page_size };
  }

  /** One live listing the viewer may see; each open counts a view. */
  async get(actor: Actor | undefined, opportunityId: string): Promise<OpportunityView> {
    const viewer = await this.viewer(actor);
    const row = isUuid(opportunityId)
      ? await this.prisma.opportunity.findFirst({ where: { AND: [{ id: opportunityId }, this.visibleTo(viewer)] } })
      : null;
    if (!row) throw new NotFoundError('Opportunity not found');
    // Raw SQL so a view does not move updated_at (the company's "recently updated" order).
    await this.prisma.$executeRaw`UPDATE app.opportunities SET views = views + 1 WHERE id = ${row.id}::uuid`;
    return (await this.views([row], false))[0];
  }

  /** A company's live listings the viewer may see, newest first. */
  async ofCompany(actor: Actor | undefined, companyId: string): Promise<OpportunityView[]> {
    const viewer = await this.viewer(actor);
    if (!isUuid(companyId) || !(await this.companies.card(companyId))?.active) {
      throw new NotFoundError('Company not found');
    }
    const rows = await this.prisma.opportunity.findMany({
      where: { AND: [{ companyId }, this.visibleTo(viewer)] },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: OWN_LIST_LIMIT,
    });
    return this.views(rows, false);
  }

  /** How many live listings each company has (contracts/app `Company.open_opportunities`). */
  async liveCounts(companyIds: string[]): Promise<Map<string, number>> {
    if (companyIds.length === 0) return new Map();
    const rows = await this.prisma.opportunity.groupBy({
      by: ['companyId'],
      where: { companyId: { in: companyIds }, status: 'PUBLISHED' },
      _count: true,
    });
    return new Map(rows.map((r) => [r.companyId, r._count]));
  }

  // ---- The company's own listings ----

  /** Own listings in every status (supplier requests included), most recently updated first. */
  async listOwn(actor: Actor | undefined): Promise<OpportunityView[]> {
    const company = requireCompanyActor(actor);
    const rows = await this.prisma.opportunity.findMany({
      where: { companyId: company.companyId },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: OWN_LIST_LIMIT,
    });
    return this.views(rows, true);
  }

  async getOwn(actor: Actor | undefined, opportunityId: string): Promise<OpportunityView> {
    const company = requireCompanyActor(actor);
    return (await this.views([await this.findOwn(this.prisma, company.companyId, opportunityId)], true))[0];
  }

  /** A new DRAFT. A supplier request needs `CREATE_SUPPLIER_REQUEST` (verified companies, BQ-83). */
  async create(actor: Actor | undefined, input: unknown): Promise<OpportunityView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    const data = parseInput(opportunityInputSchema, input);
    const card = await this.requireCard(company.companyId);
    if (TYPE_RULES[data.type].verifiedToCreate && !card.capabilities.includes('CREATE_SUPPLIER_REQUEST')) {
      throw this.capabilityRequired();
    }
    const content = mergeInput(EMPTY_CONTENT(data.type), data);
    const id = uuidv7(this.clock.now().getTime());
    await this.transactions.run(async (tx) => {
      await tx.opportunity.create({
        data: { id, companyId: company.companyId, type: data.type, ...contentColumns(content) },
      });
      await this.audit.record({
        actor: auditActorOf(company),
        action: 'opportunity.create',
        entityType: 'opportunity',
        entityId: id,
        changes: { after: { type: data.type, status: 'DRAFT' } },
      });
    });
    return this.getOwn(actor, id);
  }

  /** Edits a DRAFT or CHANGES_REQUESTED listing (`NOT_EDITABLE` otherwise; the status stays). */
  async update(actor: Actor | undefined, opportunityId: string, input: unknown): Promise<OpportunityView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    const data = parseInput(opportunityInputSchema, input);
    await this.transactions.run(async (tx) => {
      const row = await this.lockOwn(tx, company.companyId, opportunityId);
      if (!isEditable(row.status)) throw this.notEditable(row.status);
      const content = mergeInput(contentOf(row), data);
      await tx.opportunity.update({ where: { id: row.id }, data: contentColumns(content) });
      await this.audit.record({
        actor: auditActorOf(company),
        action: 'opportunity.update',
        entityType: 'opportunity',
        entityId: row.id,
        changes: { after: { fields: Object.keys(data) } },
      });
    });
    return this.getOwn(actor, opportunityId);
  }

  /**
   * DRAFT or CHANGES_REQUESTED → IN_REVIEW, after the listing is complete. A JOB from an
   * unverified company is refused (422 `COMPANY_NOT_VERIFIED`, BQ-80). The automated checks
   * run here; a flag opens a moderation case.
   */
  async submit(actor: Actor | undefined, opportunityId: string): Promise<OpportunityView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    const card = await this.requireCard(company.companyId);
    await this.transactions.run(async (tx) => {
      const row = await this.lockOwn(tx, company.companyId, opportunityId);
      const status = this.transition(row.status, 'SUBMIT');
      const content = contentOf(row);
      const review = await this.prepareReview(content, card);
      await tx.opportunity.update({
        where: { id: row.id },
        data: {
          status,
          ...review.columns,
          resubmitted: row.status === 'CHANGES_REQUESTED',
          reviewerNote: null,
        },
      });
      await this.recordSubmission(tx, company, row, content, review, false);
    });
    return this.getOwn(actor, opportunityId);
  }

  /** IN_REVIEW → DRAFT, to edit it again. */
  async returnToDraft(actor: Actor | undefined, opportunityId: string): Promise<OpportunityView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    await this.transactions.run(async (tx) => {
      const row = await this.lockOwn(tx, company.companyId, opportunityId);
      const status = this.transition(row.status, 'RETURN_TO_DRAFT');
      await tx.opportunity.update({
        where: { id: row.id },
        data: { status, submittedAt: null, reviewDueAt: null, slaAlertedAt: null },
      });
      await this.audit.record({
        actor: auditActorOf(company),
        action: 'opportunity.return_to_draft',
        entityType: 'opportunity',
        entityId: row.id,
        changes: { before: { status: row.status }, after: { status } },
      });
    });
    return this.getOwn(actor, opportunityId);
  }

  /** PUBLISHED → CLOSED (final). A pending revision is dropped. */
  async close(actor: Actor | undefined, opportunityId: string): Promise<OpportunityView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    await this.transactions.run(async (tx) => {
      const row = await this.lockOwn(tx, company.companyId, opportunityId);
      const status = this.transition(row.status, 'CLOSE');
      await tx.opportunity.update({
        where: { id: row.id },
        data: { status, closedAt: this.clock.now(), ...NO_REVISION },
      });
      await this.audit.record({
        actor: auditActorOf(company),
        action: 'opportunity.close',
        entityType: 'opportunity',
        entityId: row.id,
        changes: { before: { status: row.status }, after: { status } },
      });
      await this.emitClosed(row, company.userId, 'COMPANY', null);
    });
    return this.getOwn(actor, opportunityId);
  }

  // ---- Revisions of a live listing (P2) ----

  /** Copies the live content into a revision DRAFT; the listing stays up. */
  async startRevision(actor: Actor | undefined, opportunityId: string): Promise<OpportunityView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    await this.transactions.run(async (tx) => {
      const row = await this.lockOwn(tx, company.companyId, opportunityId);
      if (row.status === 'PUBLISHED' && row.revisionStatus) {
        throw new DomainError(ErrorCode.REVISION_EXISTS, 'A revision is already pending', HttpStatus.CONFLICT);
      }
      const next = this.revisionTransition(row, 'START');
      await tx.opportunity.update({
        where: { id: row.id },
        data: { revisionStatus: next, revisionDraft: draftJson(contentOf(row)), revisionNote: null },
      });
      await this.audit.record({
        actor: auditActorOf(company),
        action: 'opportunity.revision.start',
        entityType: 'opportunity',
        entityId: row.id,
        changes: { after: { revision_status: next } },
      });
    });
    return this.getOwn(actor, opportunityId);
  }

  /** Edits the pending revision (DRAFT or CHANGES_REQUESTED). */
  async updateRevision(actor: Actor | undefined, opportunityId: string, input: unknown): Promise<OpportunityView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    const data = parseInput(opportunityInputSchema, input);
    await this.transactions.run(async (tx) => {
      const row = await this.lockOwn(tx, company.companyId, opportunityId);
      if (!row.revisionStatus) throw this.noRevision();
      if (!isEditable(row.revisionStatus)) throw this.notEditable(row.revisionStatus);
      const content = mergeInput(draftContent(row.revisionDraft, row.type), data);
      await tx.opportunity.update({ where: { id: row.id }, data: { revisionDraft: draftJson(content) } });
      await this.audit.record({
        actor: auditActorOf(company),
        action: 'opportunity.revision.update',
        entityType: 'opportunity',
        entityId: row.id,
        changes: { after: { fields: Object.keys(data) } },
      });
    });
    return this.getOwn(actor, opportunityId);
  }

  /** Sends the revision for review; the live content stays until it is approved. */
  async submitRevision(actor: Actor | undefined, opportunityId: string): Promise<OpportunityView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    const card = await this.requireCard(company.companyId);
    await this.transactions.run(async (tx) => {
      const row = await this.lockOwn(tx, company.companyId, opportunityId);
      if (!row.revisionStatus) throw this.noRevision();
      const next = this.revisionTransition(row, 'SUBMIT');
      const content = draftContent(row.revisionDraft, row.type);
      const review = await this.prepareReview(content, card);
      await tx.opportunity.update({
        where: { id: row.id },
        data: {
          revisionStatus: next,
          ...review.columns,
          resubmitted: row.revisionStatus === 'CHANGES_REQUESTED',
          revisionNote: null,
        },
      });
      await this.recordSubmission(tx, company, row, content, review, true);
    });
    return this.getOwn(actor, opportunityId);
  }

  // ---- Shared ----

  /** Checks a submission and works out its review columns (refusing incomplete or ineligible ones). */
  private async prepareReview(content: OpportunityContent, card: CompanyCard) {
    const now = this.clock.now();
    const gaps = submitGaps(content, now);
    if (Object.keys(gaps).length > 0) throw new ValidationFailedError(gaps);
    const rule = TYPE_RULES[content.type];
    if (rule.verifiedToSubmit && !card.isVerified) {
      throw new DomainError(
        ErrorCode.COMPANY_NOT_VERIFIED,
        'Only verified companies can publish jobs',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (rule.verifiedToCreate && !card.capabilities.includes('CREATE_SUPPLIER_REQUEST')) {
      throw this.capabilityRequired();
    }
    const settings = await this.settings.current();
    const { checks, flags } = runChecks(
      content,
      { verified: card.isVerified },
      {
        hideContactDetails: settings.hide_contact_details_in_opportunities,
        autoFlagFees: settings.auto_flag_fee_opportunities,
      },
    );
    return {
      flags,
      dueAt: new Date(now.getTime() + settings.review_sla_hours * HOUR_MS),
      columns: {
        submittedAt: now,
        reviewDueAt: new Date(now.getTime() + settings.review_sla_hours * HOUR_MS),
        slaAlertedAt: null,
        checks: checks as unknown as Prisma.InputJsonArray,
        autoFlagged: flags.length > 0,
      },
    };
  }

  private async recordSubmission(
    tx: Tx,
    company: ReturnType<typeof requireCompanyActor>,
    row: Row,
    content: OpportunityContent,
    review: { flags: string[]; dueAt: Date },
    revision: boolean,
  ): Promise<void> {
    await this.audit.record({
      actor: auditActorOf(company),
      action: revision ? 'opportunity.revision.submit' : 'opportunity.submit',
      entityType: 'opportunity',
      entityId: row.id,
      changes: { after: { status: 'IN_REVIEW', auto_flagged: review.flags.length > 0 } },
    });
    const actor = { type: 'USER' as const, user_id: company.userId };
    await this.outbox.emit({
      name: 'opportunity.submitted',
      aggregateType: 'opportunity',
      aggregateId: row.id,
      actor,
      data: {
        opportunity_id: row.id,
        company_id: row.companyId,
        type: row.type,
        revision,
        due_at: review.dueAt.toISOString(),
      },
    });
    if (review.flags.length > 0) {
      await this.outbox.emit({
        name: 'opportunity.auto_flagged',
        aggregateType: 'opportunity',
        aggregateId: row.id,
        actor,
        data: {
          opportunity_id: row.id,
          owner_user_id: company.userId,
          title: content.title,
          preview: listingText(content).slice(0, 280),
          reasons: review.flags,
        },
      });
    }
  }

  private async emitClosed(
    row: Row,
    ownerUserId: string,
    by: 'COMPANY' | 'STAFF' | 'SYSTEM',
    message: string | null,
  ): Promise<void> {
    await this.outbox.emit({
      name: 'opportunity.closed',
      aggregateType: 'opportunity',
      aggregateId: row.id,
      actor: by === 'COMPANY' ? { type: 'USER', user_id: ownerUserId } : { type: 'SYSTEM', user_id: null },
      data: {
        opportunity_id: row.id,
        company_id: row.companyId,
        owner_user_id: ownerUserId,
        title: row.title,
        type: row.type,
        closed_by: by,
        message,
      },
    });
  }

  /** Listings the viewer may see: live, not past closing, from an active company, for its audience. */
  private visibleTo(viewer: Viewer): Prisma.OpportunityWhereInput {
    const now = this.clock.now();
    const live: Prisma.OpportunityWhereInput = {
      status: 'PUBLISHED',
      OR: [{ closesAt: null }, { closesAt: { gt: now } }],
      company: { accountUser: { status: 'ACTIVE' } },
    };
    if (viewer.kind === 'member') return { AND: [live, { type: { in: INDIVIDUAL_TYPES } }] };
    return {
      AND: [
        live,
        {
          OR: [
            { type: { in: INDIVIDUAL_TYPES } },
            {
              type: 'SUPPLIER_REQUEST',
              companyId: { not: viewer.card.id },
              supplierTypes: { has: viewer.card.companyType as never },
            },
          ],
        },
      ],
    };
  }

  private async views(rows: Row[], owner: boolean): Promise<OpportunityView[]> {
    if (rows.length === 0) return [];
    const cards = await this.companies.cards(rows.map((r) => r.companyId));
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      content: contentOf(row),
      company: cards.get(row.companyId)!,
      postedAt: row.publishedAt ?? row.createdAt,
      // Applications arrive with Phase 5B.
      applicants: 0,
      ...(owner
        ? {
            reviewerNote: row.reviewerNote,
            revision: row.revisionStatus
              ? {
                  status: row.revisionStatus,
                  draft: draftContent(row.revisionDraft, row.type),
                  reviewerNote: row.revisionNote,
                }
              : null,
          }
        : {}),
    }));
  }

  private async viewer(actor: Actor | undefined): Promise<Viewer> {
    if (actor?.kind === 'member') return { kind: 'member', userId: actor.userId };
    if (actor?.kind === 'company') {
      return { kind: 'company', userId: actor.userId, card: await this.requireCard(actor.companyId) };
    }
    throw new ForbiddenError('This is for app accounts');
  }

  private async requireCard(companyId: string): Promise<CompanyCard> {
    const found = await this.companies.card(companyId);
    if (!found) throw new NotFoundError('Company not found');
    return found;
  }

  private async findOwn(db: Tx | PrismaService, companyId: string, opportunityId: string): Promise<Row> {
    const row = isUuid(opportunityId)
      ? await db.opportunity.findFirst({ where: { id: opportunityId, companyId } })
      : null;
    if (!row) throw new NotFoundError('Opportunity not found');
    return row;
  }

  private async lockOwn(tx: Tx, companyId: string, opportunityId: string): Promise<Row> {
    if (!isUuid(opportunityId)) throw new NotFoundError('Opportunity not found');
    await tx.$queryRaw`SELECT 1 FROM app.opportunities WHERE id = ${opportunityId}::uuid FOR UPDATE`;
    return this.findOwn(tx, companyId, opportunityId);
  }

  private transition(from: OpportunityStatus, action: OpportunityAction): OpportunityStatus {
    const to = nextOpportunityStatus(from, action);
    if (!to) {
      throw new DomainError(
        ErrorCode.INVALID_TRANSITION,
        `Cannot ${action.toLowerCase().replace(/_/g, ' ')} a ${from.toLowerCase()} listing`,
        HttpStatus.CONFLICT,
      );
    }
    return to;
  }

  private revisionTransition(row: Row, action: RevisionAction): RevisionStatus {
    const to = nextRevisionStatus(row.status, row.revisionStatus, action);
    if (!to || to === 'NONE') {
      throw new DomainError(
        ErrorCode.INVALID_TRANSITION,
        row.status === 'PUBLISHED' ? 'The revision cannot move that way' : 'Only a published listing can be revised',
        HttpStatus.CONFLICT,
      );
    }
    return to;
  }

  private notEditable(status: string): DomainError {
    return new DomainError(
      ErrorCode.NOT_EDITABLE,
      `A ${status.toLowerCase().replace(/_/g, ' ')} listing cannot be edited${status === 'PUBLISHED' ? '; start a revision' : ''}`,
      HttpStatus.CONFLICT,
    );
  }

  private noRevision(): DomainError {
    return new DomainError(ErrorCode.INVALID_TRANSITION, 'There is no pending revision', HttpStatus.CONFLICT);
  }

  private capabilityRequired(): DomainError {
    return new DomainError(
      ErrorCode.CAPABILITY_REQUIRED,
      'Only verified companies can create supplier requests',
      HttpStatus.FORBIDDEN,
    );
  }
}

/** Columns that clear a revision. */
export const NO_REVISION = { revisionStatus: null, revisionDraft: Prisma.DbNull, revisionNote: null } as const;
