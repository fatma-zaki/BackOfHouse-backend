// Public API of the profiles module (nest-module-map.md §2.1 rule 1).
export { ProfilesModule } from './profiles.module';
export {
  ProfilesService,
  type ExperienceView,
  type ProfileProjectView,
  type ProfileView,
} from './services/profiles.service';
export {
  ProfessionalsService,
  type ProfessionalListQuery,
  type ProfessionalView,
} from './services/professionals.service';
export {
  visibleContact,
  CONTACT_VISIBLE_STATUSES,
  type ContactSubject,
  type ContactViewer,
} from './policies/contact-visibility.policy';
