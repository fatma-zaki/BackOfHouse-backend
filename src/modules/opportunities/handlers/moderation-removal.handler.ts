import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { OpportunityReviewService } from '../services/opportunity-review.service';

const resolved = z.object({
  resolution: z.string(),
  target_type: z.string(),
  target_id: z.string().uuid(),
  message: z.string().nullable().optional(),
});

/**
 * Carries out "remove content" on a listing (moderation never writes another module's
 * tables, nest-module-map.md §4.11): a live listing closes, one not yet live is rejected.
 * Idempotent.
 */
@Injectable()
export class OpportunityModerationHandler {
  constructor(private readonly reviews: OpportunityReviewService) {}

  @OnDomainEvent('moderation.case.resolved')
  async resolved(event: DomainEvent): Promise<void> {
    const data = resolved.parse(event.payload);
    if (data.resolution !== 'CONTENT_REMOVED' || data.target_type !== 'OPPORTUNITY') return;
    await this.reviews.closeByModeration(data.target_id, data.message ?? null);
  }
}
