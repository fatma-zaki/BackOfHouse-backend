import type {
  AuditActionId,
  AuditRow,
  AuditTabId,
} from '@/features/audit/types/audit.types'

export function matchesAuditTab(row: AuditRow, tab: AuditTabId): boolean {
  switch (tab) {
    case 'all':
      return true
    case 'decisions':
      return row.actionCategory === 'decisions'
    case 'points':
      return row.actionCategory === 'points'
    case 'exports':
      return row.actionCategory === 'exports'
    case 'access':
      return row.actionCategory === 'access'
  }
}

export function filterAuditLog(
  rows: readonly AuditRow[],
  options: {
    tab: AuditTabId
    adminKey: string
    actionId: string
  },
): AuditRow[] {
  return rows.filter((row) => {
    if (!matchesAuditTab(row, options.tab)) return false
    if (options.adminKey !== 'all' && row.adminKey !== options.adminKey) {
      return false
    }
    if (
      options.actionId !== 'all' &&
      row.actionId !== (options.actionId as AuditActionId)
    ) {
      return false
    }
    return true
  })
}

export function uniqueOptionValues(
  rows: readonly AuditRow[],
  pick: (row: AuditRow) => string,
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
