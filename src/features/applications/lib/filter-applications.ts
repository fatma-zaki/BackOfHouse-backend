import type {
  ApplicationRow,
  ApplicationStatusId,
  ApplicationsTabId,
} from '@/features/applications/types/applications.types'

const DECISION_STATUSES: readonly ApplicationStatusId[] = [
  'selected',
  'notSelected',
]

export function matchesApplicationsTab(
  row: ApplicationRow,
  tab: ApplicationsTabId,
): boolean {
  switch (tab) {
    case 'all':
      return true
    case 'applied':
      return row.statusId === 'applied'
    case 'inReview':
      return row.statusId === 'inReview'
    case 'shortlisted':
      return row.statusId === 'shortlisted'
    case 'decision':
      return DECISION_STATUSES.includes(row.statusId)
  }
}

export function filterApplications(
  rows: readonly ApplicationRow[],
  options: {
    tab: ApplicationsTabId
    listingTypeId: string
    companyKey: string
    cityId: string
  },
): ApplicationRow[] {
  return rows.filter((row) => {
    if (!matchesApplicationsTab(row, options.tab)) return false
    if (
      options.listingTypeId !== 'all' &&
      row.listingTypeId !== options.listingTypeId
    ) {
      return false
    }
    if (
      options.companyKey !== 'all' &&
      row.companyKey !== options.companyKey
    ) {
      return false
    }
    if (options.cityId !== 'all' && row.cityId !== options.cityId) {
      return false
    }
    return true
  })
}

export function uniqueOptionValues(
  rows: readonly ApplicationRow[],
  pick: (row: ApplicationRow) => string,
): string[] {
  return [...new Set(rows.map(pick))].sort((a, b) => a.localeCompare(b))
}

export function paginateRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  return rows.slice(start, start + pageSize)
}
