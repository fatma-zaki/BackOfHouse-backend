// Public API of the backoffice module (nest-module-map.md §2.1 rule 1). Only surfaces and
// the worker import it.
export { BackofficeModule } from './backoffice.module';
export {
  UsersAdminService,
  BULK_USER_ACTION_EVENT,
  type UserAdminDetailView,
  type UserAdminRowView,
} from './services/users-admin.service';
export { NotesService, type NoteView } from './services/notes.service';
