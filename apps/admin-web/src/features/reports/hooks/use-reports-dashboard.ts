import { useQuery } from '@tanstack/react-query'
import {
  getReportsDashboard,
  toReportsDateRangeKey,
} from '@/features/reports/api/get-reports-dashboard'
import { reportsKeys } from '@/features/reports/query-keys'
import type { ReportsDateRange } from '@/features/reports/types/reports.types'

type UseReportsDashboardOptions = {
  range: ReportsDateRange
  enabled?: boolean
}

export function useReportsDashboard({
  range,
  enabled = true,
}: UseReportsDashboardOptions) {
  const rangeKey = toReportsDateRangeKey(range)

  return useQuery({
    queryKey: reportsKeys.dashboard(rangeKey),
    queryFn: () => getReportsDashboard({ range }),
    enabled,
  })
}
