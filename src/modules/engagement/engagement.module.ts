import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { JobsModule } from '../../platform/jobs/jobs.module';
import { JobsService } from '../../platform/jobs/jobs.service';
import { ProfilesModule } from '../profiles';
import { ProfileCompletionHandler } from './handlers/profile-completion.handler';
import { EarningRulesService } from './services/earning-rules.service';
import { PointsService } from './services/points.service';

/**
 * Engagement (nest-module-map.md §4.19, layer L6): the points ledger, balances, levels and
 * earning rules (BQ-76, BQ-77). Job `points.reconcile` (nightly, 00:30 Riyadh) rebuilds any
 * balance that drifted from the ledger.
 */
@Module({
  imports: [JobsModule, ProfilesModule],
  providers: [PointsService, EarningRulesService, ProfileCompletionHandler],
  exports: [PointsService, EarningRulesService],
})
export class EngagementModule implements OnModuleInit {
  private readonly logger = new Logger(EngagementModule.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly points: PointsService,
  ) {}

  onModuleInit(): void {
    this.jobs.defineCron('points.reconcile', '30 21 * * *', async () => {
      const fixed = await this.points.reconcile();
      if (fixed > 0) this.logger.warn({ fixed }, 'Rebuilt points balances that drifted from the ledger');
    });
  }
}
