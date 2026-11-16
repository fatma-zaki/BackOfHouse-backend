import { useQuery } from '@tanstack/react-query'
import {
  getRewardsDashboard,
  toRewardsDateRangeKey,
} from '@/features/rewards/api/get-rewards-dashboard'
import { rewardsKeys } from '@/features/rewards/query-keys'
import type { RewardsDateRange } from '@/features/rewards/types/rewards.types'

type UseRewardsDashboardParams = {
  range: RewardsDateRange
  enabled?: boolean
}

export function useRewardsDashboard({
  range,
  enabled = true,
}: UseRewardsDashboardParams) {
  const rangeKey = toRewardsDateRangeKey(range)

  return useQuery({
    queryKey: rewardsKeys.dashboard(rangeKey),
    queryFn: () => getRewardsDashboard({ range }),
    enabled,
  })
}
