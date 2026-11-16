import type {
  AnalyticsDashboardData,
  AnalyticsKpiId,
  AnalyticsKpiMetric,
  AnalyticsTabId,
} from '@/features/analytics/types/analytics.types'

/** KPI ids shown for each non-rewards tab (mirrors reference index filters). */
const TAB_KPI_IDS: Record<
  Exclude<AnalyticsTabId, 'rewards'>,
  readonly AnalyticsKpiId[]
> = {
  overview: [
    'activeUsers',
    'applicationsPerListing',
    'eventAttendance',
    'medianReviewTime',
  ],
  users: ['activeUsers'],
  marketplace: ['applicationsPerListing', 'medianReviewTime'],
  events: ['eventAttendance'],
}

/**
 * Returns the KPI set for the active Analytics tab.
 * Rewards uses the dedicated reward KPI snapshot.
 */
export function selectAnalyticsKpis(
  data: AnalyticsDashboardData | undefined,
  tab: AnalyticsTabId,
): AnalyticsKpiMetric[] {
  if (!data) return []

  if (tab === 'rewards') {
    return data.rewardKpis.map((kpi) => ({
      ...kpi,
      delta: kpi.delta ? { ...kpi.delta } : undefined,
    }))
  }

  const allowed = new Set(TAB_KPI_IDS[tab])
  return data.kpis
    .filter((kpi) => allowed.has(kpi.id))
    .map((kpi) => ({
      ...kpi,
      delta: kpi.delta ? { ...kpi.delta } : undefined,
    }))
}

export function showAnalyticsUsersSection(tab: AnalyticsTabId): boolean {
  return tab === 'overview' || tab === 'users'
}

export function showAnalyticsMarketplaceSection(tab: AnalyticsTabId): boolean {
  return tab === 'overview' || tab === 'marketplace'
}
