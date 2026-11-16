import { useQuery } from '@tanstack/react-query'
import { getEventsDashboard } from '@/features/events/api/get-events-dashboard'
import { eventsKeys } from '@/features/events/query-keys'

type UseEventsDashboardParams = {
  enabled?: boolean
}

export function useEventsDashboard({ enabled = true }: UseEventsDashboardParams = {}) {
  return useQuery({
    queryKey: eventsKeys.dashboard(),
    queryFn: () => getEventsDashboard(),
    enabled,
  })
}
