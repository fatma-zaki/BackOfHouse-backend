/**
 * Who sees an individual's email and phone (contracts/app `ContactPrivacy`, docs/app
 * README §4 Profile). Private by default: both flags start false.
 *
 * - The member always sees their own.
 * - A company sees a shared value only from the CONTACT stage of the member's
 *   application to it (Phase 5 supplies the stage).
 * - Everyone else, other members included, never sees either.
 *
 * Every response that carries another person's contact details goes through here.
 */
export type ContactViewer =
  { kind: 'self' } | { kind: 'company'; applicationStatus: string | null } | { kind: 'other' };

/** Application statuses from which a company may see shared contact details (BQ-25). */
export const CONTACT_VISIBLE_STATUSES: readonly string[] = ['CONTACT', 'ACCEPTED'];

export interface ContactSubject {
  email: string;
  phone: string | null;
  shareEmail: boolean;
  sharePhone: boolean;
}

export function visibleContact(
  subject: ContactSubject,
  viewer: ContactViewer,
): { email: string | null; phone: string | null } {
  if (viewer.kind === 'self') return { email: subject.email, phone: subject.phone };
  const reachedContact =
    viewer.kind === 'company' &&
    viewer.applicationStatus !== null &&
    CONTACT_VISIBLE_STATUSES.includes(viewer.applicationStatus);
  return {
    email: reachedContact && subject.shareEmail ? subject.email : null,
    phone: reachedContact && subject.sharePhone ? subject.phone : null,
  };
}
