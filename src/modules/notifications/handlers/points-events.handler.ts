import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { NotificationsService } from '../services/notifications.service';

const credited = z.object({
  entry_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().int().positive(),
  type: z.string(),
  title: z.string(),
});

/** The member hears of points they earned (engagement `points.credited`). */
@Injectable()
export class PointsEventsHandler {
  constructor(private readonly notifications: NotificationsService) {}

  @OnDomainEvent('points.credited')
  async credited(event: DomainEvent): Promise<void> {
    const data = credited.parse(event.payload);
    // Points given back after a cancelled redemption are not "earned".
    if (data.type === 'REVERSAL') return;
    await this.notifications.notify(event, {
      type: 'points.earned',
      recipientUserIds: [data.user_id],
      payload: { points: String(data.amount), title: data.title },
    });
  }
}
