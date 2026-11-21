import type { OpportunityType } from './opportunity-type.policy';

/** contracts/app `SupplierResponseStatus`. */
export const SUPPLIER_RESPONSE_STATUSES = ['SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'SELECTED', 'REJECTED'] as const;

export type SupplierResponseStatus = (typeof SUPPLIER_RESPONSE_STATUSES)[number];

/** What the buyer may move a response to (contracts/app POST /company/supplier-responses/{id}/status). */
export const BUYER_MOVES = ['REVIEWED', 'SHORTLISTED', 'SELECTED', 'REJECTED'] as const;

export type BuyerMove = (typeof BUYER_MOVES)[number];

/** Statuses the buyer still decides on. */
export const OPEN_RESPONSE_STATUSES: readonly SupplierResponseStatus[] = ['SUBMITTED', 'REVIEWED', 'SHORTLISTED'];

const NEXT_STEP: Partial<Record<SupplierResponseStatus, SupplierResponseStatus>> = {
  SUBMITTED: 'REVIEWED',
  REVIEWED: 'SHORTLISTED',
  SHORTLISTED: 'SELECTED',
};

export const isOpenResponse = (status: SupplierResponseStatus): boolean => OPEN_RESPONSE_STATUSES.includes(status);

/**
 * docs/app/README.md §4 "Buyer moves": SUBMITTED → REVIEWED → SHORTLISTED → SELECTED one
 * step at a time, REJECTED from any open status; SELECTED and REJECTED are final.
 * Selecting also needs the request to be open (the caller checks): it closes the request.
 */
export function canBuyerMove(from: SupplierResponseStatus, to: BuyerMove): boolean {
  if (!isOpenResponse(from)) return false;
  if (to === 'REJECTED') return true;
  return NEXT_STEP[from] === to;
}

/** contracts/app `Error.reason` with `NOT_ELIGIBLE` when responding. */
export type RespondRefusal = 'NOT_SUPPLIER_REQUEST' | 'OWN_REQUEST' | 'NOT_INVITED' | 'CLOSED';

/**
 * Whether a company may respond to a listing (docs/app/README.md §4 "Who sees and
 * responds"), in the contract's order. Null when it may.
 */
export function respondRefusal(
  request: { type: OpportunityType; companyId: string; supplierTypes: readonly string[]; open: boolean },
  responder: { companyId: string; companyType: string },
): RespondRefusal | null {
  if (request.type !== 'SUPPLIER_REQUEST') return 'NOT_SUPPLIER_REQUEST';
  if (request.companyId === responder.companyId) return 'OWN_REQUEST';
  if (!request.supplierTypes.includes(responder.companyType)) return 'NOT_INVITED';
  if (!request.open) return 'CLOSED';
  return null;
}
