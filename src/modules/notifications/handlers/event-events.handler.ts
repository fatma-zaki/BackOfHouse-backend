import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { NotificationsService } from '../services/notifications.service';

const alert = z.object({
  event_id: z.string().uuid(),
  title_en: z.string(),
  title_ar: z.string(),
  venue: z.string(),
  user_ids: z.array(z.string().uuid()),
});

/**
 * Event notifications (Phase 6B): the 24-hour reminder and a cancellation, to everyone
 * registered. One event carries a batch of members.
 */
@Injectable()
export class EventEventsHandler {
  constructor(private readonly notifications: NotificationsService) {}

  @OnDomainEvent('event.reminder')
  async reminder(event: DomainEvent): Promise<void> {
    await this.send(event, 'event.reminder');
  }

  @OnDomainEvent('event.cancelled')
  async cancelled(event: DomainEvent): Promise<void> {
    await this.send(event, 'event.cancelled');
  }

  private async send(event: DomainEvent, type: string): Promise<void> {
    const data = alert.parse(event.payload);
    await this.notifications.notify(event, {
      type,
      recipientUserIds: data.user_ids,
      payload: { title: data.title_en, venue: data.venue },
      target: { type: 'EVENT', id: data.event_id },
    });
  }
}
