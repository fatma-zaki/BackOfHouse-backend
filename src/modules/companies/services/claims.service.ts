import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { ConflictError, DomainError, ErrorCode, ForbiddenError, NotFoundError } from '../../../common/errors';
import { parseInput } from '../../../common/validation/parse-input';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf } from '../../audit';

const listSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(/^-?created_at$/, 'must be created_at, optionally prefixed with -')
    .optional(),
  status: z.enum(['OPEN', 'APPROVED', 'REJECTED']).optional(),
});

const rejectSchema = z
  .object({ message: z.string({ error: 'is required' }).trim().min(1, 'is required').max(2000) })
  .strict();

const withParties = {
  company: { select: { id: true, slug: true, name: true, companyType: true, city: true, verifiedAt: true } },
  claimant: { select: { id: true, fullName: true, profileStatus: true } },
} as const;

type ClaimRow = Prisma.PageClaimGetPayload<{ include: typeof withParties }>;

/** contracts/admin `PageClaim`. */
export interface ClaimView {
  id: string;
  company: { id: string; slug: string; name: string; companyType: string; city: string | null; verified: boolean };
  claimant: { id: string; fullName: string; isStudent: boolean };
  email: string;
  evidence: 'DOMAIN_MATCH' | 'NEEDS_DOCUMENTS' | 'DOCUMENTS_PROVIDED';
  status: 'OPEN' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

/**
 * Company page claims (contracts/admin /claims*). Approval moves the page to the
 * claimant's account (ADR-030: one Company Account per company) and never verifies the
 * company; the previous account loses the page. Claims are created by staff imports and
 * a future app route (BQ-88).
 */
@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async list(actor: Actor | undefined, input: unknown): Promise<{ items: ClaimView[]; total: number }> {
    this.requireStaff(actor, 'claims.view');
    const query = parseInput(listSchema, input);
    const where: Prisma.PageClaimWhereInput = query.status ? { status: query.status } : {};
    const [rows, total] = await Promise.all([
      this.prisma.pageClaim.findMany({
        where,
        include: withParties,
        orderBy: [{ createdAt: query.sort === '-created_at' ? 'desc' : 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.pageClaim.count({ where }),
    ]);
    return { items: rows.map(view), total };
  }

  async approve(actor: Actor | undefined, claimId: string): Promise<ClaimView> {
    const staff = this.requireStaff(actor, 'claims.decide');
    const claim = await this.findOpen(claimId);
    await this.transactions.run(async (tx) => {
      const owned = await tx.company.count({ where: { accountUserId: claim.claimantUserId } });
      if (owned > 0) throw new ConflictError('The claimant already holds a company page');
      const company = await tx.company.findUniqueOrThrow({
        where: { id: claim.companyId },
        select: { accountUserId: true },
      });
      await tx.company.update({ where: { id: claim.companyId }, data: { accountUserId: claim.claimantUserId } });
      await tx.pageClaim.update({
        where: { id: claimId },
        data: { status: 'APPROVED', decidedAt: this.clock.now(), decidedByStaffId: staff.staffId },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'claim.approve',
        entityType: 'company',
        entityId: claim.companyId,
        changes: {
          before: { account_user_id: company.accountUserId },
          after: { account_user_id: claim.claimantUserId, claim_id: claimId },
        },
      });
      await this.outbox.emit({
        name: 'organization.claim.approved',
        aggregateType: 'company',
        aggregateId: claim.companyId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: { claim_id: claimId, organization_id: claim.companyId, user_id: claim.claimantUserId },
      });
      await this.outbox.emit({
        name: 'organization.ownership.transferred',
        aggregateType: 'company',
        aggregateId: claim.companyId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: {
          organization_id: claim.companyId,
          from_account_user_id: company.accountUserId,
          to_account_user_id: claim.claimantUserId,
        },
      });
    });
    return view(await this.find(claimId));
  }

  async reject(actor: Actor | undefined, claimId: string, input: unknown): Promise<ClaimView> {
    const staff = this.requireStaff(actor, 'claims.decide');
    const { message } = parseInput(rejectSchema, input);
    const claim = await this.findOpen(claimId);
    await this.transactions.run(async (tx) => {
      await tx.pageClaim.update({
        where: { id: claimId },
        data: {
          status: 'REJECTED',
          decidedAt: this.clock.now(),
          decidedByStaffId: staff.staffId,
          decisionMessage: message,
        },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'claim.reject',
        entityType: 'company',
        entityId: claim.companyId,
        changes: { after: { claim_id: claimId, status: 'REJECTED' } },
      });
      await this.outbox.emit({
        name: 'organization.claim.rejected',
        aggregateType: 'company',
        aggregateId: claim.companyId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: { claim_id: claimId, organization_id: claim.companyId, user_id: claim.claimantUserId },
      });
    });
    return view(await this.find(claimId));
  }

  private async find(claimId: string): Promise<ClaimRow> {
    const claim = z.string().uuid().safeParse(claimId).success
      ? await this.prisma.pageClaim.findUnique({ where: { id: claimId }, include: withParties })
      : null;
    if (!claim) throw new NotFoundError('Claim not found');
    return claim;
  }

  private async findOpen(claimId: string): Promise<ClaimRow> {
    const claim = await this.find(claimId);
    if (claim.status !== 'OPEN') {
      throw new DomainError(ErrorCode.INVALID_TRANSITION, 'This claim was already decided', HttpStatus.CONFLICT);
    }
    return claim;
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}

function view(row: ClaimRow): ClaimView {
  return {
    id: row.id,
    company: {
      id: row.company.id,
      slug: row.company.slug,
      name: row.company.name,
      companyType: row.company.companyType,
      city: row.company.city || null,
      verified: row.company.verifiedAt !== null,
    },
    claimant: {
      id: row.claimant.id,
      fullName: row.claimant.fullName,
      isStudent: row.claimant.profileStatus === 'STUDENT',
    },
    email: row.email,
    evidence: row.evidence,
    status: row.status,
    createdAt: row.createdAt,
  };
}
