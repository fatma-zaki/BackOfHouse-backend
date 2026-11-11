import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { NotificationsService } from '../services/notifications.service';

const resolved = z.object({
  resolution: z.enum(['DISMISSED', 'WARNED', 'CONTENT_REMOVED', 'ACCOUNT_SUSPENDED']),
  owner_user_id: z.string().uuid().nullable(),
  message: z.string().nullable(),
});

const TYPES: Partial<Record<z.infer<typeof resolved>['resolution'], string>> = {
  WARNED: 'moderation.warning',
  CONTENT_REMOVED: 'moderation.content_removed',
};

/**
 * Tells the owner about a warning or a removal (nest-module-map.md §4.11). Dismissals stay
 * silent, and a suspended account is already signed out.
 */
@Injectable()
export class ModerationEventsHandler {
  constructor(private readonly notifications: NotificationsService) {}

  @OnDomainEvent('moderation.case.resolved')
  async resolved(event: DomainEvent): Promise<void> {
    const data = resolved.parse(event.payload);
    const type = TYPES[data.resolution];
    if (!type || !data.owner_user_id) return;
    await this.notifications.notify(event, {
      type,
      recipientUserIds: [data.owner_user_id],
      payload: { message: data.message ?? '' },
      target: { type: 'PROFILE', id: data.owner_user_id },
    });
  }
}
