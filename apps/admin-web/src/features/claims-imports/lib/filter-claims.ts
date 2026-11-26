import type {
  ClaimRow,
  ClaimsTabId,
} from '@/features/claims-imports/types/claims-imports.types'

export function filterClaimsByTab(
  rows: readonly ClaimRow[],
  tab: ClaimsTabId,
): ClaimRow[] {
  return rows.filter((row) => row.tab === tab)
}

export function countClaimsByTab(
  rows: readonly ClaimRow[],
): Record<ClaimsTabId, number> {
  return {
    open: rows.filter((row) => row.tab === 'open').length,
    decided: rows.filter((row) => row.tab === 'decided').length,
  }
}
