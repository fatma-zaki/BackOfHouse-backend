import type { RewardsDateRangeKey } from '@/features/rewards/types/rewards.types'

export const rewardsKeys = {
  all: ['rewards'] as const,
  dashboard: (range: RewardsDateRangeKey) =>
    [...rewardsKeys.all, 'dashboard', range] as const,
}
