import { useTranslation } from 'react-i18next'
import type { StatusBadgeStatus } from '@/components/shared/status-badge'
import { AnalyticsKpiCard } from '@/features/analytics/components/analytics-kpi-card'
import type {
  AnalyticsKpiDelta,
  AnalyticsKpiId,
  AnalyticsKpiMetric,
} from '@/features/analytics/types/analytics.types'

const KPI_LABEL_KEYS: Record<AnalyticsKpiId, string> = {
  activeUsers: 'analytics.kpis.activeUsers',
  applicationsPerListing: 'analytics.kpis.applicationsPerListing',
  eventAttendance: 'analytics.kpis.eventAttendance',
  medianReviewTime: 'analytics.kpis.medianReviewTime',
  pointsAwarded: 'analytics.kpis.pointsAwarded',
  pointsRedeemed: 'analytics.kpis.pointsRedeemed',
  redemptions: 'analytics.kpis.redemptions',
  waitingFulfillment: 'analytics.kpis.waitingFulfillment',
}

type AnalyticsKpiGridProps = {
  kpis: readonly AnalyticsKpiMetric[]
  isLoading?: boolean
}

function toneToBadgeStatus(
  tone: AnalyticsKpiDelta['tone'],
): StatusBadgeStatus {
  switch (tone) {
    case 'up':
      return 'success'
    case 'down':
      return 'destructive'
    case 'warning':
      return 'warning'
    case 'neutral':
      return 'neutral'
  }
}

function formatDeltaLabel(
  delta: AnalyticsKpiDelta,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  switch (delta.kind) {
    case 'percentVsMonth': {
      const sign = delta.value >= 0 ? '+' : ''
      return t('analytics.kpis.deltas.percentVsMonth', {
        sign,
        value: Math.abs(delta.value),
        month: t(`analytics.kpis.months.${delta.monthKey}`),
      })
    }
    case 'pointsVsMonth': {
      const sign = delta.value >= 0 ? '+' : ''
      return t('analytics.kpis.deltas.pointsVsMonth', {
        sign,
        value: Math.abs(delta.value),
        month: t(`analytics.kpis.months.${delta.monthKey}`),
      })
    }
    case 'ptsVsMonth': {
      const sign = delta.value >= 0 ? '+' : '−'
      return t('analytics.kpis.deltas.ptsVsMonth', {
        sign,
        value: Math.abs(delta.value),
        month: t(`analytics.kpis.months.${delta.monthKey}`),
      })
    }
    case 'targetUnderHours':
      return t('analytics.kpis.deltas.targetUnderHours', {
        hours: delta.hours,
      })
    case 'oldestDays':
      return t('analytics.kpis.deltas.oldestDays', { days: delta.days })
  }
}

export function AnalyticsKpiGrid({
  kpis,
  isLoading = false,
}: AnalyticsKpiGridProps) {
  const { t } = useTranslation()
  const skeletonCount = Math.max(kpis.length, 4)

  if (isLoading) {
    return (
      <section
        aria-label={t('analytics.kpis.sectionLabel')}
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <AnalyticsKpiCard
            key={`skeleton-${index}`}
            title={t('analytics.states.loading')}
            value=""
            isLoading
          />
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label={t('analytics.kpis.sectionLabel')}
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <AnalyticsKpiCard
          key={kpi.id}
          title={t(KPI_LABEL_KEYS[kpi.id])}
          value={kpi.value}
          deltaLabel={kpi.delta ? formatDeltaLabel(kpi.delta, t) : undefined}
          deltaStatus={
            kpi.delta ? toneToBadgeStatus(kpi.delta.tone) : undefined
          }
        />
      ))}
    </section>
  )
}
