/**
 * Staff permission catalog and role matrix (docs/admin/docs/02-roles-and-permissions.md,
 * renamed per D1: listings.* → opportunities.*). Code checks permission keys, never
 * role names. Exposed read-only through GET /api/admin/v1/roles (Phase 2).
 */
export const STAFF_ROLES = ['SUPER_ADMIN', 'REVIEWER', 'EDITOR', 'SUPPORT', 'ANALYST'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const SA = 'SUPER_ADMIN';
const RV = 'REVIEWER';
const ED = 'EDITOR';
const SU = 'SUPPORT';
const AN = 'ANALYST';

/** Permission key → roles that hold it. */
const MATRIX = {
  'dashboard.overview': [SA],
  'analytics.view': [SA, RV, ED, SU, AN],
  'exports.create': [SA, AN],
  'exports.personal_data': [SA],
  'exports.schedule': [SA, AN],
  'opportunities.view': [SA, RV],
  'opportunities.review': [SA, RV],
  'applications.view': [SA],
  'suppliers.view': [SA, RV],
  'users.view': [SA, RV, SU],
  'users.contact.view': [SA, SU],
  'users.bulk': [SA],
  'users.support_actions': [SA, SU],
  'users.data_requests': [SA],
  'accounts.suspend': [SA],
  'companies.view': [SA, RV],
  'companies.edit': [SA, RV],
  'companies.feature': [SA],
  'verification.view': [SA, RV],
  'verification.decide': [SA, RV],
  'claims.view': [SA, RV],
  'claims.decide': [SA, RV],
  'imports.run': [SA, RV],
  'imports.users': [SA],
  'events.view': [SA, ED],
  'events.manage': [SA, ED],
  'events.check_in': [SA, ED],
  'points.award_events': [SA, ED],
  'points.view': [SA, SU],
  // Support is capped at 500 per member per month and may only add (points-adjustment policy, Phase 6).
  'points.adjust': [SA, SU],
  'rewards.view': [SA, SU],
  'rewards.manage': [SA],
  'rewards.fulfil': [SA, SU],
  'news.view': [SA, ED],
  'news.manage': [SA, ED],
  'broadcasts.view': [SA, ED],
  'broadcasts.manage': [SA, ED],
  'moderation.view': [SA, RV, SU],
  'moderation.act': [SA, RV],
  'support.view': [SA, RV, SU],
  'support.reply': [SA, SU],
  'notes.view': [SA, RV, SU],
  'notes.write': [SA, RV, SU],
  'team.view': [SA],
  'team.manage': [SA],
  'audit.view': [SA],
  'settings.view': [SA],
  'settings.manage': [SA],
} as const satisfies Record<string, readonly StaffRole[]>;

export type PermissionKey = keyof typeof MATRIX;

export const PERMISSION_KEYS = Object.keys(MATRIX) as PermissionKey[];

/** The permission keys a role holds, in catalog order. */
export function permissionsForRole(role: StaffRole): PermissionKey[] {
  return PERMISSION_KEYS.filter((key) => (MATRIX[key] as readonly StaffRole[]).includes(role));
}

/** The roles that hold a permission key. */
export function rolesWithPermission(key: PermissionKey): readonly StaffRole[] {
  return MATRIX[key];
}
