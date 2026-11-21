import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { NotificationsService } from '../services/notifications.service';
import { StaffBellService } from '../services/staff-bell.service';

const queued = z.object({ opportunity_id: z.string().uuid(), type: z.string(), revision: z.boolean() });
const decided = z.object({
  opportunity_id: z.string().uuid(),
  owner_user_id: z.string().uuid().nullable(),
  title: z.string(),
  message: z.string().nullable().optional(),
});
const followers = z.object({
  opportunity_id: z.string().uuid(),
  company_name: z.string(),
  title: z.string(),
  follower_user_ids: z.array(z.string().uuid()),
});
const closed = decided.extend({ closed_by: z.enum(['COMPANY', 'STAFF', 'SYSTEM']) });

/**
 * Notifications fed by listing events (execution-plan Phase 5): the review staff's bell, and
 * the Company Account's decisions. Messages are written as from Back of House.
 */
@Injectable()
export class OpportunityEventsHandler {
  constructor(
    private readonly bell: StaffBellService,
    private readonly notifications: NotificationsService,
  ) {}

  @OnDomainEvent('opportunity.submitted')
  async submitted(event: DomainEvent): Promise<void> {
    const data = queued.parse(event.payload);
    await this.bell.notifyStaff(event, {
      type: 'staff.opportunity_submitted',
      payload: { opportunity_id: data.opportunity_id, opportunity_type: data.type, revision: String(data.revision) },
    });
  }

  @OnDomainEvent('opportunity.review_overdue')
  async overdue(event: DomainEvent): Promise<void> {
    const data = queued.parse(event.payload);
    await this.bell.notifyStaff(event, {
      type: 'staff.opportunity_overdue',
      payload: { opportunity_id: data.opportunity_id, opportunity_type: data.type, revision: String(data.revision) },
    });
  }

  @OnDomainEvent('opportunity.published')
  async published(event: DomainEvent): Promise<void> {
    await this.notifyCompany(event, 'opportunity.approved', decided.parse(event.payload));
  }

  @OnDomainEvent('opportunity.changes_requested')
  async changesRequested(event: DomainEvent): Promise<void> {
    await this.notifyCompany(event, 'opportunity.changes_requested', decided.parse(event.payload));
  }

  @OnDomainEvent('opportunity.rejected')
  async rejected(event: DomainEvent): Promise<void> {
    await this.notifyCompany(event, 'opportunity.rejected', decided.parse(event.payload));
  }

  /** A followed company's new listing (one batch of followers per event). */
  @OnDomainEvent('opportunity.followers_alerted')
  async followersAlerted(event: DomainEvent): Promise<void> {
    const data = followers.parse(event.payload);
    await this.notifications.notify(event, {
      type: 'opportunity.new_from_followed',
      recipientUserIds: data.follower_user_ids,
      payload: { company_name: data.company_name, title: data.title },
      target: { type: 'OPPORTUNITY', id: data.opportunity_id },
    });
  }

  /** The company closing its own listing needs no message. */
  @OnDomainEvent('opportunity.closed')
  async closed(event: DomainEvent): Promise<void> {
    const data = closed.parse(event.payload);
    if (data.closed_by === 'COMPANY') return;
    await this.notifyCompany(
      event,
      data.closed_by === 'STAFF' ? 'opportunity.closed_by_staff' : 'opportunity.expired',
      data,
    );
  }

  private async notifyCompany(event: DomainEvent, type: string, data: z.infer<typeof decided>): Promise<void> {
    if (!data.owner_user_id) return;
    await this.notifications.notify(event, {
      type,
      recipientUserIds: [data.owner_user_id],
      payload: { title: data.title, message: data.message ?? '' },
      target: { type: 'OPPORTUNITY', id: data.opportunity_id },
    });
  }
}
