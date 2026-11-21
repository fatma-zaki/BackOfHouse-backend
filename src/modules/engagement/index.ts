// Public API of the engagement module (nest-module-map.md §2.1 rule 1).
export { EngagementModule } from './engagement.module';
export {
  ADJUSTMENT_REASONS,
  PointsService,
  type PointCredit,
  type PointEntryView,
  type PointsSummaryView,
} from './services/points.service';
export {
  EARNING_RULE_KEYS,
  EarningRulesService,
  type EarningRuleKey,
  type EarningRuleView,
} from './services/earning-rules.service';
export { ACTIVITY_OF, levelFor, POINT_ENTRY_TYPES, type PointEntryType } from './domain/points';
