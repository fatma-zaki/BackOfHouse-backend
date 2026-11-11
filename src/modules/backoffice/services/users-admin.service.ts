import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Actor, StaffActor, staffHas } from '../../../common/context/actor';
import { ForbiddenError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import { normalizeArabic } from '../../../common/text';
import { parseInput } from '../../../common/validation/parse-input';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf, maskEmail } from '../../audit';
import { UserVerificationStatus, VerificationReviewService } from '../../verification';

const SORTS = { created_at: 'createdAt', full_name: 'fullName', last_active_at: 'lastActiveAt' } as const;

const listSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(/^-?(created_at|full_name|last_active_at)$/, 'must be created_at, full_name or last_active_at')
    .optional(),
  q: z.string().trim().max(100).optional(),
  type: z.enum(['INDIVIDUAL', 'STUDENT', 'COMPANY']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  city: z.string().trim().max(100).optional(),
  verified: z.boolean().optional(),
  joined_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date like 2026-11-01')
    .optional(),
});

const MAX_BULK = 500;
const bulkSchema = z
  .object({
    user_ids: z
      .array(z.string().uuid())
      .min(1, 'must name at least one user')
      .max(MAX_BULK, `must name at most ${MAX_BULK} users`)
      .refine((ids) => new Set(ids).size === ids.length, 'must not repeat a user'),
    action: z.enum(['MESSAGE', 'TAG', 'EXPORT', 'SUSPEND']),
    tag: z.string().max(60).optional(),
    message: z
      .object({ en: z.string().max(2000), ar: z.string().max(2000) })
      .partial()
      .optional(),
  })
  .strict();

/** contracts/admin `UserAdminRow`. */
export interface UserAdminRowView {
  id: string;
  fullName: string;
  emailMasked: string;
  type: 'INDIVIDUAL' | 'STUDENT' | 'COMPANY';
  city: string | null;
  verification: UserVerificationStatus;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt: Date;
  lastActiveAt: Date | null;
}

/** contracts/admin `UserAdminDetail`. */
export interface UserAdminDetailView {
  user: UserAdminRowView;
  /** Only for roles holding `users.contact.view`; null otherwise. */
  email: string | null;
  phone: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  allowedActions: ('RESET_PASSWORD' | 'REMOVE_VERIFICATION' | 'SUSPEND' | 'UNSUSPEND')[];
}

const withRelations = {
  profile: { select: { city: true } },
  company: { select: { city: true } },
} as const;

type UserRow = Prisma.UserGetPayload<{ include: typeof withRelations }>;

/** The bulk event the worker carries out (BulkUserActionsHandler). */
export const BULK_USER_ACTION_EVENT = 'users.bulk_action.requested';

/**
 * The admin users table and user detail (contracts/admin /users*). A read model over
 * identity, profiles, companies and verification. Contact details are masked unless the
 * role holds `users.contact.view`, and every unmasked view is audited.
 */
