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
