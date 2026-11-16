import { useQuery } from '@tanstack/react-query'
import {
  getOverviewDashboard,
  toOverviewDateRangeKey,
} from '@/features/overview/api/get-overview-dashboard'
import { overviewKeys } from '@/features/overview/query-keys'
import type { OverviewDateRange } from '@/features/overview/types/overview.types'

type UseOverviewDashboardOptions = {
  range: OverviewDateRange
  enabled?: boolean
}

/**
 * Loads Overview dashboard data through TanStack Query.
 * Remote/server-style state stays in Query — not Redux.
 */
export function useOverviewDashboard({
  range,
  enabled = true,
}: UseOverviewDashboardOptions) {
  const rangeKey = toOverviewDateRangeKey(range)

  return useQuery({
    queryKey: overviewKeys.dashboard(rangeKey),
    queryFn: () => getOverviewDashboard({ range }),
    enabled,
  })
}
