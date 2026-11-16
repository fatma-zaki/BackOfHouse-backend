/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * Local Rewards scaffolding aligned to the product reference.
 * NOT production catalog data and NOT backed by a real API.
 * ---------------------------------------------------------------------------
 */

import { REWARDS_DEFAULT_RANGE } from '@/features/rewards/constants'
import type {
  AdjustmentMemberOption,
  EarnRuleRow,
  RewardRow,
  RewardsDashboardData,
  RewardsKpiMetric,
} from '@/features/rewards/types/rewards.types'

/** @deprecated Prefer REWARDS_DEFAULT_RANGE from constants. */
export const REWARDS_MOCK_DEFAULT_RANGE = REWARDS_DEFAULT_RANGE


export const REWARDS_MOCK_KPIS: readonly RewardsKpiMetric[] = [
  {
    id: 'pointsAwarded',
    value: '128,400',
    periodMonthKey: 'sep',
  },
  {
    id: 'pointsRedeemed',
    value: '41,200',
    periodMonthKey: 'sep',
  },
  {
    id: 'redemptions',
    value: '164',
    delta: { kind: 'percentVsMonth', value: 22, monthKey: 'aug', tone: 'up' },
  },
  {
    id: 'waitingFulfillment',
    value: '6',
    delta: { kind: 'oldestDays', value: 2, tone: 'warning' },
  },
]

export const REWARDS_MOCK_REWARDS: readonly RewardRow[] = [
  {
    id: 'profile-highlight',
    titleKey: 'profileHighlight',
    subtitleKey: 'profileHighlightSub',
    thumbnailTone: 'sky',
    costPoints: 500,
    stock: { kind: 'unlimited' },
    redeemed: 58,
    live: true,
  },
  {
    id: 'vip-pass',
    titleKey: 'vipPass',
    subtitleKey: 'vipPassSub',
    thumbnailTone: 'violet',
    costPoints: 3000,
    stock: { kind: 'limited', left: 12, total: 40 },
    redeemed: 28,
    live: true,
  },
  {
    id: 'rigging-course',
    titleKey: 'riggingCourse',
    subtitleKey: 'riggingCourseSub',
    thumbnailTone: 'mint',
    costPoints: 1500,
    stock: { kind: 'limited', left: 30, total: 50 },
    redeemed: 20,
    live: true,
  },
  {
    id: 'crew-jacket',
    titleKey: 'crewJacket',
    subtitleKey: 'crewJacketSub',
    thumbnailTone: 'amber',
    costPoints: 2000,
    stock: { kind: 'limited', left: 0, total: 100 },
    redeemed: 100,
    live: false,
  },
  {
    id: 'coffee-on-us',
    titleKey: 'coffeeOnUs',
    subtitleKey: 'coffeeOnUsSub',
    thumbnailTone: 'rose',
    costPoints: 250,
    stock: { kind: 'limited', left: 140, total: 300 },
    redeemed: 160,
    live: true,
  },
  {
    id: 'event-ticket',
    titleKey: 'eventTicket',
    subtitleKey: 'eventTicketSub',
    thumbnailTone: 'slate',
    costPoints: 800,
    stock: { kind: 'limited', left: 45, total: 80 },
    redeemed: 35,
    live: true,
  },
]

export const REWARDS_MOCK_EARN_RULES: readonly EarnRuleRow[] = [
  { id: 'event-register', labelKey: 'eventRegister', points: 0 },
  { id: 'verified-attendance', labelKey: 'verifiedAttendance', points: 150 },
  { id: 'volunteer-shift', labelKey: 'volunteerShift', points: 200 },
  { id: 'profile-complete', labelKey: 'profileComplete', points: 100 },
  { id: 'friend-referral', labelKey: 'friendReferral', points: 50 },
]

export const REWARDS_MOCK_ADJUSTMENT_MEMBERS: readonly AdjustmentMemberOption[] =
  [
    { id: 'reem', memberKey: 'reemAlharbi', pointsBalance: 2450 },
    { id: 'faisal', memberKey: 'faisalAlmutairi', pointsBalance: 1820 },
    { id: 'noura', memberKey: 'nouraAlqahtani', pointsBalance: 960 },
  ]

export const REWARDS_MOCK_DASHBOARD: Omit<
  RewardsDashboardData,
  'range'
> = {
  kpis: REWARDS_MOCK_KPIS,
  rewards: REWARDS_MOCK_REWARDS,
  earnRules: REWARDS_MOCK_EARN_RULES,
  adjustmentMembers: REWARDS_MOCK_ADJUSTMENT_MEMBERS,
  pendingRedemptionsCount: 6,
  manualAdjustmentDefaults: {
    memberId: 'reem',
    pointsDelta: '+150',
    reasonKey: 'scannerOffline',
  },
}
