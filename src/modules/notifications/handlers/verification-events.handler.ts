import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { StaffBellService } from '../services/staff-bell.service';

const submitted = z.object({ verification_id: z.string().uuid(), type: z.string() });

/** Notifications fed by verification events (domain-events.md §3.4). */
@Injectable()
export class VerificationEventsHandler {
  constructor(private readonly bell: StaffBellService) {}

  /** The review queue's staff (Reviewer, Super admin) see the new request in the bell. */
  @OnDomainEvent('verification.submitted')
  async submitted(event: DomainEvent): Promise<void> {
    const { verification_id: verificationId, type } = submitted.parse(event.payload);
    await this.bell.notifyStaff(event, {
      type: 'staff.verification_submitted',
      payload: { verification_id: verificationId, subject_type: type },
    });
  }
}
