/**
 * Platform roles. Stored in Supabase `app_metadata.app_role`, which only the
 * service-role key can write, so a client cannot escalate its own role.
 *
 * Authority over a *specific company* is not expressed here: it comes from the
 * `company_members.role` row for that company (see CompaniesService). A role
 * therefore grants platform-wide capabilities only.
 */
export enum Role {
  USER = 'USER',
  COMPANY_MEMBER = 'COMPANY_MEMBER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

export enum Permission {
  // Profiles
  USER_READ = 'USER_READ',
  /** Read profiles that are not public (private professional profiles). */
  PROFILE_READ_PRIVATE = 'PROFILE_READ_PRIVATE',
  USER_UPDATE_OWN = 'USER_UPDATE_OWN',

  // Companies (resource authority is additionally checked per company)
  COMPANY_READ = 'COMPANY_READ',
  COMPANY_CREATE = 'COMPANY_CREATE',
  /** Administer any company, regardless of membership. */
  COMPANY_MANAGE_ANY = 'COMPANY_MANAGE_ANY',

  // Professionals
  PROFESSIONAL_READ = 'PROFESSIONAL_READ',
  PROFESSIONAL_WRITE_OWN = 'PROFESSIONAL_WRITE_OWN',

  // Events
  EVENT_READ = 'EVENT_READ',
  EVENT_CREATE = 'EVENT_CREATE',
  EVENT_REGISTER = 'EVENT_REGISTER',
  EVENT_MANAGE_ANY = 'EVENT_MANAGE_ANY',

  // Opportunities
  OPPORTUNITY_READ = 'OPPORTUNITY_READ',
  OPPORTUNITY_CREATE = 'OPPORTUNITY_CREATE',
  OPPORTUNITY_MANAGE_ANY = 'OPPORTUNITY_MANAGE_ANY',

  // News is first-party publishing: only the platform may author articles.
  NEWS_READ = 'NEWS_READ',
  NEWS_PUBLISH = 'NEWS_PUBLISH',
  NEWS_MODERATE = 'NEWS_MODERATE',
  NEWS_COMMENT = 'NEWS_COMMENT',
  NEWS_REACT = 'NEWS_REACT',

  // Courses are first-party content
  COURSE_READ = 'COURSE_READ',
  COURSE_MANAGE = 'COURSE_MANAGE',
  COURSE_ENROLL = 'COURSE_ENROLL',

  // Points: only trusted backend flows may create ledger entries
  POINTS_READ_OWN = 'POINTS_READ_OWN',
  POINTS_ADJUST = 'POINTS_ADJUST',

  // Rewards
  REWARD_READ = 'REWARD_READ',
  REWARD_MANAGE = 'REWARD_MANAGE',
  REWARD_REDEEM = 'REWARD_REDEEM',
  REWARD_FULFIL = 'REWARD_FULFIL',

  NOTIFICATION_READ_OWN = 'NOTIFICATION_READ_OWN',

  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DELETE_OWN = 'FILE_DELETE_OWN',

  AUDIT_READ = 'AUDIT_READ',
}

/** Capabilities every signed-in member of the ecosystem has. */
const BASE_MEMBER_PERMISSIONS: readonly Permission[] = [
  Permission.USER_READ,
  Permission.USER_UPDATE_OWN,
  Permission.COMPANY_READ,
  Permission.COMPANY_CREATE,
  Permission.PROFESSIONAL_READ,
  Permission.PROFESSIONAL_WRITE_OWN,
  Permission.EVENT_READ,
  Permission.EVENT_CREATE,
  Permission.EVENT_REGISTER,
  Permission.OPPORTUNITY_READ,
  Permission.OPPORTUNITY_CREATE,
  Permission.NEWS_READ,
  Permission.NEWS_COMMENT,
  Permission.NEWS_REACT,
  Permission.COURSE_READ,
  Permission.COURSE_ENROLL,
  Permission.POINTS_READ_OWN,
  Permission.REWARD_READ,
  Permission.REWARD_REDEEM,
  Permission.NOTIFICATION_READ_OWN,
  Permission.FILE_UPLOAD,
  Permission.FILE_DELETE_OWN,
];

/**
 * Single source of truth for role-based access control.
 * Company-scoped authority is intentionally absent — see the note on `Role`.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  [Role.USER]: BASE_MEMBER_PERMISSIONS,
  [Role.COMPANY_MEMBER]: BASE_MEMBER_PERMISSIONS,
  [Role.COMPANY_ADMIN]: BASE_MEMBER_PERMISSIONS,
  [Role.PLATFORM_ADMIN]: Object.values(Permission),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && Object.values(Role).includes(value as Role);
}

/** Coerces an untrusted claim into a known role, defaulting to the least privileged. */
export function parseRole(value: unknown, fallback: Role = Role.USER): Role {
  return isRole(value) ? value : fallback;
}
