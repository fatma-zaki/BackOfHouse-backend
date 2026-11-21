// Public API of the opportunities module (nest-module-map.md §2.1 rule 1).
export { OpportunitiesModule } from './opportunities.module';
export { OpportunitiesService, type OpportunityView } from './services/opportunities.service';
export {
  OpportunityReviewService,
  REVIEW_REASONS,
  type OpportunityAdminView,
} from './services/opportunity-review.service';
export { OPPORTUNITY_TYPES, type OpportunityContent, type OpportunityType } from './domain/opportunity-type.policy';
export type { AutoCheck } from './domain/opportunity-checks';
export {
  ApplicationsService,
  type ApplicantApplicationView,
  type MyApplicationView,
} from './services/applications.service';
export {
  ADMIN_APPLICATION_STATUS,
  ADMIN_APPLICATION_STATUSES,
  ApplicationsAdminService,
  type ApplicationAdminView,
} from './services/applications-admin.service';
export type { ApplicantSnapshot, ApplicationView, ListingSnapshot } from './services/application-views';
export { APPLICATION_STATUSES, COMPANY_MOVES, type ApplicationStatus } from './domain/application-status.policy';
