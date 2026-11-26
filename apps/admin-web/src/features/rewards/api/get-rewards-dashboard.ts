/**
 * Local async adapter over Rewards mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { REWARDS_MOCK_DASHBOARD } from '@/features/rewards/mocks/rewards-dashboard.mock'
import type {
  RewardsDashboardData,
  RewardsDateRangeKey,
} from '@/features/rewards/types/rewards.types'

const MOCK_LATENCY_MS = 160

export function toRewardsDateRangeKey(range: {
  from: Date
  to: Date
}): RewardsDateRangeKey {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  }
}

export async function getRewardsDashboard(params: {
  range: { from: Date; to: Date }
}): Promise<RewardsDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  const rangeKey = toRewardsDateRangeKey(params.range)

  return {
    range: rangeKey,
    kpis: REWARDS_MOCK_DASHBOARD.kpis.map((kpi) => ({ ...kpi })),
    rewards: REWARDS_MOCK_DASHBOARD.rewards.map((row) => ({
      ...row,
      stock:
        row.stock.kind === 'unlimited'
          ? { kind: 'unlimited' as const }
          : { ...row.stock },
    })),
    earnRules: REWARDS_MOCK_DASHBOARD.earnRules.map((rule) => ({ ...rule })),
    adjustmentMembers: REWARDS_MOCK_DASHBOARD.adjustmentMembers.map(
      (member) => ({ ...member }),
    ),
    pendingRedemptionsCount: REWARDS_MOCK_DASHBOARD.pendingRedemptionsCount,
    manualAdjustmentDefaults: {
      ...REWARDS_MOCK_DASHBOARD.manualAdjustmentDefaults,
    },
  }
}
