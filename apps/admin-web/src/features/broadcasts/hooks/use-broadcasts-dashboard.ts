import { useQuery } from '@tanstack/react-query'
import { getBroadcastsDashboard } from '@/features/broadcasts/api/get-broadcasts-dashboard'
import { broadcastsKeys } from '@/features/broadcasts/query-keys'

export function useBroadcastsDashboard(enabled = true) {
  return useQuery({
    queryKey: broadcastsKeys.dashboard(),
    queryFn: () => getBroadcastsDashboard(),
    enabled,
  })
}
