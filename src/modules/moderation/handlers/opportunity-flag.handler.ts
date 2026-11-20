import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { REPORT_REASONS, ModerationService } from '../services/moderation.service';

const flagged = z.object({
  opportunity_id: z.string().uuid(),
  owner_user_id: z.string().uuid(),
  title: z.string(),
  preview: z.string(),
  reasons: z.array(z.enum(REPORT_REASONS)).min(1),
});

/**
 * Opens (or joins) the moderation case of a listing the automated checks flagged on submit
 * (execution-plan Phase 5: auto-flag plus a moderation case through an event).
 */
@Injectable()
export class OpportunityFlagHandler {
  constructor(private readonly moderation: ModerationService) {}

  @OnDomainEvent('opportunity.auto_flagged')
  async flagged(event: DomainEvent): Promise<void> {
    const data = flagged.parse(event.payload);
    await this.moderation.flagOpportunity({
      opportunityId: data.opportunity_id,
      ownerUserId: data.owner_user_id,
      title: data.title,
      preview: data.preview,
      reasons: data.reasons,
    });
  }
}