@Injectable()
export class UsersAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    private readonly verification: VerificationReviewService,
  ) {}

  async list(
    actor: Actor | undefined,
    input: unknown,
  ): Promise<{
    items: UserAdminRowView[];
    total: number;
    counts: Record<'all' | 'individuals' | 'companies' | 'suspended', number>;
  }> {
    this.requireStaff(actor, 'users.view');
    const query = parseInput(listSchema, input);
    const and: Prisma.UserWhereInput[] = [];
    if (query.type === 'COMPANY') and.push({ accountType: 'COMPANY' });
    if (query.type === 'STUDENT') and.push({ accountType: 'INDIVIDUAL', profileStatus: 'STUDENT' });
    if (query.type === 'INDIVIDUAL') and.push({ accountType: 'INDIVIDUAL', profileStatus: 'PROFESSIONAL' });
    if (query.status) and.push({ status: query.status });
    if (query.city) {
      const city = { equals: query.city, mode: 'insensitive' as const };
      and.push({ OR: [{ profile: { city } }, { company: { city } }] });
    }
    if (query.verified !== undefined) {
      and.push(
        query.verified
          ? { verificationRequest: { status: 'APPROVED' } }
          : { OR: [{ verificationRequest: null }, { verificationRequest: { status: { not: 'APPROVED' } } }] },
      );
    }
    if (query.joined_from) and.push({ createdAt: { gte: new Date(`${query.joined_from}T00:00:00+03:00`) } });
    if (query.q) {
      and.push({
        OR: [
          { fullNameNormalized: { contains: normalizeArabic(query.q) } },
          { email: { contains: query.q.toLowerCase() } },
          { phone: { contains: query.q.replace(/[^\d+]/g, '') || query.q } },
        ],
      });
    }
    const where: Prisma.UserWhereInput = { AND: and };
    const sort = query.sort ?? '-created_at';
    const field = SORTS[sort.replace('-', '') as keyof typeof SORTS];
    const [rows, total, all, individuals, companies, suspended] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: withRelations,
        orderBy: [{ [field]: sort.startsWith('-') ? 'desc' : 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { accountType: 'INDIVIDUAL' } }),
      this.prisma.user.count({ where: { accountType: 'COMPANY' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ]);
    const statuses = await this.verification.statusesFor(rows.map((r) => r.id));
    return {
      items: rows.map((row) => this.row(row, statuses.get(row.id) ?? 'NONE')),
      total,
      counts: { all, individuals, companies, suspended },
    };
  }

  async detail(actor: Actor | undefined, userId: string): Promise<UserAdminDetailView> {
    const staff = this.requireStaff(actor, 'users.view');
    const user = z.string().uuid().safeParse(userId).success
      ? await this.prisma.user.findUnique({ where: { id: userId }, include: withRelations })
      : null;
    if (!user) throw new NotFoundError('User not found');
    const [statuses, verified] = await Promise.all([
      this.verification.statusesFor([user.id]),
      this.verification.verifiedInfo(user.id),
    ]);
    const row = this.row(user, statuses.get(user.id) ?? 'NONE');
    const showContact = staffHas(staff, 'users.contact.view');
    if (showContact) {
      await this.transactions.run(() =>
        this.audit.record({
          actor: auditActorOf(staff),
          action: 'user.contact.view',
          entityType: 'user',
          entityId: user.id,
        }),
      );
    }
    const allowed: UserAdminDetailView['allowedActions'] = [];
    if (staffHas(staff, 'users.support_actions')) allowed.push('RESET_PASSWORD');
    if (staffHas(staff, 'verification.decide') && row.verification === 'VERIFIED') allowed.push('REMOVE_VERIFICATION');
    if (staffHas(staff, 'accounts.suspend')) allowed.push(user.status === 'ACTIVE' ? 'SUSPEND' : 'UNSUSPEND');
    return {
      user: row,
      email: showContact ? user.email : null,
      phone: showContact ? user.phone : null,
      verifiedAt: verified?.verifiedAt ?? null,
      verifiedBy: verified?.verifiedBy ?? null,
      allowedActions: allowed,
    };
  }

  /**
   * Bulk action (contracts/admin POST /users/bulk): accepted here, carried out by the
   * worker. SUSPEND also needs `accounts.suspend`, EXPORT `exports.create`. MESSAGE (Phase
   * 7 broadcasts), TAG and EXPORT (Phase 8) are not available yet.
   */
  async bulk(actor: Actor | undefined, input: unknown): Promise<{ jobId: string; status: 'QUEUED' }> {
    const staff = this.requireStaff(actor, 'users.bulk');
    const data = parseInput(bulkSchema, input);
    if (data.action === 'SUSPEND' && !staffHas(staff, 'accounts.suspend')) throw new ForbiddenError();
    if (data.action === 'EXPORT' && !staffHas(staff, 'exports.create')) throw new ForbiddenError();
    if (data.action !== 'SUSPEND') {
      throw new ValidationFailedError({ action: [`${data.action} is not available yet`] });
    }
    const jobId = await this.transactions.run(async () => {
      const id = await this.outbox.emit({
        name: BULK_USER_ACTION_EVENT,
        aggregateType: 'staff_account',
        aggregateId: staff.staffId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: { action: data.action, user_ids: data.user_ids, staff_id: staff.staffId },
      });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'users.bulk.request',
        entityType: 'outbox_event',
        entityId: id,
        changes: { after: { action: data.action, count: data.user_ids.length } },
      });
      return id;
    });
    return { jobId, status: 'QUEUED' };
  }

  private row(user: UserRow, verification: UserVerificationStatus): UserAdminRowView {
    return {
      id: user.id,
      fullName: user.fullName,
      emailMasked: maskEmail(user.email),
      type: user.accountType === 'COMPANY' ? 'COMPANY' : user.profileStatus === 'STUDENT' ? 'STUDENT' : 'INDIVIDUAL',
      city: user.profile?.city || user.company?.city || null,
      verification,
      status: user.status,
      joinedAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}
