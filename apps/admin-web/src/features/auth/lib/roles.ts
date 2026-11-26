/**
 * Demo team roles and permission matrix.
 * Mirrors the Team & roles product matrix — not a production authz API.
 */

export type Role = 'superAdmin' | 'reviewer' | 'editor' | 'support' | 'analyst'

export type Permission =
  | 'reviewListings'
  | 'verification'
  | 'moderation'
  | 'publishNews'
  | 'broadcasts'
  | 'adjustPoints'
  | 'support'
  | 'analytics'
  | 'export'
  | 'exportPersonalData'
  | 'suspendAccounts'
  | 'manageTeam'
  | 'importData'
  | 'featureCompanies'

/** `full` = can act · `view` = read-only. */
export type Access = 'full' | 'view'

export const ROLE_PERMISSIONS: Record<
  Role,
  Partial<Record<Permission, Access>>
> = {
  superAdmin: {
    reviewListings: 'full',
    verification: 'full',
    moderation: 'full',
    publishNews: 'full',
    broadcasts: 'full',
    adjustPoints: 'full',
    support: 'full',
    analytics: 'full',
    export: 'full',
    exportPersonalData: 'full',
    suspendAccounts: 'full',
    manageTeam: 'full',
    importData: 'full',
    featureCompanies: 'full',
  },
  reviewer: {
    reviewListings: 'full',
    verification: 'full',
    moderation: 'full',
    importData: 'full',
    support: 'view',
    analytics: 'view',
  },
  editor: {
    publishNews: 'full',
    broadcasts: 'full',
    analytics: 'view',
  },
  support: {
    reviewListings: 'view',
    moderation: 'view',
    adjustPoints: 'full',
    support: 'full',
    analytics: 'view',
  },
  analyst: {
    analytics: 'full',
    export: 'full',
  },
}

export type DemoSessionUser = {
  /** i18n key under `team.admins.names.*` */
  nameKey: string
  /** i18n key under `team.admins.emails.*` */
  emailKey: string
  initials: string
}

/** Sample signed-in teammate per role (demo only — no backend). */
export const ROLE_USER: Record<Role, DemoSessionUser> = {
  superAdmin: {
    nameKey: 'noraAlQahtani',
    emailKey: 'noraEmail',
    initials: 'NQ',
  },
  reviewer: {
    nameKey: 'hessaAlmarri',
    emailKey: 'hessaEmail',
    initials: 'HM',
  },
  editor: {
    nameKey: 'danaAlkhaldi',
    emailKey: 'danaEmail',
    initials: 'DK',
  },
  support: {
    nameKey: 'turkiAlamri',
    emailKey: 'turkiEmail',
    initials: 'TA',
  },
  analyst: {
    nameKey: 'ranaAlbassam',
    emailKey: 'ranaEmail',
    initials: 'RB',
  },
}

export const ROLES: readonly Role[] = [
  'superAdmin',
  'reviewer',
  'editor',
  'support',
  'analyst',
]

/** Where each role lands after sign-in or a demo role switch. */
export const ROLE_HOME: Record<Role, string> = {
  superAdmin: '/admin',
  reviewer: '/admin/my-queue',
  editor: '/admin/my-desk',
  support: '/admin/my-tickets',
  analyst: '/admin/home',
}

export function can(
  role: Role,
  permission: Permission,
  level: Access = 'view',
): boolean {
  const access = ROLE_PERMISSIONS[role][permission]
  return level === 'view' ? access !== undefined : access === 'full'
}

export function isRole(value: string | null | undefined): value is Role {
  return value != null && (ROLES as readonly string[]).includes(value)
}
