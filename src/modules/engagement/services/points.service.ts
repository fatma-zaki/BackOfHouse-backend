import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, requireMember, StaffActor, staffHas } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError, ValidationFailedError } from '../../../common/errors';
import { isUuid, uuidv7 } from '../../../common/ids/uuid-v7';
import { decodeCursor, encodeCursor } from '../../../common/pagination';
import { RIYADH_OFFSET_MS, riyadhDay } from '../../../common/time/riyadh';
import { parseInput } from '../../../common/validation/parse-input';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf } from '../../audit';
import {
  adjustmentRefusal,
  balanceDelta,
  levelFor,
  levelTarget,
  POINT_ENTRY_TYPES,
  PointEntryType,
  SUPPORT_MONTHLY_CAP,
} from '../domain/points';

export const ADJUSTMENT_REASONS = [
  'ATTENDANCE_NOT_RECORDED',
  'VOLUNTEER_SHIFT_MISSING',
  'GOODWILL',
  'CORRECTION',
  'OTHER',
] as const;

const REASON_TITLES: Record<(typeof ADJUSTMENT_REASONS)[number], string> = {
  ATTENDANCE_NOT_RECORDED: 'Attendance added by Back of House',
  VOLUNTEER_SHIFT_MISSING: 'Volunteer shift added by Back of House',
  GOODWILL: 'Thank-you points from Back of House',
  CORRECTION: 'Correction from Back of House',
  OTHER: 'Adjustment from Back of House',
};

