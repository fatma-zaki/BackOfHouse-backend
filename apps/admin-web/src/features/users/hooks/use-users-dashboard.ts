import { useQuery } from '@tanstack/react-query'
import { getUsersDashboard } from '@/features/users/api/get-users-dashboard'
import { usersKeys } from '@/features/users/query-keys'

type UseUsersDashboardParams = {
  enabled?: boolean
}

export function useUsersDashboard({ enabled = true }: UseUsersDashboardParams = {}) {
  return useQuery({
    queryKey: usersKeys.dashboard(),
    queryFn: () => getUsersDashboard(),
    enabled,
  })
}
