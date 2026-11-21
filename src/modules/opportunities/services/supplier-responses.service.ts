import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { type Actor, staffHas } from '../../../common/context/actor';
import {
  DomainError,
  ErrorCode,
  ForbiddenError,
  NotEligibleError,
  NotFoundError,
  ValidationFailedError,
} from '../../../common/errors';
import { isUuid, uuidv7 } from '../../../common/ids/uuid-v7';
import { parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf } from '../../audit';
import { CompaniesService, CompanyActor, CompanyCard, CompanyProjectView, requireCompanyActor } from '../../companies';
import {
  BUYER_MOVES,
  canBuyerMove,
  isOpenResponse,
  respondRefusal,
  SupplierResponseStatus,
} from '../domain/supplier-response.policy';
import { NO_REVISION } from './opportunities.service';

const LIST_LIMIT = 200;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `must be at most ${max} characters`)
    .nullable()
    .optional()
    .transform((v) => v || null);

const respondSchema = z
  .object({
    request_id: z.string({ error: 'is required' }).max(64),
    message: z
      .string({ error: 'is required' })
      .trim()
      .min(1, 'is required')
      .max(1000, 'must be at most 1000 characters'),
    proposed_price: optionalText(200),
    setup_time: optionalText(200),
    project_ids: z
      .array(z.string().max(64))
      .max(20)
      .refine((ids) => new Set(ids).size === ids.length, 'must not repeat a project')
      .optional(),
  })
  .strict();

const moveSchema = z.object({ status: z.enum(BUYER_MOVES, { error: 'is not a status you can set' }) }).strict();

const include = {
  request: { select: { id: true, title: true, companyId: true, status: true, publishedAt: true } },
} as const;
type Row = Prisma.SupplierResponseGetPayload<{ include: typeof include }>;

