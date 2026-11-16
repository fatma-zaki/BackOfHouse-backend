export type RewardsDateRange = {
  from: Date
  to: Date
}

export type RewardsDateRangeKey = {
  from: string
  to: string
}

export type RewardsTabId = 'catalog' | 'redemptions' | 'ledger'

export const REWARDS_TAB_IDS: readonly RewardsTabId[] = [
  'catalog',
  'redemptions',
  'ledger',
] as const

export type RewardThumbnailTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type RewardStock =
  | { kind: 'unlimited' }
  | { kind: 'limited'; left: number; total: number }

export type RewardRow = {
  id: string
  titleKey: string
  subtitleKey: string
  thumbnailTone: RewardThumbnailTone
  costPoints: number
  stock: RewardStock
  redeemed: number
  live: boolean
}

export type EarnRuleRow = {
  id: string
  labelKey: string
  points: number
}

export type AdjustmentMemberOption = {
  id: string
  memberKey: string
  pointsBalance: number
}

export type RewardsKpiId =
  | 'pointsAwarded'
  | 'pointsRedeemed'
  | 'redemptions'
  | 'waitingFulfillment'

export type RewardsKpiDelta =
  | {
      kind: 'percentVsMonth'
      value: number
      monthKey: string
      tone: 'up' | 'down' | 'neutral'
    }
  | {
      kind: 'oldestDays'
      value: number
      tone: 'warning'
    }

export type RewardsKpiMetric = {
  id: RewardsKpiId
  value: string
  periodMonthKey?: string
  delta?: RewardsKpiDelta
}

export type RewardsDashboardData = {
  range: RewardsDateRangeKey
  kpis: readonly RewardsKpiMetric[]
  rewards: readonly RewardRow[]
  earnRules: readonly EarnRuleRow[]
  adjustmentMembers: readonly AdjustmentMemberOption[]
  pendingRedemptionsCount: number
  manualAdjustmentDefaults: {
    memberId: string
    pointsDelta: string
    reasonKey: string
  }
}
