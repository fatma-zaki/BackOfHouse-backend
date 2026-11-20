/**
 * Opportunity states (contracts/app `OpportunityStatus`, execution-plan Phase 5). A listing
 * is written as a DRAFT, reviewed by Back of House (every listing, verified or not, D9),
 * then PUBLISHED until it is CLOSED. REJECTED is final and shows in the app as CLOSED.
 * PAUSED and ARCHIVED are in the contract but nothing moves a listing there yet.
 */
export const OPPORTUNITY_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'CHANGES_REQUESTED',
  'PUBLISHED',
  'PAUSED',
  'CLOSED',
  'ARCHIVED',
  'REJECTED',
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export type OpportunityAction = 'SUBMIT' | 'RETURN_TO_DRAFT' | 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'CLOSE';

const MOVES: Record<OpportunityAction, Partial<Record<OpportunityStatus, OpportunityStatus>>> = {
  SUBMIT: { DRAFT: 'IN_REVIEW', CHANGES_REQUESTED: 'IN_REVIEW' },
  RETURN_TO_DRAFT: { IN_REVIEW: 'DRAFT' },
  APPROVE: { IN_REVIEW: 'PUBLISHED' },
  REQUEST_CHANGES: { IN_REVIEW: 'CHANGES_REQUESTED' },
  REJECT: { IN_REVIEW: 'REJECTED' },
  CLOSE: { PUBLISHED: 'CLOSED' },
};

/** The status after `action`, or null when the move is not allowed. */
export function nextOpportunityStatus(from: OpportunityStatus, action: OpportunityAction): OpportunityStatus | null {
  return MOVES[action][from] ?? null;
}

/** Content is edited in place only before it goes live; published content changes through a revision. */
export function isEditable(status: OpportunityStatus): boolean {
  return status === 'DRAFT' || status === 'CHANGES_REQUESTED';
}

/**
 * A revision of a PUBLISHED listing (contracts/app `OpportunityRevision`). The live listing
 * stays up while it is written and reviewed; approval replaces the live content, and a
 * rejection drops the revision (null means no revision).
 */
export const REVISION_STATUSES = ['DRAFT', 'IN_REVIEW', 'CHANGES_REQUESTED'] as const;
export type RevisionStatus = (typeof REVISION_STATUSES)[number];
export type RevisionAction = 'START' | 'SUBMIT' | 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

const REVISION_MOVES: Record<RevisionAction, Partial<Record<RevisionStatus | 'NONE', RevisionStatus | 'NONE'>>> = {
  START: { NONE: 'DRAFT' },
  SUBMIT: { DRAFT: 'IN_REVIEW', CHANGES_REQUESTED: 'IN_REVIEW' },
  APPROVE: { IN_REVIEW: 'NONE' },
  REQUEST_CHANGES: { IN_REVIEW: 'CHANGES_REQUESTED' },
  REJECT: { IN_REVIEW: 'NONE' },
};

/**
 * The revision status after `action` (`NONE`: no revision any more), or undefined when the
 * move is not allowed. Revisions exist only on a PUBLISHED listing.
 */
export function nextRevisionStatus(
  listing: OpportunityStatus,
  from: RevisionStatus | null,
  action: RevisionAction,
): RevisionStatus | 'NONE' | undefined {
  if (listing !== 'PUBLISHED') return undefined;
  return REVISION_MOVES[action][from ?? 'NONE'];
}
