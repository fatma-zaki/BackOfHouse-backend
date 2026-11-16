import { useQuery } from '@tanstack/react-query'
import { getModerationDashboard } from '@/features/moderation/api/get-moderation-dashboard'
import { moderationKeys } from '@/features/moderation/query-keys'

export function useModerationDashboard(enabled = true) {
  return useQuery({
    queryKey: moderationKeys.dashboard(),
    queryFn: () => getModerationDashboard(),
    enabled,
  })
}
