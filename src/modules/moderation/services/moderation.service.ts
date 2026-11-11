import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, requireMember, StaffActor, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import { parseInput } from '../../../common/validation/parse-input';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf, SYSTEM_ACTOR } from '../../audit';
import { CompaniesService } from '../../companies';
import { AccountStatusService, MembersService } from '../../identity';
import { ProfilesService } from '../../profiles';

export const REPORT_REASONS = ['SPAM', 'SCAM', 'FAKE_PROFILE', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER'] as const;
export const TARGET_TYPES = ['USER', 'COMPANY', 'COMPANY_PROJECT', 'PROFILE_PROJECT'] as const;
export type ModerationTargetType = (typeof TARGET_TYPES)[number];

const reportSchema = z
  .object({
    target_type: z.enum(TARGET_TYPES),
    target_id: z.string().uuid(),
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(2000).optional(),
  })
  .strict();

const listSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(/^-?created_at$/, 'must be created_at, optionally prefixed with -')
    .optional(),
  status: z.enum(['OPEN', 'AUTO_FLAGGED', 'RESOLVED']).optional(),
  target_type: z.enum(TARGET_TYPES).optional(),
  reason: z.enum(REPORT_REASONS).optional(),
});

const actionSchema = z
  .object({
    action: z.enum(['DISMISS', 'WARN', 'REMOVE_CONTENT', 'SUSPEND_ACCOUNT']),
    message: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine((a) => a.action !== 'WARN' || !!a.message, { path: ['message'], message: 'is required to warn' });

const RESOLUTION = {
  DISMISS: 'DISMISSED',
  WARN: 'WARNED',
  REMOVE_CONTENT: 'CONTENT_REMOVED',
  SUSPEND_ACCOUNT: 'ACCOUNT_SUSPENDED',
} as const;

/** contracts/admin `ModerationCase`. */
export interface ModerationCaseView {
  id: string;
  targetType: ModerationTargetType;
  target: { id: string; title: string; owner: string | null; preview: string | null };
  reportsCount: number;
  reasons: { reason: string; count: number }[];
  source: 'MEMBERS' | 'AUTO_FILTER';
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolution: 'DISMISSED' | 'WARNED' | 'CONTENT_REMOVED' | 'ACCOUNT_SUSPENDED' | null;
  accountHistory: string | null;
  createdAt: Date;
}

type CaseRow = Prisma.ModerationCaseGetPayload<{ include: { reports: { select: { reason: true } } } }>;

interface TargetInfo {
  title: string;
  ownerUserId: string;
  preview: string | null;
}

/**
 * Moderation (nest-module-map.md §4.11, contracts/admin /moderation/cases*). Reports on one
 * target join its one open case. Actions: dismiss, warn, remove the content (carried out by
 * the owning module on `moderation.case.resolved`) or suspend the owner's account (also
 * needs `accounts.suspend`). The owner is notified of a warning or a removal.
 */
@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly members: MembersService,
    private readonly accounts: AccountStatusService,
    private readonly companies: CompaniesService,
    private readonly profiles: ProfilesService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * A member reports a target (the app route is not in contracts/app yet, BQ-90). One
   * report per member per case; reporting again changes nothing.
   */
  async report(actor: Actor | undefined, input: unknown): Promise<{ caseId: string }> {
    const { userId } = requireMember(actor);
    const data = parseInput(reportSchema, input);
    const target = await this.describe(data.target_type, data.target_id);
    if (!target) throw new NotFoundError('Nothing to report');
    const caseId = await this.transactions.run(async (tx) => {
      const id = await this.openCase(tx, data.target_type, data.target_id, target.ownerUserId, 'MEMBERS');
      await tx.moderationReport.createMany({
        data: [{ caseId: id, reporterUserId: userId, reason: data.reason, details: data.details }],
        skipDuplicates: true,
      });
      return id;
    });
    return { caseId };
  }

  /** The automatic filter flags a target (Phase 5 opportunity checks feed this). */
  async autoFlag(
    targetType: ModerationTargetType,
    targetId: string,
    reason: (typeof REPORT_REASONS)[number],
  ): Promise<string> {
    const target = await this.describe(targetType, targetId);
    if (!target) throw new NotFoundError('Nothing to flag');
    return this.transactions.run((tx) =>
      this.openCase(tx, targetType, targetId, target.ownerUserId, 'AUTO_FILTER', reason),
    );
  }

  async list(actor: Actor | undefined, input: unknown): Promise<{ items: ModerationCaseView[]; total: number }> {
    this.requireStaff(actor, 'moderation.view');
    const query = parseInput(listSchema, input);
    const and: Prisma.ModerationCaseWhereInput[] = [];
    if (query.status === 'OPEN') and.push({ status: 'OPEN' });
    if (query.status === 'AUTO_FLAGGED') and.push({ status: 'OPEN', source: 'AUTO_FILTER' });
    if (query.status === 'RESOLVED') and.push({ status: { in: ['RESOLVED', 'DISMISSED'] } });
    if (query.target_type) and.push({ targetType: query.target_type });
    if (query.reason) and.push({ reports: { some: { reason: query.reason } } });
    const where: Prisma.ModerationCaseWhereInput = { AND: and };
    const [rows, total] = await Promise.all([
      this.prisma.moderationCase.findMany({
        where,
        include: { reports: { select: { reason: true } } },
        orderBy: [{ createdAt: query.sort === 'created_at' ? 'asc' : 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.moderationCase.count({ where }),
    ]);
    return { items: await Promise.all(rows.map((row) => this.view(row))), total };
  }

  async detail(actor: Actor | undefined, caseId: string): Promise<ModerationCaseView> {
    this.requireStaff(actor, 'moderation.view');
    return this.view(await this.find(caseId));
  }

  async act(actor: Actor | undefined, caseId: string, input: unknown): Promise<ModerationCaseView> {
    const staff = this.requireStaff(actor, 'moderation.act');
    const data = parseInput(actionSchema, input);
    const found = await this.find(caseId);
    if (found.status !== 'OPEN') throw this.closed();
    if (data.action === 'REMOVE_CONTENT' && !['COMPANY_PROJECT', 'PROFILE_PROJECT'].includes(found.targetType)) {
      throw new ValidationFailedError({ action: ['only projects can be removed; suspend the account instead'] });
    }
    if (data.action === 'SUSPEND_ACCOUNT') {
      if (!staffHas(staff, 'accounts.suspend')) throw new ForbiddenError('Suspending needs accounts.suspend');
      if (!found.ownerUserId) throw new ValidationFailedError({ action: ['this target has no account to suspend'] });
      await this.accounts.suspend(staff, found.ownerUserId, { reason: data.message || 'Moderation case' });
    }
    const resolution = RESOLUTION[data.action];
    await this.transactions.run(async (tx) => {
      const [row] = await tx.$queryRaw<{ status: string }[]>`
        SELECT status::text AS status FROM app.moderation_cases WHERE id = ${caseId}::uuid FOR UPDATE
      `;
      if (row.status !== 'OPEN') throw this.closed();
      await tx.moderationCase.update({
        where: { id: caseId },
        data: {
          status: data.action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
          resolution,
          resolutionMessage: data.message ?? null,
          resolvedByStaffId: staff.staffId,
          resolvedAt: this.clock.now(),
        },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: `moderation.${data.action.toLowerCase()}`,
        entityType: 'moderation_case',
        entityId: caseId,
        changes: { before: { status: 'OPEN' }, after: { resolution } },
      });
      await this.outbox.emit({
        name: 'moderation.case.resolved',
        aggregateType: 'moderation_case',
        aggregateId: caseId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: {
          case_id: caseId,
          resolution,
          target_type: found.targetType,
          target_id: found.targetId,
          owner_user_id: found.ownerUserId,
          message: data.message ?? null,
        },
      });
    });
    return this.view(await this.find(caseId));
  }

  /** The target's title and owner, or null when it no longer exists. */
  private async describe(type: ModerationTargetType, id: string): Promise<TargetInfo | null> {
    switch (type) {
      case 'USER': {
        const member = await this.members.contact(id);
        return member ? { title: member.fullName, ownerUserId: member.id, preview: null } : null;
      }
      case 'COMPANY':
        return this.companies.describe(id);
      case 'COMPANY_PROJECT':
        return this.companies.describeProject(id);
      case 'PROFILE_PROJECT':
        return this.profiles.describeProject(id);
    }
  }

  /** The open case for the target, created if needed; serialised per target. */
  private async openCase(
    tx: Tx,
    targetType: ModerationTargetType,
    targetId: string,
    ownerUserId: string,
    source: 'MEMBERS' | 'AUTO_FILTER',
    autoReason?: string,
  ): Promise<string> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`moderation:${targetType}:${targetId}`}, 0))`;
    const open = await tx.moderationCase.findFirst({
      where: { targetType, targetId, status: 'OPEN' },
      select: { id: true },
    });
    if (open) return open.id;
    const created = await tx.moderationCase.create({ data: { targetType, targetId, ownerUserId, source } });
    await this.audit.record({
      actor: SYSTEM_ACTOR,
      action: 'moderation.case.open',
      entityType: 'moderation_case',
      entityId: created.id,
      changes: { after: { target_type: targetType, source, ...(autoReason ? { reason: autoReason } : {}) } },
    });
    return created.id;
  }

  private async find(caseId: string): Promise<CaseRow> {
    const row = z.string().uuid().safeParse(caseId).success
      ? await this.prisma.moderationCase.findUnique({
          where: { id: caseId },
          include: { reports: { select: { reason: true } } },
        })
      : null;
    if (!row) throw new NotFoundError('Case not found');
    return row;
  }

  private async view(row: CaseRow): Promise<ModerationCaseView> {
    const [target, owner, history] = await Promise.all([
      this.describe(row.targetType, row.targetId),
      row.ownerUserId ? this.members.contact(row.ownerUserId) : null,
      row.ownerUserId
        ? this.prisma.moderationCase.groupBy({
            by: ['resolution'],
            where: { ownerUserId: row.ownerUserId, id: { not: row.id }, status: { not: 'OPEN' } },
            _count: true,
          })
        : [],
    ]);
    const counts = new Map<string, number>();
    for (const report of row.reports) counts.set(report.reason, (counts.get(report.reason) ?? 0) + 1);
    const earlier = history.reduce((sum, h) => sum + h._count, 0);
    const warned = history.find((h) => h.resolution === 'WARNED')?._count ?? 0;
    return {
      id: row.id,
      targetType: row.targetType,
      target: {
        id: row.targetId,
        title: target?.title ?? '(removed)',
        owner: owner?.fullName ?? null,
        preview: target?.preview ?? null,
      },
      reportsCount: row.reports.length,
      reasons: [...counts].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
      source: row.source,
      status: row.status,
      resolution: row.resolution,
      accountHistory: earlier === 0 ? null : `${earlier} earlier case(s), ${warned} warning(s)`,
      createdAt: row.createdAt,
    };
  }

  private closed(): DomainError {
    return new DomainError(ErrorCode.INVALID_TRANSITION, 'This case is already closed', HttpStatus.CONFLICT);
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}
