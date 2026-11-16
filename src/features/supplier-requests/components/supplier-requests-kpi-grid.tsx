import { useTranslation } from 'react-i18next'
import type { StatusBadgeStatus } from '@/components/shared/status-badge'
import { SupplierRequestsKpiCard } from '@/features/supplier-requests/components/supplier-requests-kpi-card'
import type {
  SupplierRequestsKpiFootnote,
  SupplierRequestsKpiId,
  SupplierRequestsKpiMetric,
} from '@/features/supplier-requests/types/supplier-requests.types'

const KPI_LABEL_KEYS: Record<SupplierRequestsKpiId, string> = {
  openRequests: 'supplierRequests.kpis.openRequests',
  responsesThisMonth: 'supplierRequests.kpis.responsesThisMonth',
  responsesPerRequest: 'supplierRequests.kpis.responsesPerRequest',
  noResponseAfter5Days: 'supplierRequests.kpis.noResponseAfter5Days',
}

type SupplierRequestsKpiGridProps = {
  kpis: readonly SupplierRequestsKpiMetric[]
  isLoading?: boolean
}

function footnoteToneToBadgeStatus(
  tone: SupplierRequestsKpiFootnote['tone'],
): StatusBadgeStatus {
  switch (tone) {
    case 'up':
      return 'success'
    case 'down':
      return 'destructive'
    case 'warning':
      return 'warning'
    case 'neutral':
    default:
      return 'neutral'
  }
}

function formatFootnoteLabel(
  footnote: SupplierRequestsKpiFootnote,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  switch (footnote.kind) {
    case 'percentVsMonth': {
      const sign = footnote.value >= 0 ? '+' : ''
      return t('supplierRequests.kpis.footnotes.percentVsMonth', {
        sign,
        value: Math.abs(footnote.value),
        month: t(`supplierRequests.kpis.months.${footnote.monthKey}`),
      })
    }
    case 'callout':
      return t(`supplierRequests.kpis.footnotes.${footnote.labelKey}`)
  }
}

export function SupplierRequestsKpiGrid({
  kpis,
  isLoading = false,
}: SupplierRequestsKpiGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <section
        aria-label={t('supplierRequests.kpis.sectionLabel')}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <SupplierRequestsKpiCard
            key={`skeleton-${index}`}
            title={t('supplierRequests.states.loading')}
            value=""
            isLoading
          />
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label={t('supplierRequests.kpis.sectionLabel')}
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      {kpis.map((kpi) => (
        <SupplierRequestsKpiCard
          key={kpi.id}
          title={t(KPI_LABEL_KEYS[kpi.id])}
          value={kpi.value}
          footnoteLabel={
            kpi.footnote ? formatFootnoteLabel(kpi.footnote, t) : undefined
          }
          footnoteStatus={
            kpi.footnote
              ? footnoteToneToBadgeStatus(kpi.footnote.tone)
              : undefined
          }
        />
      ))}
    </section>
  )
}
