import { useTranslation } from 'react-i18next'
import type { StatusBadgeStatus } from '@/components/shared/status-badge'
import { ApplicationsKpiCard } from '@/features/applications/components/applications-kpi-card'
import type {
  ApplicationsKpiDelta,
  ApplicationsKpiId,
  ApplicationsKpiMetric,
} from '@/features/applications/types/applications.types'

const KPI_LABEL_KEYS: Record<ApplicationsKpiId, string> = {
  applications: 'applications.kpis.applications',
  inReview: 'applications.kpis.inReview',
  shortlisted: 'applications.kpis.shortlisted',
  selected: 'applications.kpis.selected',
}

type ApplicationsKpiGridProps = {
  kpis: readonly ApplicationsKpiMetric[]
  isLoading?: boolean
}

function toneToBadgeStatus(
  tone: ApplicationsKpiDelta['tone'],
): StatusBadgeStatus {
  switch (tone) {
    case 'up':
      return 'success'
    case 'down':
      return 'destructive'
    case 'neutral':
      return 'neutral'
  }
}

function formatDeltaLabel(
  delta: ApplicationsKpiDelta,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  switch (delta.kind) {
    case 'percentVsMonth': {
      const sign = delta.value >= 0 ? '+' : ''
      return t('applications.kpis.deltas.percentVsMonth', {
        sign,
        value: Math.abs(delta.value),
        month: t(`applications.kpis.months.${delta.monthKey}`),
      })
    }
    case 'percentOfApplications':
      return t('applications.kpis.deltas.percentOfApplications', {
        value: delta.value,
      })
  }
}

export function ApplicationsKpiGrid({
  kpis,
  isLoading = false,
}: ApplicationsKpiGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <section
        aria-label={t('applications.kpis.sectionLabel')}
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <ApplicationsKpiCard
            key={`skeleton-${index}`}
            title={t('applications.states.loading')}
            value=""
            isLoading
          />
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label={t('applications.kpis.sectionLabel')}
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <ApplicationsKpiCard
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
