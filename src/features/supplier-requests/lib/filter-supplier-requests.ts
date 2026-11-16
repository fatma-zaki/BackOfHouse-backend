import type {
  SupplierRequestRow,
  SupplierRequestsTabId,
} from '@/features/supplier-requests/types/supplier-requests.types'

export function matchesSupplierRequestsTab(
  row: SupplierRequestRow,
  tab: SupplierRequestsTabId,
): boolean {
  return row.lifecycleTab === tab
}

export function filterSupplierRequests(
  rows: readonly SupplierRequestRow[],
  options: {
    tab: SupplierRequestsTabId
    categoryId: string
    cityId: string
  },
): SupplierRequestRow[] {
  return rows.filter((row) => {
    if (!matchesSupplierRequestsTab(row, options.tab)) return false
    if (
      options.categoryId !== 'all' &&
      row.categoryId !== options.categoryId
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
  rows: readonly SupplierRequestRow[],
  pick: (row: SupplierRequestRow) => string,
): string[] {
  return [...new Set(rows.map(pick))].sort((a, b) => a.localeCompare(b))
}

export function countByTab(
  rows: readonly SupplierRequestRow[],
): Record<SupplierRequestsTabId, number> {
  return {
    open: rows.filter((row) => row.lifecycleTab === 'open').length,
    awarded: rows.filter((row) => row.lifecycleTab === 'awarded').length,
    closed: rows.filter((row) => row.lifecycleTab === 'closed').length,
  }
}
