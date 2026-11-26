import { useQuery } from '@tanstack/react-query'
import {
  getAnalyticsDashboard,
  toAnalyticsDateRangeKey,
} from '@/features/analytics/api/get-analytics-dashboard'
import { analyticsKeys } from '@/features/analytics/query-keys'
import type { AnalyticsDateRange } from '@/features/analytics/types/analytics.types'

type UseAnalyticsDashboardOptions = {
  range: AnalyticsDateRange
  enabled?: boolean
}

/**
 * Loads Analytics dashboard data through TanStack Query.
 * Remote/server-style state stays in Query — not Redux.
 */
export function useAnalyticsDashboard({
  range,
  enabled = true,
}: UseAnalyticsDashboardOptions) {
  const rangeKey = toAnalyticsDateRangeKey(range)

  return useQuery({
    queryKey: analyticsKeys.dashboard(rangeKey),
    queryFn: () => getAnalyticsDashboard({ range }),
    enabled,
  })
}
