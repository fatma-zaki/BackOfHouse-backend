import type { OverviewDateRangeKey } from '@/features/overview/types/overview.types'

/**
 * TanStack Query key factory for the Overview feature.
 * Keep remote/server-style state out of Redux.
 */
export const overviewKeys = {
  all: ['overview'] as const,
  dashboard: (range: OverviewDateRangeKey) =>
    [...overviewKeys.all, 'dashboard', range.from, range.to] as const,
}
