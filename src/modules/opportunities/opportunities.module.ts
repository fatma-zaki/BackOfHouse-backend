import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { JobsModule } from '../../platform/jobs/jobs.module';
import { JobsService } from '../../platform/jobs/jobs.service';
import { CompaniesModule } from '../companies';
import { ProfilesModule } from '../profiles';
import { SettingsModule } from '../settings';
import { VerificationModule } from '../verification';
import { OpportunityModerationHandler } from './handlers/moderation-removal.handler';
import { ApplicationsAdminService } from './services/applications-admin.service';
import { ApplicationsService } from './services/applications.service';
import { OpportunitiesService } from './services/opportunities.service';
import { OpportunityReviewService } from './services/opportunity-review.service';
import { SupplierResponsesService } from './services/supplier-responses.service';

/**
 * Opportunities (nest-module-map.md §4.22, layer L6): listings, their review and revisions,
 * applications, and supplier responses. Depends on companies (cards, verification), settings (review SLA, check
 * switches), profiles (what an applicant picks, contact sharing) and verification (the
 * applicant's verified badge).
 * Jobs: `opportunity.autoclose` closes listings past `closes_at`; `opportunity.sla`
 * announces overdue reviews to staff.
 */
@Module({
  imports: [JobsModule, CompaniesModule, SettingsModule, ProfilesModule, VerificationModule],
  providers: [
    OpportunitiesService,
    OpportunityReviewService,
    ApplicationsService,
    ApplicationsAdminService,
    SupplierResponsesService,
    OpportunityModerationHandler,
  ],
  exports: [
    OpportunitiesService,
    OpportunityReviewService,
    ApplicationsService,
    ApplicationsAdminService,
    SupplierResponsesService,
  ],
})
export class OpportunitiesModule implements OnModuleInit {
  private readonly logger = new Logger(OpportunitiesModule.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly reviews: OpportunityReviewService,
  ) {}

  onModuleInit(): void {
    this.jobs.defineCron('opportunity.autoclose', '*/5 * * * *', async () => {
      const closed = await this.reviews.closeExpired();
      if (closed > 0) this.logger.log({ closed }, 'Closed listings past their closing time');
    });
    this.jobs.defineCron('opportunity.sla', '*/10 * * * *', async () => {
      const overdue = await this.reviews.alertOverdue();
      if (overdue > 0) this.logger.log({ overdue }, 'Announced overdue reviews');
    });
  }
}
