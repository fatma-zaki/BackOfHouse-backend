import type { Actor } from '../../../common/context/actor';
import { CompanyActor, requireCompanyActor } from '../../companies';

/** contracts/app `ApplicationStatus`. */
export const APPLICATION_STATUSES = [
  'SUBMITTED',
  'REVIEWED',
  'SHORTLISTED',
  'CONTACT',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** The statuses the company still decides on; the applicant may withdraw from these. */
export const ACTIVE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'SUBMITTED',
  'REVIEWED',
  'SHORTLISTED',
  'CONTACT',
];

/** What the company may move an application to (contracts/app POST /company/applicants/{id}/status). */
export const COMPANY_MOVES = ['REVIEWED', 'SHORTLISTED', 'CONTACT', 'ACCEPTED', 'REJECTED'] as const;

export type CompanyMove = (typeof COMPANY_MOVES)[number];

const NEXT_STEP: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  SUBMITTED: 'REVIEWED',
  REVIEWED: 'SHORTLISTED',
  SHORTLISTED: 'CONTACT',
  CONTACT: 'ACCEPTED',
};

export const isActive = (status: ApplicationStatus): boolean => ACTIVE_APPLICATION_STATUSES.includes(status);

/**
 * docs/app/README.md §4 "Company moves": one step at a time (SUBMITTED → REVIEWED →
 * SHORTLISTED → CONTACT → ACCEPTED), REJECTED from any active status, and ACCEPTED,
 * REJECTED and WITHDRAWN are final. Returns false for anything else.
 */
export function canCompanyMove(from: ApplicationStatus, to: CompanyMove): boolean {
  if (!isActive(from)) return false;
  if (to === 'REJECTED') return true;
  return NEXT_STEP[from] === to;
}

/** Only the applicant withdraws, and only an active application. */
export const canWithdraw = (from: ApplicationStatus): boolean => isActive(from);

/** Only a WITHDRAWN application lets the member apply to the same listing again. */
export const blocksNewApplication = (status: ApplicationStatus): boolean => status !== 'WITHDRAWN';

/**
 * Who may change an application's status: the Company Account that owns the listing, with
 * `REVIEW_APPLICANTS`. Nobody else, staff included, whatever their role (companies own the
 * decision; contracts/admin has no operation that writes it). Throws 403 `FORBIDDEN` for
 * anyone who is not a Company Account; the caller checks the listing belongs to it.
 */
export function requireApplicationDecider(actor: Actor | undefined): CompanyActor {
  return requireCompanyActor(actor, 'REVIEW_APPLICANTS');
}
