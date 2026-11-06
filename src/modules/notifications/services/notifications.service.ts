import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, Clock } from '../../../common/clock/clock';
import type { Prisma } from '../../../generated/prisma/client';
import { TransactionRunner } from '../../../platform/database';
import type { DomainEvent } from '../../../platform/outbox';
import { MembersService } from '../../identity';
import { SettingsService } from '../../settings';
import { catalogEntry, NotificationChannel, NotificationTargetType } from '../domain/catalog';
import { planDeliveries } from '../domain/delivery-plan';
import { DeliveryService } from './delivery.service';

export interface NotifySpec {
  type: string;
  recipientUserIds: readonly string[];
  /** Template variables: ids and minimal facts only. */
  payload?: Record<string, string | number>;
  target?: { type: NotificationTargetType; id: string | null };
}

/**
 * Turns a domain event into notifications (nest-module-map.md §4.12). Called only by
 * this module's outbox handlers, never by other modules (module-dependency-map.md C-8).
 * Idempotent per (event, recipient, type): a redelivered event creates nothing new.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly transactions: TransactionRunner,
    private readonly members: MembersService,
    private readonly settings: SettingsService,
    private readonly delivery: DeliveryService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Stores the in-app rows and their deliveries, then sends what is due. Returns the new notification ids. */
  async notify(event: DomainEvent, spec: NotifySpec): Promise<string[]> {
    const entry = catalogEntry(spec.type);
    const recipients = await this.members.activeIds([...new Set(spec.recipientUserIds)]);
    if (recipients.length === 0) return [];
    const { push_quiet_hours: quietHours } = await this.settings.current();
    const now = this.clock.now();

    const created = await this.transactions.run(async (tx) => {
      const rows = await tx.notification.createManyAndReturn({
        data: recipients.map((recipientUserId) => ({
          recipientUserId,
          type: entry.type,
          sourceEventId: event.event_id,
          payload: (spec.payload ?? {}) as Prisma.InputJsonObject,
          targetType: spec.target?.type ?? null,
          targetId: spec.target?.id ?? null,
          createdAt: now,
        })),
        skipDuplicates: true,
        select: { id: true, recipientUserId: true },
      });
      if (rows.length === 0) return [];

      const disabled = await tx.notificationPreference.findMany({
        where: { userId: { in: rows.map((row) => row.recipientUserId) }, notificationType: entry.type, enabled: false },
        select: { userId: true, channel: true },
      });
      const disabledFor = (userId: string) =>
        new Set<NotificationChannel>(disabled.filter((p) => p.userId === userId).map((p) => p.channel));

      await tx.notificationDelivery.createMany({
        data: rows.flatMap((row) =>
          planDeliveries(entry, { disabled: disabledFor(row.recipientUserId), now, quietHours }).map((plan) => ({
            notificationId: row.id,
            channel: plan.channel,
            status: plan.status,
            nextAttemptAt: plan.nextAttemptAt,
            lastError: plan.lastError,
          })),
        ),
      });
      return rows.map((row) => row.id);
    });

    // Sent now rather than on the next job run; failures stay QUEUED for the job.
    if (created.length > 0) await this.delivery.deliverDue({ notificationIds: created });
    return created;
  }
}