/** contracts/app `SupplierResponse`, before presentation. */
export interface SupplierResponseView {
  id: string;
  requestId: string;
  requestTitle: string;
  buyer: CompanyCard;
  responder: CompanyCard;
  message: string;
  /** Only the buyer and the responder see it; null for anyone else. */
  proposedPrice: string | null;
  setupTime: string | null;
  status: SupplierResponseStatus;
  projects: CompanyProjectView[];
  submittedAt: Date;
  statusChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Supplier responses (contracts/app /company/supplier-responses*,
 * /company/supplier-requests/{id}/responses; docs/app/README.md §4 "Supplier requests").
 *
 * - Invited company types respond once per request (`ALREADY_RESPONDED`), never to their own
 *   (`NOT_ELIGIBLE` with a reason otherwise), with `RESPOND_TO_SUPPLIER_REQUESTS`.
 * - Only the buyer moves a response; selecting one rejects the other open responses and
 *   closes the request, in one transaction. No reopening, no switching supplier.
 * - The proposed price is shown only to the buyer and the responder.
 */
@Injectable()
export class SupplierResponsesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly companies: CompaniesService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** POST /company/supplier-responses. Eligibility (403), then duplicates (409), then the picks (422). */
  async respond(actor: Actor | undefined, input: unknown): Promise<SupplierResponseView> {
    const company = requireCompanyActor(actor, 'RESPOND_TO_SUPPLIER_REQUESTS');
    const data = parseInput(respondSchema, input);
    const card = await this.requireCard(company.companyId);
    const request = isUuid(data.request_id)
      ? await this.prisma.opportunity.findFirst({
          where: {
            id: data.request_id,
            status: { in: ['PUBLISHED', 'CLOSED'] },
            company: { accountUser: { status: 'ACTIVE' } },
          },
        })
      : null;
    if (!request) throw new NotFoundError('Supplier request not found');
    const now = this.clock.now();
    const refusal = respondRefusal(
      {
        type: request.type,
        companyId: request.companyId,
        supplierTypes: request.supplierTypes,
        open: request.status === 'PUBLISHED' && (!request.closesAt || request.closesAt > now),
      },
      { companyId: card.id, companyType: card.companyType },
    );
    if (refusal) throw new NotEligibleError(refusal, REFUSAL_MESSAGES[refusal]);
    await this.requireNoResponse(this.prisma, request.id, card.id);

    const projects = await this.companies.ownProjects(card.id, data.project_ids ?? []);
    if (projects.length !== (data.project_ids ?? []).length) {
      throw new ValidationFailedError({ project_ids: ["must be your company's own projects"] });
    }
    const id = uuidv7(now.getTime());
    await this.transactions.run(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`supplier_response:${request.id}:${card.id}`}))`;
      await this.requireNoResponse(tx, request.id, card.id);
      await tx.supplierResponse.create({
        data: {
          id,
          requestId: request.id,
          responderCompanyId: card.id,
          message: data.message,
          proposedPrice: data.proposed_price,
          setupTime: data.setup_time,
          projects: projects as unknown as Prisma.InputJsonArray,
          submittedAt: now,
          statusChangedAt: now,
        },
      });
      await this.audit.record({
        actor: auditActorOf(company),
        action: 'supplier_response.submit',
        entityType: 'supplier_response',
        entityId: id,
        changes: { after: { request_id: request.id, status: 'SUBMITTED' } },
      });
      const buyer = await this.companies.card(request.companyId);
      await this.outbox.emit({
        name: 'supplier_response.submitted',
        aggregateType: 'supplier_response',
        aggregateId: id,
        actor: { type: 'USER', user_id: company.userId },
        data: {
          response_id: id,
          request_id: request.id,
          request_title: request.title,
          buyer_user_id: buyer?.accountUserId ?? null,
          responder_name: card.name,
        },
      });
    });
    return this.get(actor, id);
  }

  /** GET /company/supplier-responses: this company's own responses, most recently updated first. */
  async mine(actor: Actor | undefined): Promise<SupplierResponseView[]> {
    const company = requireCompanyActor(actor);
    const rows = await this.prisma.supplierResponse.findMany({
      where: { responderCompanyId: company.companyId },
      include,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    });
    return this.views(rows, company.companyId);
  }

  /** GET /company/supplier-requests/{id}/responses: the buyer's view of one of its requests. */
  async forRequest(actor: Actor | undefined, requestId: string): Promise<SupplierResponseView[]> {
    const company = requireCompanyActor(actor);
    const owned = isUuid(requestId)
      ? await this.prisma.opportunity.count({
          where: { id: requestId, companyId: company.companyId, type: 'SUPPLIER_REQUEST' },
        })
      : 0;
    if (owned === 0) throw new NotFoundError('Supplier request not found');
    const rows = await this.prisma.supplierResponse.findMany({
      where: { requestId },
      include,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    });
    return this.views(rows, company.companyId);
  }

  /** GET /company/supplier-responses/{id}: as its buyer or its responder; 404 for anyone else. */
  async get(actor: Actor | undefined, responseId: string): Promise<SupplierResponseView> {
    const company = requireCompanyActor(actor);
    const row = isUuid(responseId)
      ? await this.prisma.supplierResponse.findFirst({
          where: {
            id: responseId,
            OR: [{ responderCompanyId: company.companyId }, { request: { companyId: company.companyId } }],
          },
          include,
        })
      : null;
    if (!row) throw new NotFoundError('Supplier response not found');
    return (await this.views([row], company.companyId))[0];
  }

  /**
   * POST /company/supplier-responses/{id}/status (buyer only, `MANAGE_OPPORTUNITIES`).
   * SELECTED, on an open request, also rejects every other open response and closes the
   * request in the same transaction.
   */
  async changeStatus(actor: Actor | undefined, responseId: string, input: unknown): Promise<SupplierResponseView> {
    const company = requireCompanyActor(actor, 'MANAGE_OPPORTUNITIES');
    const { status } = parseInput(moveSchema, input);
    await this.transactions.run(async (tx) => {
      const found = isUuid(responseId)
        ? await tx.supplierResponse.findFirst({ where: { id: responseId }, include })
        : null;
      if (!found) throw new NotFoundError('Supplier response not found');
      if (found.request.companyId !== company.companyId) {
        // The responder may read its response but never move it.
        if (found.responderCompanyId === company.companyId) {
          throw new DomainError(ErrorCode.FORBIDDEN, 'Only the buyer moves a response', HttpStatus.FORBIDDEN);
        }
        throw new NotFoundError('Supplier response not found');
      }
      // Lock the request first: selecting changes every response to it.
      await tx.$queryRaw`SELECT 1 FROM app.opportunities WHERE id = ${found.requestId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT 1 FROM app.supplier_responses WHERE id = ${found.id}::uuid FOR UPDATE`;
      const row = (await tx.supplierResponse.findUnique({ where: { id: found.id }, include }))!;
      if (!canBuyerMove(row.status, status)) throw this.invalidTransition(row.status, status);
      if (status === 'SELECTED' && row.request.status !== 'PUBLISHED') {
        throw new DomainError(
          ErrorCode.INVALID_TRANSITION,
          'Only a response to an open request can be selected',
          HttpStatus.CONFLICT,
        );
      }
      await this.moveTo(tx, company, row, status);
      if (status === 'SELECTED') await this.award(tx, company, row);
    });
    return this.get(actor, responseId);
  }

  /**
   * contracts/admin GET /supplier-requests/{id}/responses (`suppliers.view`), newest first.
   * Read-only, and without prices: those are for the buyer and the responder only.
   */
  async forRequestAdmin(
    actor: Actor | undefined,
    requestId: string,
  ): Promise<(SupplierResponseView & { repliedInHours: number | null })[]> {
    if (!staffHas(actor, 'suppliers.view')) throw new ForbiddenError();
    const request = isUuid(requestId)
      ? await this.prisma.opportunity.findFirst({ where: { id: requestId, type: 'SUPPLIER_REQUEST' } })
      : null;
    if (!request) throw new NotFoundError('Supplier request not found');
    const rows = await this.prisma.supplierResponse.findMany({
      where: { requestId },
      include,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: LIST_LIMIT,
    });
    return (await this.views(rows, null)).map((view, i) => {
      const publishedAt = rows[i].request.publishedAt;
      return {
        ...view,
        repliedInHours: publishedAt
          ? Math.round(((view.createdAt.getTime() - publishedAt.getTime()) / 3_600_000) * 10) / 10
          : null,
      };
    });
  }

  /** Rejects the other open responses and closes the request (final). */
  private async award(tx: Tx, company: CompanyActor, selected: Row): Promise<void> {
    const others = await tx.supplierResponse.findMany({
      where: { requestId: selected.requestId, id: { not: selected.id } },
      include,
    });
    for (const other of others.filter((o) => isOpenResponse(o.status))) {
      await this.moveTo(tx, company, other, 'REJECTED');
    }
    const now = this.clock.now();
    const request = await tx.opportunity.update({
      where: { id: selected.requestId },
      data: { status: 'CLOSED', closedAt: now, ...NO_REVISION },
    });
    await this.audit.record({
      actor: auditActorOf(company),
      action: 'opportunity.close',
      entityType: 'opportunity',
      entityId: request.id,
      changes: { before: { status: 'PUBLISHED' }, after: { status: 'CLOSED', selected_response_id: selected.id } },
    });
    await this.outbox.emit({
      name: 'opportunity.closed',
      aggregateType: 'opportunity',
      aggregateId: request.id,
      actor: { type: 'USER', user_id: company.userId },
      data: {
        opportunity_id: request.id,
        company_id: request.companyId,
        owner_user_id: company.userId,
        title: request.title,
        type: request.type,
        closed_by: 'COMPANY',
        message: null,
      },
    });
  }

  private async moveTo(tx: Tx, company: CompanyActor, row: Row, status: SupplierResponseStatus): Promise<void> {
    await tx.supplierResponse.update({
      where: { id: row.id },
      data: { status, statusChangedAt: this.clock.now() },
    });
    await this.audit.record({
      actor: auditActorOf(company),
      action: 'supplier_response.status_change',
      entityType: 'supplier_response',
      entityId: row.id,
      changes: { before: { status: row.status }, after: { status } },
    });
    const [buyer, responder] = await Promise.all([
      this.companies.card(row.request.companyId),
      this.companies.card(row.responderCompanyId),
    ]);
    await this.outbox.emit({
      name: 'supplier_response.status_changed',
      aggregateType: 'supplier_response',
      aggregateId: row.id,
      actor: { type: 'USER', user_id: company.userId },
      data: {
        response_id: row.id,
        request_id: row.requestId,
        request_title: row.request.title,
        responder_user_id: responder?.accountUserId ?? null,
        buyer_name: buyer?.name ?? '',
        status,
      },
    });
  }

  private async requireNoResponse(db: PrismaService | Tx, requestId: string, companyId: string): Promise<void> {
    const count = await db.supplierResponse.count({ where: { requestId, responderCompanyId: companyId } });
    if (count > 0) {
      throw new DomainError(
        ErrorCode.ALREADY_RESPONDED,
        'Your company already responded to this request',
        HttpStatus.CONFLICT,
      );
    }
  }

  /** `viewerCompanyId` sees the price only as the buyer or the responder (staff: null). */
  private async views(rows: Row[], viewerCompanyId: string | null): Promise<SupplierResponseView[]> {
    if (rows.length === 0) return [];
    const cards = await this.companies.cards(rows.flatMap((r) => [r.request.companyId, r.responderCompanyId]));
    return rows.map((row) => {
      const party =
        viewerCompanyId !== null &&
        (viewerCompanyId === row.request.companyId || viewerCompanyId === row.responderCompanyId);
      return {
        id: row.id,
        requestId: row.requestId,
        requestTitle: row.request.title,
        buyer: cards.get(row.request.companyId)!,
        responder: cards.get(row.responderCompanyId)!,
        message: row.message,
        proposedPrice: party ? row.proposedPrice : null,
        setupTime: row.setupTime,
        status: row.status,
        projects: row.projects as unknown as CompanyProjectView[],
        submittedAt: row.submittedAt,
        statusChangedAt: row.statusChangedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
  }

  private async requireCard(companyId: string): Promise<CompanyCard> {
    const card = await this.companies.card(companyId);
    if (!card) throw new NotFoundError('Company not found');
    return card;
  }

  private invalidTransition(from: SupplierResponseStatus, to: SupplierResponseStatus): DomainError {
    return new DomainError(
      ErrorCode.INVALID_TRANSITION,
      `Cannot move a ${from.toLowerCase()} response to ${to.toLowerCase()}`,
      HttpStatus.CONFLICT,
    );
  }
}

const REFUSAL_MESSAGES = {
  NOT_SUPPLIER_REQUEST: 'Only supplier requests take responses.',
  OWN_REQUEST: 'You cannot respond to your own request.',
  NOT_INVITED: 'This request does not invite your company type.',
  CLOSED: 'This request is not open for responses.',
} as const;
