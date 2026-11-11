/**
 * Verification request states and the only ways between them (execution-plan.md Phase 4:
 * `verification-decision.policy.ts` is the only path to verified). A member is verified
 * exactly while their request is APPROVED; nothing else sets or clears it.
 *
 *   DRAFT ──submit──▶ IN_REVIEW ──approve──▶ APPROVED ──remove──▶ REJECTED
 *                       │  │                                         │
 *                       │  └──reject──▶ REJECTED ──submit──▶ IN_REVIEW
 *                       └──request_info──▶ MORE_INFO ──submit──▶ IN_REVIEW
 */
export const VERIFICATION_STATES = ['DRAFT', 'IN_REVIEW', 'MORE_INFO', 'APPROVED', 'REJECTED'] as const;
export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const VERIFICATION_TRANSITIONS = ['submit', 'approve', 'reject', 'request_info', 'remove'] as const;
export type VerificationTransition = (typeof VERIFICATION_TRANSITIONS)[number];

const TRANSITIONS: Record<VerificationTransition, { from: readonly VerificationState[]; to: VerificationState }> = {
  submit: { from: ['DRAFT', 'MORE_INFO', 'REJECTED'], to: 'IN_REVIEW' },
  approve: { from: ['IN_REVIEW'], to: 'APPROVED' },
  reject: { from: ['IN_REVIEW'], to: 'REJECTED' },
  request_info: { from: ['IN_REVIEW'], to: 'MORE_INFO' },
  remove: { from: ['APPROVED'], to: 'REJECTED' },
};

/** The state after `transition`, or null when it is not allowed from `state`. */
export function nextState(state: VerificationState, transition: VerificationTransition): VerificationState | null {
  const rule = TRANSITIONS[transition];
  return rule.from.includes(state) ? rule.to : null;
}

/** The member may upload or replace documents only while the request is open to them. */
export function canEditDocuments(state: VerificationState): boolean {
  return state === 'DRAFT' || state === 'MORE_INFO' || state === 'REJECTED';
}

/** contracts/app `VerificationRequestStatus`: editable requests show as DRAFT, the rest as IN_REVIEW. */
export function appStatusOf(state: VerificationState): 'DRAFT' | 'IN_REVIEW' {
  return canEditDocuments(state) ? 'DRAFT' : 'IN_REVIEW';
}

/** contracts/admin `VerificationRequest.status`. */
export type AdminVerificationStatus = 'PENDING' | 'MORE_INFO' | 'APPROVED' | 'REJECTED';

export function adminStatusOf(state: Exclude<VerificationState, 'DRAFT'>): AdminVerificationStatus {
  return state === 'IN_REVIEW' ? 'PENDING' : state;
}

export function stateOfAdminStatus(status: AdminVerificationStatus): Exclude<VerificationState, 'DRAFT'> {
  return status === 'PENDING' ? 'IN_REVIEW' : status;
}
