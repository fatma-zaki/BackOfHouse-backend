import type {
  EventRow,
  EventsTabId,
} from '@/features/events/types/events.types'

export function matchesEventsTab(row: EventRow, tab: EventsTabId): boolean {
  return row.lifecycleTab === tab
}

export function filterEvents(
  rows: readonly EventRow[],
  options: {
    tab: EventsTabId
    cityId: string
  },
): EventRow[] {
  return rows.filter((row) => {
    if (!matchesEventsTab(row, options.tab)) return false
    if (options.cityId !== 'all' && row.cityId !== options.cityId) {
      return false
    }
    return true
  })
}

export function uniqueOptionValues(
  rows: readonly EventRow[],
  pick: (row: EventRow) => string,
): string[] {
  return [...new Set(rows.map(pick))].sort((a, b) => a.localeCompare(b))
}

export function countByTab(
  rows: readonly EventRow[],
): Record<EventsTabId, number> {
  return {
    past: rows.filter((row) => row.lifecycleTab === 'past').length,
    upcoming: rows.filter((row) => row.lifecycleTab === 'upcoming').length,
    drafts: rows.filter((row) => row.lifecycleTab === 'drafts').length,
  }
}
