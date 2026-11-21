import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DomainEvent, OnDomainEvent } from '../../../platform/outbox';
import { ProfilesService } from '../../profiles';
import { isProfileComplete } from '../domain/points';
import { EarningRulesService } from '../services/earning-rules.service';
import { PointsService } from '../services/points.service';

const changed = z.object({ user_id: z.string().uuid() });

/**
 * "Profile completed" (+50, once; BQ-77, definition decided 2026-11-21): the first time a
 * member's profile has a headline, city, about, an experience item, a skill and a project.
 * The ledger key makes it happen once even if the profile is emptied and filled again.
 */
@Injectable()
export class ProfileCompletionHandler {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly rules: EarningRulesService,
    private readonly points: PointsService,
  ) {}

  @OnDomainEvent('profile.changed')
  async profileChanged(event: DomainEvent): Promise<void> {
    const { user_id: userId } = changed.parse(event.payload);
    if (!isProfileComplete(await this.profiles.completionOf(userId))) return;
    const amount = await this.rules.pointsFor('PROFILE_COMPLETED');
    if (!amount) return;
    await this.points.credit({
      userId,
      amount,
      type: 'PROFILE_COMPLETED',
      title: 'Profile completed',
      idempotencyKey: `profile_completed:${userId}`,
    });
  }
}
