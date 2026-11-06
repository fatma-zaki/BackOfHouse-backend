import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { NotificationsService } from '../services/notifications.service';

const userEvent = z.object({ user_id: z.string().uuid() });

/** Notifications fed by identity events (domain-events.md §3.1). */
@Injectable()
export class AccountEventsHandler {
  constructor(private readonly notifications: NotificationsService) {}

  @OnDomainEvent('user.password.changed')
  async passwordChanged(event: DomainEvent): Promise<void> {
    const { user_id: userId } = userEvent.parse(event.payload);
    await this.notifications.notify(event, {
      type: 'account.password_changed',
      recipientUserIds: [userId],
      target: { type: 'PROFILE', id: userId },
    });
  }
}
