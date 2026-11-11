// Public API of the moderation module (nest-module-map.md §2.1 rule 1).
export { ModerationModule } from './moderation.module';
export {
  ModerationService,
  REPORT_REASONS,
  TARGET_TYPES,
  type ModerationCaseView,
  type ModerationTargetType,
} from './services/moderation.service';
