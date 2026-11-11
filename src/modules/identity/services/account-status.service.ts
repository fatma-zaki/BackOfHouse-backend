import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, Clock } from '../../../common/clock/clock';
import { Actor, staffHas, StaffActor } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError, NotFoundError } from '../../../common/errors';
import { parseInput } from '../../../common/validation/parse-input';
import { TransactionRunner, Tx } from '../../../platform/database';
import { OutboxWriter } from '../../../platform/outbox';
import { AuditLogger, auditActorOf } from '../../audit';

const reasonSchema = z
  .object({
    reason: z
      .string({ error: 'is required' })
      .trim()
      .min(1, 'is required')
      .max(2000, 'must be at most 2000 characters'),
  })
  .strict();

/**
 * Suspending and reinstating member and Company Accounts (contracts/admin
 * /users/{id}/suspend, /unsuspend; `accounts.suspend`). A suspension ends every session
 * at once (`sessions_revoked_at`), refuses sign-in and is announced as `user.suspended`.
 */
@Injectable()
export class AccountStatusService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly audit: AuditLogger,
    private readonly outbox: OutboxWriter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async suspend(actor: Actor | undefined, userId: string, input: unknown): Promise<void> {
    const staff = this.requireStaff(actor);
    const { reason } = parseInput(reasonSchema, input);
    await this.transactions.run(async (tx) => {
      await this.suspendInTx(tx, staff, userId, reason);
    });
  }

  /** For bulk actions: suspends every ACTIVE account among `userIds`, skipping the rest. */
  async suspendMany(actor: Actor | undefined, userIds: readonly string[], reason: string): Promise<number> {
    const staff = this.requireStaff(actor);
    let count = 0;
    for (const userId of userIds) {
      await this.transactions.run(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { status: true } });
        if (user?.status !== 'ACTIVE') return;
        await this.suspendInTx(tx, staff, userId, reason);
        count += 1;
      });
    }
    return count;
  }

  async unsuspend(actor: Actor | undefined, userId: string): Promise<void> {
    const staff = this.requireStaff(actor);
    await this.transactions.run(async (tx) => {
      const user = await this.find(tx, userId);
      if (user.status !== 'SUSPENDED') throw this.invalid('This account is not suspended');
      await tx.user.update({ where: { id: userId }, data: { status: 'ACTIVE', suspendedAt: null } });
      await this.audit.record({
        actor: auditActorOf(staff),
        action: 'user.unsuspend',
        entityType: 'user',
        entityId: userId,
        changes: { before: { status: 'SUSPENDED' }, after: { status: 'ACTIVE' } },
      });
      await this.outbox.emit({
        name: 'user.reinstated',
        aggregateType: 'user',
        aggregateId: userId,
        actor: { type: 'STAFF', user_id: staff.staffId },
        data: { user_id: userId },
      });
    });
  }

  private async suspendInTx(tx: Tx, staff: StaffActor, userId: string, reason: string): Promise<void> {
    const user = await this.find(tx, userId);
    if (user.status !== 'ACTIVE') throw this.invalid('This account is already suspended');
    const now = this.clock.now();
    await tx.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED', suspendedAt: now, sessionsRevokedAt: now },
    });
    await this.audit.record({
      actor: auditActorOf(staff),
      action: 'user.suspend',
      entityType: 'user',
      entityId: userId,
      changes: { before: { status: 'ACTIVE' }, after: { status: 'SUSPENDED', reason } },
    });
    await this.outbox.emit({
      name: 'user.suspended',
      aggregateType: 'user',
      aggregateId: userId,
      actor: { type: 'STAFF', user_id: staff.staffId },
      data: { user_id: userId, reason_code: 'STAFF_DECISION' },
    });
  }

  private requireStaff(actor: Actor | undefined): StaffActor {
    if (!staffHas(actor, 'accounts.suspend')) throw new ForbiddenError();
    return actor;
  }

  private async find(tx: Tx, userId: string): Promise<{ status: 'ACTIVE' | 'SUSPENDED' }> {
    const user = z.string().uuid().safeParse(userId).success
      ? await tx.user.findUnique({ where: { id: userId }, select: { status: true } })
      : null;
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  private invalid(message: string): DomainError {
    return new DomainError(ErrorCode.INVALID_TRANSITION, message, HttpStatus.CONFLICT);
  }
}
