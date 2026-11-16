import { useQuery } from '@tanstack/react-query'
import {
  getApplicationsDashboard,
  toApplicationsDateRangeKey,
} from '@/features/applications/api/get-applications-dashboard'
import { applicationsKeys } from '@/features/applications/query-keys'
import type { ApplicationsDateRange } from '@/features/applications/types/applications.types'

type UseApplicationsDashboardParams = {
  range: ApplicationsDateRange
  enabled?: boolean
}

export function useApplicationsDashboard({
  range,
  enabled = true,
}: UseApplicationsDashboardParams) {
  const rangeKey = toApplicationsDateRangeKey(range)

  return useQuery({
    queryKey: applicationsKeys.dashboard(rangeKey),
    queryFn: () => getApplicationsDashboard({ range }),
    enabled,
  })
}
