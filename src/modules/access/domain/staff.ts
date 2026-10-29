import type { StaffRole } from './permissions';

/** Each role's home screen in the admin web app (hand-off doc 02 "Each role's home and menu"). */
export const STAFF_HOME: Record<StaffRole, string> = {
  SUPER_ADMIN: 'overview',
  REVIEWER: 'reviewer-queue',
  EDITOR: 'editor-desk',
  SUPPORT: 'support-tickets',
  ANALYST: 'analyst-home',
};

export type StaffStatus = 'INVITED' | 'ACTIVE' | 'DISABLED';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The domain part of an email, lowercased; empty when there is no single `@`. */
export function emailDomain(email: string): string {
  const parts = normalizeEmail(email).split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * True only for an exact Workspace domain match (ADR-032): `a@backofhouse.sa` with
 * `backofhouse.sa`. Subdomains and look-alikes (`backofhouse.sa.evil.com`) fail.
 */
export function isWorkspaceEmail(email: string, workspaceDomain: string | undefined): boolean {
  return Boolean(workspaceDomain) && emailDomain(email) === workspaceDomain!.toLowerCase();
}

/**
 * LAST_SUPER_ADMIN (hand-off doc 01 §13): a change that would leave no active
 * Super admin is refused. `otherActiveSuperAdmins` excludes the account changed.
 */
export function wouldRemoveLastSuperAdmin(input: {
  current: { role: StaffRole; status: StaffStatus };
  next: { role: StaffRole; status: StaffStatus };
  otherActiveSuperAdmins: number;
}): boolean {
  const isActiveSuperAdmin = (s: { role: StaffRole; status: StaffStatus }) =>
    s.role === 'SUPER_ADMIN' && s.status === 'ACTIVE';
  return isActiveSuperAdmin(input.current) && !isActiveSuperAdmin(input.next) && input.otherActiveSuperAdmins === 0;
}

/**
 * Status changes an admin may make with PATCH /team/{id}. INVITED → ACTIVE only
 * happens through the person's own first Google sign-in.
 */
export function canChangeStatus(from: StaffStatus, to: 'ACTIVE' | 'DISABLED'): boolean {
  if (from === to) return true;
  if (to === 'DISABLED') return true;
  return from === 'DISABLED';
}
