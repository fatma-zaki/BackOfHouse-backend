/**
 * Local async adapter over Analytics mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { format } from 'date-fns'
import {
  ANALYTICS_MOCK_APPLICATIONS_BY_TYPE,
  ANALYTICS_MOCK_EVENT_ATTENDANCE,
  ANALYTICS_MOCK_KPIS,
  ANALYTICS_MOCK_MEMBERS_BY_CITY,
  ANALYTICS_MOCK_REDEMPTIONS_BY_REWARD,
  ANALYTICS_MOCK_REWARD_KPIS,
  ANALYTICS_MOCK_TOP_LISTINGS,
  ANALYTICS_MOCK_WEEKLY_ACTIVE,
} from '@/features/analytics/mocks/analytics-dashboard.mock'
import type {
  AnalyticsDateRangeKey,
  AnalyticsDashboardData,
  GetAnalyticsDashboardParams,
} from '@/features/analytics/types/analytics.types'

const MOCK_LATENCY_MS = 180

export function toAnalyticsDateRangeKey(range: {
  from: Date
  to: Date
}): AnalyticsDateRangeKey {
  return {
    from: format(range.from, 'yyyy-MM-dd'),
    to: format(range.to, 'yyyy-MM-dd'),
  }
}

/**
 * Returns a static Analytics snapshot for the selected range.
 * Limitation: KPI / chart / meter values are NOT recomputed for `range` —
 * the mock does not contain enough history without fabricating series.
 */
export async function getAnalyticsDashboard(
  params: GetAnalyticsDashboardParams,
): Promise<AnalyticsDashboardData> {
  const rangeKey = toAnalyticsDateRangeKey(params.range)

  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    range: rangeKey,
    kpis: ANALYTICS_MOCK_KPIS.map((kpi) => ({
      ...kpi,
      delta: kpi.delta ? { ...kpi.delta } : undefined,
    })),
    rewardKpis: ANALYTICS_MOCK_REWARD_KPIS.map((kpi) => ({
      ...kpi,
      delta: kpi.delta ? { ...kpi.delta } : undefined,
    })),
    weeklyActive: ANALYTICS_MOCK_WEEKLY_ACTIVE.map((point) => ({ ...point })),
    membersByCity: ANALYTICS_MOCK_MEMBERS_BY_CITY.map((item) => ({ ...item })),
    applicationsByType: ANALYTICS_MOCK_APPLICATIONS_BY_TYPE.map((item) => ({
      ...item,
    })),
    topListings: ANALYTICS_MOCK_TOP_LISTINGS.map((item) => ({ ...item })),
    eventAttendance: ANALYTICS_MOCK_EVENT_ATTENDANCE.map((item) => ({
      ...item,
    })),
    redemptionsByReward: ANALYTICS_MOCK_REDEMPTIONS_BY_REWARD.map((item) => ({
      ...item,
    })),
  }
}
