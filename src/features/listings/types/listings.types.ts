/**
 * Feature-local Listings review contracts.
 * Not a backend DTO — replace when a real API contract exists.
 */

export type ListingTypeId =
  | 'job'
  | 'coop'
  | 'supplier'
  | 'volunteer'
  | 'project'

export type ListingStatusId =
  | 'pending'
  | 'resubmitted'
  | 'autoFlagged'
  | 'changesRequested'
  | 'live'
  | 'rejected'
  | 'closed'

export type ListingTone =
  | 'violet'
  | 'info'
  | 'warning'
  | 'success'
  | 'danger'
  | 'neutral'
  | 'muted'

export type ListingSlaTone = 'danger' | 'warning' | 'success' | 'muted'

export type ListingCheckState = 'pass' | 'warn' | 'fail'

export type ListingFactId = string

export type ListingCheck = {
  state: ListingCheckState
  textKey: string
}

export type ListingFact = {
  labelKey: string
  valueKey: string
}

export type ListingSubmission = {
  id: string
  titleKey: string
  companyKey: string
  companyVerified: boolean
  typeId: ListingTypeId
  typeTone: ListingTone
  cityId: string
  ageHours: number
  submittedKey: string
  slaLabelKey: string
  slaTone: ListingSlaTone
  statusId: ListingStatusId
  statusTone: ListingTone
  descriptionKey: string
  facts: ListingFact[]
  checks: ListingCheck[]
}

export type ListingsTabId =
  | 'pending'
  | 'changesRequested'
  | 'live'
  | 'rejected'
  | 'closed'

export type ListingsSortId = 'oldest' | 'newest'

export type ListingsReviewData = {
  submissions: ListingSubmission[]
  /** Static badge counts for tabs that are not fully listed in the mock. */
  tabCounts: Record<ListingsTabId, number>
  changeReasons: readonly string[]
  defaultChangeMessageKey: string
}

export type GetListingsReviewParams = Record<string, never>
