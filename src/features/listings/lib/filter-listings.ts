import type {
  ListingStatusId,
  ListingSubmission,
  ListingsSortId,
  ListingsTabId,
} from '@/features/listings/types/listings.types'

const PENDING_STATUSES: readonly ListingStatusId[] = [
  'pending',
  'resubmitted',
  'autoFlagged',
]

export function isOpenListing(statusId: ListingStatusId): boolean {
  return PENDING_STATUSES.includes(statusId)
}

export function matchesListingsTab(
  listing: ListingSubmission,
  tab: ListingsTabId,
): boolean {
  switch (tab) {
    case 'pending':
      return isOpenListing(listing.statusId)
    case 'changesRequested':
      return listing.statusId === 'changesRequested'
    case 'live':
      return listing.statusId === 'live'
    case 'rejected':
      return listing.statusId === 'rejected'
    case 'closed':
      return listing.statusId === 'closed'
  }
}

export function filterAndSortListings(
  rows: readonly ListingSubmission[],
  options: {
    tab: ListingsTabId
    typeId: string
    cityId: string
    companyKey: string
    sort: ListingsSortId
  },
): ListingSubmission[] {
  let next = rows.filter((row) => matchesListingsTab(row, options.tab))

  if (options.typeId !== 'all') {
    next = next.filter((row) => row.typeId === options.typeId)
  }
  if (options.cityId !== 'all') {
    next = next.filter((row) => row.cityId === options.cityId)
  }
  if (options.companyKey !== 'all') {
    next = next.filter((row) => row.companyKey === options.companyKey)
  }

  const sorted = [...next]
  sorted.sort((a, b) =>
    options.sort === 'oldest'
      ? b.ageHours - a.ageHours
      : a.ageHours - b.ageHours,
  )
  return sorted
}

export function uniqueOptionValues(
  rows: readonly ListingSubmission[],
  pick: (row: ListingSubmission) => string,
): string[] {
  return [...new Set(rows.map(pick))].sort()
}

/** Tab badge counts derived from the same row set shown in the table. */
export function countListingsByTab(
  rows: readonly ListingSubmission[],
): Record<ListingsTabId, number> {
  const counts: Record<ListingsTabId, number> = {
    pending: 0,
    changesRequested: 0,
    live: 0,
    rejected: 0,
    closed: 0,
  }
  for (const row of rows) {
    if (matchesListingsTab(row, 'pending')) counts.pending += 1
    if (matchesListingsTab(row, 'changesRequested')) counts.changesRequested += 1
    if (matchesListingsTab(row, 'live')) counts.live += 1
    if (matchesListingsTab(row, 'rejected')) counts.rejected += 1
    if (matchesListingsTab(row, 'closed')) counts.closed += 1
  }
  return counts
}
