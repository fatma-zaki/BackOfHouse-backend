import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { NotificationsService } from '../services/notifications.service';
import { StaffBellService } from '../services/staff-bell.service';

const submitted = z.object({ verification_id: z.string().uuid(), type: z.string() });
const decided = z.object({
  verification_id: z.string().uuid(),
  subject_ref: z.object({ kind: z.literal('user'), id: z.string().uuid() }),
  message: z.string().nullable().optional(),
});

/** Notifications fed by verification events (domain-events.md §3.4): the bell, and the member's decisions. */
@Injectable()
export class VerificationEventsHandler {
  constructor(
    private readonly bell: StaffBellService,
    private readonly notifications: NotificationsService,
  ) {}

  /** The review queue's staff (Reviewer, Super admin) see the new request in the bell. */
  @OnDomainEvent('verification.submitted')
  async submitted(event: DomainEvent): Promise<void> {
    const { verification_id: verificationId, type } = submitted.parse(event.payload);
    await this.bell.notifyStaff(event, {
      type: 'staff.verification_submitted',
      payload: { verification_id: verificationId, subject_type: type },
    });
  }

  @OnDomainEvent('verification.approved')
  async approved(event: DomainEvent): Promise<void> {
    await this.notifyMember(event, 'verification.approved');
  }

  @OnDomainEvent('verification.info_requested')
  async infoRequested(event: DomainEvent): Promise<void> {
    await this.notifyMember(event, 'verification.info_requested');
  }

  @OnDomainEvent('verification.rejected')
  async rejected(event: DomainEvent): Promise<void> {
    await this.notifyMember(event, 'verification.rejected');
  }

  private async notifyMember(event: DomainEvent, type: string): Promise<void> {
    const data = decided.parse(event.payload);
    await this.notifications.notify(event, {
      type,
      recipientUserIds: [data.subject_ref.id],
      payload: type === 'verification.approved' ? {} : { message: data.message ?? '' },
      target: { type: 'PROFILE', id: data.subject_ref.id },
    });
  }
}
