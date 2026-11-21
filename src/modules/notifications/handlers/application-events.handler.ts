import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { NotificationsService } from '../services/notifications.service';

const changed = z.object({
  application_id: z.string().uuid(),
  opportunity_id: z.string().uuid(),
  applicant_user_id: z.string().uuid(),
  opportunity_title: z.string(),
  status: z.string(),
});

/**
 * The applicant hears of every official status change of their application (docs/app
 * README section 4 "Notifications"), SUBMITTED and WITHDRAWN included. Edits to the
 * listing never notify.
 */
@Injectable()
export class ApplicationEventsHandler {
  constructor(private readonly notifications: NotificationsService) {}

  @OnDomainEvent('application.status_changed')
  async statusChanged(event: DomainEvent): Promise<void> {
    const data = changed.parse(event.payload);
    await this.notifications.notify(event, {
      type: 'application.status_changed',
      recipientUserIds: [data.applicant_user_id],
      payload: {
        application_id: data.application_id,
        opportunity_title: data.opportunity_title,
        status: data.status,
      },
      target: { type: 'OPPORTUNITY', id: data.opportunity_id },
    });
  }
}
