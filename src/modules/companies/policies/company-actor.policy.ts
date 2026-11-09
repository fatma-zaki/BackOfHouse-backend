import { HttpStatus } from '@nestjs/common';
import type { Actor } from '../../../common/context/actor';
import { DomainError, ErrorCode, ForbiddenError } from '../../../common/errors';

/**
 * Company permissions (contracts/app `CompanyPermission`). ADR-030: the single Company
 * Account holds all of them; the server checks a permission, never the role name (P3).
 */
export const COMPANY_PERMISSIONS = [
  'EDIT_PROFILE',
  'MANAGE_PROJECTS',
  'MANAGE_OPPORTUNITIES',
  'REVIEW_APPLICANTS',
  'RESPOND_TO_SUPPLIER_REQUESTS',
] as const;

export type CompanyPermission = (typeof COMPANY_PERMISSIONS)[number];

export type CompanyActor = Extract<Actor, { kind: 'company' }>;

/**
 * The company workspace (`/company/*`) is for Company Accounts only: anyone else gets
 * 403 `FORBIDDEN` (docs/app/README.md §2), and a missing permission 403
 * `PERMISSION_DENIED`. The app surface guard checks the same first.
 */
export function requireCompanyActor(actor: Actor | undefined, permission?: CompanyPermission): CompanyActor {
  if (actor?.kind !== 'company') throw new ForbiddenError('This is for company accounts');
  if (permission && !actor.permissions.includes(permission)) {
    throw new DomainError(ErrorCode.PERMISSION_DENIED, `Needs the ${permission} permission`, HttpStatus.FORBIDDEN);
  }
  return actor;
}
