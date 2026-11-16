import type {
  ModerationReport,
  ModerationStatusId,
  ModerationTabId,
} from '@/features/moderation/types/moderation.types'

const RESOLVED_STATUSES: readonly ModerationStatusId[] = [
  'resolvedWarned',
  'resolvedDismissed',
  'resolvedRemoved',
  'resolvedSuspended',
]

export function moderationTabForStatus(
  statusId: ModerationStatusId,
): ModerationTabId {
  if (statusId === 'open') return 'open'
  if (statusId === 'autoFlagged') return 'autoFlagged'
  return 'resolved'
}

export function countModerationByTab(
  rows: readonly ModerationReport[],
): Record<ModerationTabId, number> {
  const counts: Record<ModerationTabId, number> = {
    open: 0,
    autoFlagged: 0,
    resolved: 0,
  }
  for (const row of rows) {
    counts[moderationTabForStatus(row.statusId)] += 1
  }
  return counts
}

export function filterModerationReports(
  rows: readonly ModerationReport[],
  options: {
    tab: ModerationTabId
    contentTypeId: string
    reasonKey: string
  },
): ModerationReport[] {
  let next = rows.filter(
    (row) => moderationTabForStatus(row.statusId) === options.tab,
  )

  if (options.contentTypeId !== 'all') {
    next = next.filter((row) => row.contentTypeId === options.contentTypeId)
  }

  if (options.reasonKey !== 'all') {
    next = next.filter((row) =>
      row.reportReasons.some((r) => r.reasonKey === options.reasonKey),
    )
  }

  return next
}

export function isModerationActionable(statusId: ModerationStatusId): boolean {
  return !RESOLVED_STATUSES.includes(statusId)
}

export function uniqueContentTypes(
  rows: readonly ModerationReport[],
): ModerationReport['contentTypeId'][] {
  return [...new Set(rows.map((row) => row.contentTypeId))].sort()
}
