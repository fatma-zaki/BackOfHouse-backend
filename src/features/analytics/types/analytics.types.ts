/**
 * Feature-local Analytics dashboard contracts.
 * Not a backend DTO — replace when a real API contract exists.
 */

/** Inclusive calendar date range used for Analytics queries (local UI state). */
export type AnalyticsDateRange = {
  from: Date
  to: Date
}

/** Stable YYYY-MM-DD keys for query caches. */
export type AnalyticsDateRangeKey = {
  from: string
  to: string
}

export type AnalyticsTabId =
  | 'overview'
  | 'users'
  | 'marketplace'
  | 'events'
  | 'rewards'

export const ANALYTICS_TAB_IDS: readonly AnalyticsTabId[] = [
  'overview',
  'users',
  'marketplace',
  'events',
  'rewards',
] as const

export type AnalyticsKpiId =
  | 'activeUsers'
  | 'applicationsPerListing'
  | 'eventAttendance'
  | 'medianReviewTime'
  | 'pointsAwarded'
  | 'pointsRedeemed'
  | 'redemptions'
  | 'waitingFulfillment'

export type AnalyticsKpiDeltaTone = 'up' | 'down' | 'warning' | 'neutral'

export type AnalyticsKpiDelta =
  | {
      kind: 'percentVsMonth'
      value: number
      monthKey: 'aug'
      tone: AnalyticsKpiDeltaTone
    }
  | {
      kind: 'pointsVsMonth'
      value: number
      monthKey: 'aug'
      tone: AnalyticsKpiDeltaTone
    }
  | {
      kind: 'ptsVsMonth'
      value: number
      monthKey: 'aug'
      tone: AnalyticsKpiDeltaTone
    }
  | {
      kind: 'targetUnderHours'
      hours: number
      tone: AnalyticsKpiDeltaTone
    }
  | {
      kind: 'oldestDays'
      days: number
      tone: AnalyticsKpiDeltaTone
    }

export type AnalyticsKpiMetric = {
  id: AnalyticsKpiId
  /** Display-ready value from the mock layer (already formatted). */
  value: string
  /** Omitted when the reference snapshot has no secondary line. */
  delta?: AnalyticsKpiDelta
}

export type AnalyticsWeeklyPoint = {
  week: number
  value: number
}

export type AnalyticsMeterItem = {
  id: string
  value: number
  /** Optional preformatted display (e.g. "71%"); falls back to formatted value. */
  display?: string
}

export type AnalyticsTopListing = {
  id: string
  views: string
  applications: string
  /** Conversion percent (e.g. 6.5). */
  conversion: number
}

export type AnalyticsDashboardData = {
  range: AnalyticsDateRangeKey
  kpis: AnalyticsKpiMetric[]
  rewardKpis: AnalyticsKpiMetric[]
  weeklyActive: AnalyticsWeeklyPoint[]
  membersByCity: AnalyticsMeterItem[]
  applicationsByType: AnalyticsMeterItem[]
  topListings: AnalyticsTopListing[]
  eventAttendance: AnalyticsMeterItem[]
  redemptionsByReward: AnalyticsMeterItem[]
}

export type GetAnalyticsDashboardParams = {
  range: AnalyticsDateRange
}
