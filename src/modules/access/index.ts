// Public API of the access module (nest-module-map.md §2.1 rule 1).
export { AccessModule } from './access.module';
export {
  PERMISSION_KEYS,
  STAFF_ROLES,
  permissionsForRole,
  rolesWithPermission,
  type PermissionKey,
  type StaffRole,
} from './domain/permissions';
export { STAFF_HOME } from './domain/staff';
export {
  StaffSessionsService,
  ADMIN_SESSION_COOKIE,
  ADMIN_CSRF_COOKIE,
  CSRF_HEADER,
  type NewSession,
} from './services/staff-sessions.service';
export { StaffSignInService, type SignInResult } from './services/staff-sign-in.service';
export { TeamService, type AdminMeView, type AdminUserView, type RolePermissionsView } from './services/team.service';
export { STAFF_IDENTITY_PROVIDER, type StaffIdentityProvider } from './infrastructure/staff-identity-provider';
export type { IdTokenClaims } from './infrastructure/id-token-verifier';
