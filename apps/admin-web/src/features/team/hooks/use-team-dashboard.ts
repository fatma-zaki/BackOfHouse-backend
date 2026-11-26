import { useQuery } from '@tanstack/react-query'
import { getTeamDashboard } from '@/features/team/api/get-team-dashboard'
import { teamKeys } from '@/features/team/query-keys'

type UseTeamDashboardParams = {
  enabled?: boolean
}

export function useTeamDashboard({
  enabled = true,
}: UseTeamDashboardParams = {}) {
  return useQuery({
    queryKey: teamKeys.dashboard(),
    queryFn: () => getTeamDashboard(),
    enabled,
  })
}
