import { useTranslation } from 'react-i18next'
import type { StatusBadgeStatus } from '@/components/shared/status-badge'
import { CompaniesKpiCard } from '@/features/companies/components/companies-kpi-card'
import type {
  CompaniesKpiDelta,
  CompaniesKpiId,
  CompaniesKpiMetric,
} from '@/features/companies/types/companies.types'

const KPI_LABEL_KEYS: Record<CompaniesKpiId, string> = {
  accounts: 'companies.kpis.accounts',
  verified: 'companies.kpis.verified',
  postingThisMonth: 'companies.kpis.postingThisMonth',
  avgResponse: 'companies.kpis.avgResponse',
}

type CompaniesKpiGridProps = {
  kpis: readonly CompaniesKpiMetric[]
  isLoading?: boolean
}

function toneToBadgeStatus(
  delta: CompaniesKpiDelta,
): StatusBadgeStatus {
  switch (delta.kind) {
    case 'countThisMonth':
      return delta.tone === 'up'
        ? 'success'
        : delta.tone === 'down'
          ? 'destructive'
          : 'neutral'
    case 'percentOfAccounts':
      return 'neutral'
    case 'slowerThanMonth':
      return 'warning'
  }
}

function formatDeltaLabel(
  delta: CompaniesKpiDelta,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  switch (delta.kind) {
    case 'countThisMonth': {
      const sign = delta.value >= 0 ? '+' : ''
      return t('companies.kpis.deltas.countThisMonth', {
        sign,
        value: Math.abs(delta.value),
      })
    }
    case 'percentOfAccounts':
      return t('companies.kpis.deltas.percentOfAccounts', {
        value: delta.value,
      })
    case 'slowerThanMonth':
      return t('companies.kpis.deltas.slowerThanMonth', {
        month: t(`companies.kpis.months.${delta.monthKey}`),
      })
  }
}

export function CompaniesKpiGrid({
  kpis,
  isLoading = false,
}: CompaniesKpiGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <section
        aria-label={t('companies.kpis.sectionLabel')}
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <CompaniesKpiCard
            key={`skeleton-${index}`}
            title={t('companies.states.loading')}
            value=""
            isLoading
          />
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label={t('companies.kpis.sectionLabel')}
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <CompaniesKpiCard
          key={kpi.id}
          title={t(KPI_LABEL_KEYS[kpi.id])}
          value={kpi.value}
          deltaLabel={kpi.delta ? formatDeltaLabel(kpi.delta, t) : undefined}
          deltaStatus={
            kpi.delta ? toneToBadgeStatus(kpi.delta) : undefined
          }
        />
      ))}
    </section>
  )
}
