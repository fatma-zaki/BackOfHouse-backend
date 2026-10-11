/** Fixture: an app-surface file that imports the admin surface (must fail depcruise). */
import { AdminOnlyDto } from '../admin/admin-only.dto';

export const leaked: AdminOnlyDto = { internal_note: 'never shown to members' };
