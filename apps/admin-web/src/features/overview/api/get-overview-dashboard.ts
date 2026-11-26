/**
 * Local async adapter over Overview mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { format, isWithinInterval, parseISO, startOfDay } from 'date-fns'
import { computeFunnelConversionRate } from '@/features/overview/lib/compute-funnel-conversion'
import {
  OVERVIEW_MOCK_ACTIVITY,
  OVERVIEW_MOCK_ACTIVITY_NOW,
  OVERVIEW_MOCK_ATTENTION,
  OVERVIEW_MOCK_FUNNEL_STAGES,
  OVERVIEW_MOCK_KPIS,
  OVERVIEW_MOCK_SIGNUP_POINTS,
} from '@/features/overview/mocks/overview-dashboard.mock'
import type {
  GetOverviewDashboardParams,
  OverviewDashboardData,
  OverviewDateRangeKey,
  OverviewSignupPoint,
} from '@/features/overview/types/overview.types'

const MOCK_LATENCY_MS = 180

export function toOverviewDateRangeKey(range: {
  from: Date
  to: Date
}): OverviewDateRangeKey {
  return {
    from: format(range.from, 'yyyy-MM-dd'),
    to: format(range.to, 'yyyy-MM-dd'),
  }
}

function filterSignupPoints(
  points: readonly OverviewSignupPoint[],
  rangeKey: OverviewDateRangeKey,
): OverviewSignupPoint[] {
  return points.filter(
    (point) => point.date >= rangeKey.from && point.date <= rangeKey.to,
  )
}

function peakOf(points: OverviewSignupPoint[]): OverviewSignupPoint | null {
  if (points.length === 0) return null
  return points.reduce((best, point) =>
    point.count > best.count ? point : best,
  )
}

/**
 * Activity rows are filtered by `occurredAt` when the selected range is complete.
 * KPI / attention / funnel snapshots are NOT recalculated for the range — the
 * mock does not contain enough history to do so without fabricating values.
 */
function filterActivity(
  range: GetOverviewDashboardParams['range'],
): OverviewDashboardData['activity'] {
  const interval = {
    start: startOfDay(range.from),
    end: startOfDay(range.to),
  }

  return OVERVIEW_MOCK_ACTIVITY.filter((item) => {
    const occurred = parseISO(item.occurredAt)
    if (Number.isNaN(occurred.getTime())) return false
    return isWithinInterval(occurred, {
      start: interval.start,
      // Include the full end calendar day.
      end: new Date(
        interval.end.getFullYear(),
        interval.end.getMonth(),
        interval.end.getDate(),
        23,
        59,
        59,
        999,
      ),
    })
  }).map((item) => ({ ...item, message: { ...item.message } }))
}

export async function getOverviewDashboard(
  params: GetOverviewDashboardParams,
): Promise<OverviewDashboardData> {
  const { range } = params
  const rangeKey = toOverviewDateRangeKey(range)

  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  const signupPoints = filterSignupPoints(
    OVERVIEW_MOCK_SIGNUP_POINTS,
    rangeKey,
  )
  const totalInRange = signupPoints.reduce((sum, point) => sum + point.count, 0)

  const funnelStages = OVERVIEW_MOCK_FUNNEL_STAGES.map((stage) => ({
    ...stage,
  }))

  return {
    range: rangeKey,
    // Limitation: KPI values are a static reference snapshot and are not
    // recomputed for `range`. See mock module header.
    kpis: OVERVIEW_MOCK_KPIS.map((kpi) => ({ ...kpi })),
    signups: {
      points: signupPoints,
      totalInRange,
      peak: peakOf(signupPoints),
    },
    // Limitation: attention counts are a static queue snapshot.
    attention: OVERVIEW_MOCK_ATTENTION.map((item) => ({
      ...item,
      detail: { ...item.detail },
    })),
    // Limitation: funnel stages are a fixed “last 28 days” snapshot.
    // conversionRatePercent is derived here (single source of truth).
    funnel: {
      conversionRatePercent: computeFunnelConversionRate(funnelStages),
      stages: funnelStages,
    },
    activity: filterActivity(range),
    // Demo clock from the mock layer — UI must not import the mock module.
    activityAsOf: OVERVIEW_MOCK_ACTIVITY_NOW.toISOString(),
  }
}
