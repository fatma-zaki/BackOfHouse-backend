import type { AnalyticsDateRangeKey } from '@/features/analytics/types/analytics.types'

/**
 * TanStack Query key factory for the Analytics feature.
 * Keep remote/server-style state out of Redux.
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (range: AnalyticsDateRangeKey) =>
    [...analyticsKeys.all, 'dashboard', range.from, range.to] as const,
}