const adjustmentSchema = z
  .object({
    user_id: z.string({ error: 'is required' }).uuid('must be a user id'),
    amount: z
      .number({ error: 'is required' })
      .int('must be a whole number')
      .refine((n) => n !== 0, 'must not be zero')
      .refine((n) => Math.abs(n) <= 100_000, 'must be at most 100000 points'),
    reason: z.enum(ADJUSTMENT_REASONS, { error: 'is required' }),
    note: z.string({ error: 'is required' }).trim().min(5, 'must be at least 5 characters').max(1000),
    event_id: z.string().uuid().nullable().optional(),
    ticket_id: z.string().uuid().nullable().optional(),
    evidence: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

const historySchema = z.object({
  filter: z.enum(['ALL', 'EARNED', 'REDEEMED']).default('ALL'),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(50),
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date like 2026-11-01');

const ledgerSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(100),
  sort: z
    .string()
    .regex(/^-?created_at$/, 'must be created_at or -created_at')
    .optional(),
  from: date.optional(),
  to: date.optional(),
  type: z.enum(POINT_ENTRY_TYPES).optional(),
  user_id: z.string().uuid().optional(),
});

const cursorSchema = z.object({ cursor: z.string().max(512).optional(), limit: z.number().int().min(1).max(50) });
const CURSOR_KEYS = ['created_at', 'id'] as const;
const DAY_MS = 86_400_000;

/** A movement to write (one ledger entry). */
export interface PointCredit {
  userId: string;
  amount: number;
  type: PointEntryType;
  title: string;
  subtitle?: string | null;
  source?: { type: string; id: string } | null;
  /** Makes the movement happen once, e.g. `event_attendance:<user>:<event>`. */
  idempotencyKey: string;
  reason?: (typeof ADJUSTMENT_REASONS)[number] | null;
  note?: string | null;
  createdByStaffId?: string | null;
  reversesEntryId?: string | null;
}

/** A ledger entry, before presentation (contracts/app and contracts/admin `PointsTransaction`). */
export interface PointEntryView {
  id: string;
  userId: string;
  amount: number;
  type: PointEntryType;
  title: string;
  subtitle: string | null;
  source: { type: string; id: string } | null;
  reason: string | null;
  note: string | null;
  createdBy: { id: string; name: string } | null;
  createdAt: Date;
}

/** contracts/app `PointsSummary`, before presentation. */
export interface PointsSummaryView {
  balance: number;
  earnedThisMonth: number;
  level: number;
  levelTarget: number;
  totalEarned: number;
  totalSpent: number;
}

const include = { createdBy: { select: { id: true, name: true } } } as const;
type Row = Prisma.PointEntryGetPayload<{ include: typeof include }>;

/**
 * The points ledger (engagement, points-architecture.md, BQ-76). Every movement is one
 * append-only entry, written once per `idempotency_key`; `point_balances` is updated in the
 * same transaction under a row lock. Points never grant verification.
 */
@Injectable()
export class PointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  // ---- Writing ----

  /**
   * Writes one movement, joining the caller's transaction when there is one. Returns null
   * when this `idempotencyKey` was already written (a no-op success). Refuses a movement
   * that would take the balance below zero (`INSUFFICIENT_POINTS`).
   */
  async credit(entry: PointCredit): Promise<PointEntryView | null> {
    return this.transactions.run(async (tx) => {
      await tx.$executeRaw`INSERT INTO app.point_balances (user_id, updated_at) VALUES (${entry.userId}::uuid, now()) ON CONFLICT (user_id) DO NOTHING`;
      const [balance] = await tx.$queryRaw<{ balance: number; total_earned: number; total_spent: number }[]>`
        SELECT balance, total_earned, total_spent FROM app.point_balances WHERE user_id = ${entry.userId}::uuid FOR UPDATE`;
      if (await tx.pointEntry.count({ where: { idempotencyKey: entry.idempotencyKey } })) return null;
      const reversed = entry.reversesEntryId
        ? await tx.pointEntry.findUnique({ where: { id: entry.reversesEntryId }, select: { type: true } })
        : null;
      if (balance.balance + entry.amount < 0) {
        throw new DomainError(ErrorCode.INSUFFICIENT_POINTS, 'Not enough points', HttpStatus.CONFLICT);
      }
      const delta = balanceDelta(entry.type, entry.amount, reversed?.type ?? null);
      const id = uuidv7(this.clock.now().getTime());
      const row = await tx.pointEntry.create({
        data: {
          id,
          userId: entry.userId,
          amount: entry.amount,
          type: entry.type,
          title: entry.title,
          subtitle: entry.subtitle ?? null,
          sourceType: entry.source?.type ?? null,
          sourceId: entry.source?.id ?? null,
          reason: entry.reason ?? null,
          note: entry.note ?? null,
          createdByStaffId: entry.createdByStaffId ?? null,
          idempotencyKey: entry.idempotencyKey,
          reversesEntryId: entry.reversesEntryId ?? null,
          createdAt: this.clock.now(),
        },
        include,
      });
      await tx.pointBalance.update({
        where: { userId: entry.userId },
        data: {
          balance: { increment: entry.amount },
          totalEarned: { increment: delta.earned },
          totalSpent: { increment: delta.spent },
        },
      });
      const before = levelFor(balance.total_earned);
      const after = levelFor(balance.total_earned + delta.earned);
      await this.outbox.emit({
        name: entry.amount > 0 ? 'points.credited' : 'points.debited',
        aggregateType: 'user',
        aggregateId: entry.userId,
        actor: entry.createdByStaffId
          ? { type: 'STAFF', user_id: entry.createdByStaffId }
          : { type: 'SYSTEM', user_id: null },
        data: {
          entry_id: id,
          user_id: entry.userId,
          amount: entry.amount,
          type: entry.type,
          title: entry.title,
          balance: balance.balance + entry.amount,
          level_before: before,
          level_after: after,
        },
      });
      return view(row);
    });
  }

  /**
   * contracts/admin POST /points/adjustments (`points.adjust`). Reason and note are required;
   * Support adds points only, at most 500 per member per Riyadh month (422
   * `MONTHLY_CAP_REACHED`). Shown in the member's history and the audit log.
   */
  async adjust(actor: Actor | undefined, input: unknown): Promise<PointEntryView> {
    const staff = this.requireStaff(actor, 'points.adjust');
    const data = parseInput(adjustmentSchema, input);
    const user = await this.prisma.user.findUnique({ where: { id: data.user_id }, select: { accountType: true } });
    if (!user) throw new NotFoundError('User not found');
    if (user.accountType !== 'INDIVIDUAL') {
      throw new ValidationFailedError({ user_id: ['must be an individual; companies do not collect points'] });
    }
    return this.transactions.run(async (tx) => {
      // One adjustment at a time per member, so the Support cap holds under concurrency.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`points_adjust:${data.user_id}`}))`;
      const granted = staff.role === 'SUPPORT' ? await this.supportGrantedThisMonth(tx, data.user_id) : 0;
      const refusal = adjustmentRefusal(staff.role, data.amount, granted);
      if (refusal === 'NEGATIVE_NOT_ALLOWED') {
        throw new ValidationFailedError({ amount: ['must be positive; Support can only add points'] });
      }
      if (refusal === 'MONTHLY_CAP_REACHED') {
        throw new DomainError(
          ErrorCode.MONTHLY_CAP_REACHED,
          `Support can add at most ${SUPPORT_MONTHLY_CAP} points per member per month (${SUPPORT_MONTHLY_CAP - granted} left)`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const id = uuidv7(this.clock.now().getTime());
      let entry: PointEntryView | null;
      try {
        entry = await this.credit({
          userId: data.user_id,
          amount: data.amount,
          type: 'MANUAL_ADJUSTMENT',
          title: REASON_TITLES[data.reason],
          subtitle: null,
          source: data.event_id ? { type: 'event', id: data.event_id } : null,
          idempotencyKey: `manual_adjustment:${id}`,
          reason: data.reason,
          note: data.note,
          createdByStaffId: staff.staffId,
        });
      } catch (error) {
        if (error instanceof DomainError && error.code === ErrorCode.INSUFFICIENT_POINTS) {
          throw new ValidationFailedError({ amount: ['would take the balance below zero'] });
        }
        throw error;
      }
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'points.adjust',
        entityType: 'user',
        entityId: data.user_id,
        changes: {
          after: {
            amount: data.amount,
            reason: data.reason,
            note: data.note,
            ...(data.event_id ? { event_id: data.event_id } : {}),
            ...(data.ticket_id ? { ticket_id: data.ticket_id } : {}),
            ...(data.evidence ? { evidence: data.evidence } : {}),
          },
        },
      });
      return entry!;
    });
  }

  // ---- Reading: the member ----

  /** GET /me/points. */
  async summary(actor: Actor | undefined): Promise<PointsSummaryView> {
    const { userId } = requireMember(actor);
    return this.summaryOf(userId);
  }

  async summaryOf(userId: string): Promise<PointsSummaryView> {
    const [balance, month] = await Promise.all([
      this.prisma.pointBalance.findUnique({ where: { userId } }),
      this.prisma.pointEntry.aggregate({
        where: {
          userId,
          amount: { gt: 0 },
          type: { notIn: ['REWARD_REDEMPTION', 'REVERSAL'] },
          createdAt: { gte: this.monthStart() },
        },
        _sum: { amount: true },
      }),
    ]);
    const earned = balance?.totalEarned ?? 0;
    const current = balance?.balance ?? 0;
    return {
      balance: current,
      earnedThisMonth: month._sum.amount ?? 0,
      level: levelFor(earned),
      levelTarget: levelTarget(earned, current),
      totalEarned: earned,
      totalSpent: balance?.totalSpent ?? 0,
    };
  }

  /** GET /me/points/transactions, newest first. EARNED: points in; REDEEMED: rewards. */
  async history(actor: Actor | undefined, input: unknown): Promise<{ items: PointEntryView[]; hasMore: boolean }> {
    const { userId } = requireMember(actor);
    const query = parseInput(historySchema, input);
    const where: Prisma.PointEntryWhereInput = {
      userId,
      ...(query.filter === 'EARNED' ? { amount: { gt: 0 }, type: { not: 'REWARD_REDEMPTION' } } : {}),
      ...(query.filter === 'REDEEMED' ? { type: 'REWARD_REDEMPTION' } : {}),
    };
    const rows = await this.prisma.pointEntry.findMany({
      where,
      include,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.page_size,
      take: query.page_size + 1,
    });
    return { items: rows.slice(0, query.page_size).map(view), hasMore: rows.length > query.page_size };
  }

  // ---- Reading: the back office ----

  /** GET /points/ledger (`points.view`), newest first by default. */
  async ledger(actor: Actor | undefined, input: unknown): Promise<{ items: PointEntryView[]; total: number }> {
    this.requireStaff(actor, 'points.view');
    const query = parseInput(ledgerSchema, input);
    const and: Prisma.PointEntryWhereInput[] = [];
    if (query.type) and.push({ type: query.type });
    if (query.user_id) and.push({ userId: query.user_id });
    if (query.from) and.push({ createdAt: { gte: new Date(`${query.from}T00:00:00+03:00`) } });
    if (query.to) {
      and.push({ createdAt: { lt: new Date(new Date(`${query.to}T00:00:00+03:00`).getTime() + DAY_MS) } });
    }
    const where: Prisma.PointEntryWhereInput = { AND: and };
    const direction = query.sort === 'created_at' ? 'asc' : 'desc';
    const [rows, total] = await Promise.all([
      this.prisma.pointEntry.findMany({
        where,
        include,
        orderBy: [{ createdAt: direction }, { id: direction }],
        skip: (query.page - 1) * query.page_size,
        take: query.page_size,
      }),
      this.prisma.pointEntry.count({ where }),
    ]);
    return { items: rows.map(view), total };
  }

  /** GET /users/{id}/points (`users.view`), newest first, by cursor. */
  async ofUser(
    actor: Actor | undefined,
    userId: string,
    input: unknown,
  ): Promise<{ items: PointEntryView[]; nextCursor: string | null }> {
    this.requireStaff(actor, 'users.view');
    const query = parseInput(cursorSchema, input);
    if (!isUuid(userId) || (await this.prisma.user.count({ where: { id: userId } })) === 0) {
      throw new NotFoundError('User not found');
    }
    const after = query.cursor ? decodeCursor(query.cursor, CURSOR_KEYS) : null;
    const rows = await this.prisma.pointEntry.findMany({
      where: {
        userId,
        ...(after
          ? {
              OR: [
                { createdAt: { lt: new Date(String(after.created_at)) } },
                { createdAt: new Date(String(after.created_at)), id: { lt: String(after.id) } },
              ],
            }
          : {}),
      },
      include,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });
    const page = rows.slice(0, query.limit);
    const last = rows.length > query.limit ? page[page.length - 1] : null;
    return {
      items: page.map(view),
      nextCursor: last ? encodeCursor({ created_at: last.createdAt.toISOString(), id: last.id }) : null,
    };
  }

  // ---- Jobs ----

  /**
   * Nightly `points.reconcile`: rebuilds each balance from the ledger (the source of truth)
   * where the projection drifted. Returns how many balances were corrected.
   */
  async reconcile(): Promise<number> {
    const drifted = await this.prisma.$queryRaw<{ user_id: string }[]>`
      WITH sums AS (
        SELECT l.user_id,
               COALESCE(SUM(l.amount), 0)::int AS balance,
               COALESCE(SUM(-l.amount) FILTER (
                 WHERE l.type = 'REWARD_REDEMPTION'
                    OR (l.type = 'REVERSAL' AND r.type = 'REWARD_REDEMPTION')), 0)::int AS spent
          FROM app.point_ledger l
          LEFT JOIN app.point_ledger r ON r.id = l.reverses_entry_id
         GROUP BY l.user_id
      )
      SELECT s.user_id FROM sums s
        LEFT JOIN app.point_balances b ON b.user_id = s.user_id
       WHERE b.user_id IS NULL OR b.balance <> s.balance OR b.total_spent <> s.spent`;
    for (const { user_id: userId } of drifted) {
      await this.transactions.run(async (tx) => {
        await tx.$executeRaw`INSERT INTO app.point_balances (user_id, updated_at) VALUES (${userId}::uuid, now()) ON CONFLICT (user_id) DO NOTHING`;
        await tx.$queryRaw`SELECT 1 FROM app.point_balances WHERE user_id = ${userId}::uuid FOR UPDATE`;
        await tx.$executeRaw`
          WITH sums AS (
            SELECT COALESCE(SUM(l.amount), 0)::int AS balance,
                   COALESCE(SUM(-l.amount) FILTER (
                     WHERE l.type = 'REWARD_REDEMPTION'
                        OR (l.type = 'REVERSAL' AND r.type = 'REWARD_REDEMPTION')), 0)::int AS spent
              FROM app.point_ledger l
              LEFT JOIN app.point_ledger r ON r.id = l.reverses_entry_id
             WHERE l.user_id = ${userId}::uuid
          )
          UPDATE app.point_balances b
             SET balance = s.balance, total_spent = s.spent, total_earned = s.balance + s.spent, updated_at = now()
            FROM sums s
           WHERE b.user_id = ${userId}::uuid`;
      });
    }
    return drifted.length;
  }

  // ---- Shared ----

  private async supportGrantedThisMonth(tx: Tx, userId: string): Promise<number> {
    const result = await tx.pointEntry.aggregate({
      where: {
        userId,
        type: 'MANUAL_ADJUSTMENT',
        amount: { gt: 0 },
        createdBy: { role: 'SUPPORT' },
        createdAt: { gte: this.monthStart() },
      },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  /** The start of the current calendar month in Riyadh. */
  private monthStart(): Date {
    const month = riyadhDay(this.clock.now()).slice(0, 7);
    return new Date(new Date(`${month}-01T00:00:00Z`).getTime() - RIYADH_OFFSET_MS);
  }

  private requireStaff(actor: Actor | undefined, permission: string): StaffActor {
    if (!staffHas(actor, permission)) throw new ForbiddenError();
    return actor;
  }
}

function view(row: Row): PointEntryView {
  return {
    id: row.id,
    userId: row.userId,
    amount: row.amount,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle,
    source: row.sourceType && row.sourceId ? { type: row.sourceType, id: row.sourceId } : null,
    reason: row.reason,
    note: row.note,
    createdBy: row.createdBy ? { id: row.createdBy.id, name: row.createdBy.name } : null,
    createdAt: row.createdAt,
  };
}
