import { useTranslation } from 'react-i18next'
import type { StatusBadgeStatus } from '@/components/shared/status-badge'
import { RewardsKpiCard } from '@/features/rewards/components/rewards-kpi-card'
import type {
  RewardsKpiDelta,
  RewardsKpiId,
  RewardsKpiMetric,
} from '@/features/rewards/types/rewards.types'

const KPI_LABEL_KEYS: Record<RewardsKpiId, string> = {
  pointsAwarded: 'rewards.kpis.pointsAwarded',
  pointsRedeemed: 'rewards.kpis.pointsRedeemed',
  redemptions: 'rewards.kpis.redemptions',
  waitingFulfillment: 'rewards.kpis.waitingFulfillment',
}

type RewardsKpiGridProps = {
  kpis: readonly RewardsKpiMetric[]
  isLoading?: boolean
}

function toneToBadgeStatus(delta: RewardsKpiDelta): StatusBadgeStatus {
  switch (delta.kind) {
    case 'percentVsMonth':
      return delta.tone === 'up'
        ? 'success'
        : delta.tone === 'down'
          ? 'destructive'
          : 'neutral'
    case 'oldestDays':
      return 'warning'
  }
}

function formatDeltaLabel(
  delta: RewardsKpiDelta,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  switch (delta.kind) {
    case 'percentVsMonth': {
      const sign = delta.value >= 0 ? '+' : ''
      return t('rewards.kpis.deltas.percentVsMonth', {
        sign,
        value: Math.abs(delta.value),
        month: t(`rewards.kpis.months.${delta.monthKey}`),
      })
    }
    case 'oldestDays':
      return t('rewards.kpis.deltas.oldestDays', {
        count: delta.value,
      })
  }
}

function formatKpiTitle(
  kpi: RewardsKpiMetric,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  const key = KPI_LABEL_KEYS[kpi.id]
  if (kpi.periodMonthKey) {
    return t(key, {
      month: t(`rewards.kpis.months.${kpi.periodMonthKey}`),
    })
  }
  return t(key)
}

export function RewardsKpiGrid({
  kpis,
  isLoading = false,
}: RewardsKpiGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <section
        aria-label={t('rewards.kpis.sectionLabel')}
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <RewardsKpiCard
            key={`skeleton-${index}`}
            title={t('rewards.states.loading')}
            value=""
            isLoading
          />
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label={t('rewards.kpis.sectionLabel')}
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <RewardsKpiCard
          key={kpi.id}
          title={formatKpiTitle(kpi, t)}
          value={kpi.value}
          deltaLabel={kpi.delta ? formatDeltaLabel(kpi.delta, t) : undefined}
          deltaStatus={kpi.delta ? toneToBadgeStatus(kpi.delta) : undefined}
        />
      ))}
    </section>
  )
}
