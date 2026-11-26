import type {
  CompaniesSortId,
  CompaniesTabId,
  CompanyRow,
} from '@/features/companies/types/companies.types'

export function matchesCompaniesTab(
  row: CompanyRow,
  tab: CompaniesTabId,
): boolean {
  switch (tab) {
    case 'all':
      return true
    case 'verified':
      return row.verificationStatusId === 'verified'
    case 'pendingVerification':
      return row.verificationStatusId === 'pending'
    case 'notVerified':
      return row.verificationStatusId === 'notVerified'
    case 'suspended':
      return row.verificationStatusId === 'suspended'
  }
}

function compareByName(
  a: CompanyRow,
  b: CompanyRow,
  pickName: (row: CompanyRow) => string,
): number {
  return pickName(a).localeCompare(pickName(b))
}

export function filterAndSortCompanies(
  rows: readonly CompanyRow[],
  options: {
    tab: CompaniesTabId
    cityId: string
    industryKey: string
    sort: CompaniesSortId
    nameForSort: (row: CompanyRow) => string
  },
): CompanyRow[] {
  let next = rows.filter((row) => matchesCompaniesTab(row, options.tab))

  if (options.cityId !== 'all') {
    next = next.filter((row) => row.cityId === options.cityId)
  }
  if (options.industryKey !== 'all') {
    next = next.filter((row) => row.industryKey === options.industryKey)
  }

  const sorted = [...next]
  sorted.sort((a, b) => {
    switch (options.sort) {
      case 'mostActive':
        return b.liveListings - a.liveListings
      case 'leastActive':
        return a.liveListings - b.liveListings
      case 'name':
        return compareByName(a, b, options.nameForSort)
    }
  })

  return sorted
}

export function uniqueOptionValues(
  rows: readonly CompanyRow[],
  pick: (row: CompanyRow) => string,
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
