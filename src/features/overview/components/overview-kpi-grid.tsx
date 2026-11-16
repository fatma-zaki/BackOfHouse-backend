import { format, subMonths } from 'date-fns'
import { ar as dateFnsAr } from 'date-fns/locale/ar'
import { enUS as dateFnsEnUS } from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'
import { OverviewKpiCard } from '@/features/overview/components/overview-kpi-card'
import type {
  OverviewDateRange,
  OverviewKpiId,
  OverviewKpiMetric,
  OverviewKpiSecondary,
} from '@/features/overview/types/overview.types'

const KPI_LABEL_KEYS: Record<OverviewKpiId, string> = {
  totalUsers: 'overview.kpis.totalUsers',
  companies: 'overview.kpis.companies',
  liveListings: 'overview.kpis.liveListings',
  applications: 'overview.kpis.applications',
  supplierRequests: 'overview.kpis.supplierRequests',
}

type OverviewKpiGridProps = {
  kpis: readonly OverviewKpiMetric[] | undefined
  range: OverviewDateRange
  isLoading?: boolean
}

function formatKpiValue(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

function formatSecondaryLabel(
  secondary: OverviewKpiSecondary,
  previousMonthLabel: string,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  switch (secondary.kind) {
    case 'percentVsPreviousMonth':
      return t('overview.kpis.secondary.percentVsPreviousMonth', {
        value: secondary.value,
        month: previousMonthLabel,
      })
    case 'verifiedCount':
      return t('overview.kpis.secondary.verifiedCount', {
        count: secondary.value,
      })
    case 'deltaThisMonth':
      return t('overview.kpis.secondary.deltaThisMonth', {
        value: secondary.value,
      })
  }
}

const KPI_SKELETON_IDS: OverviewKpiId[] = [
  'totalUsers',
  'companies',
  'liveListings',
  'applications',
  'supplierRequests',
]

export function OverviewKpiGrid({
  kpis,
  range,
  isLoading = false,
}: OverviewKpiGridProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const numberLocale = isArabic ? 'ar' : 'en'
  const dateLocale = isArabic ? dateFnsAr : dateFnsEnUS
  const previousMonthLabel = format(subMonths(range.to, 1), 'MMM', {
    locale: dateLocale,
  })

  const items = isLoading
    ? KPI_SKELETON_IDS.map((id) => ({
        id,
        title: t(KPI_LABEL_KEYS[id]),
        value: '',
        secondaryLabel: '',
        isLoading: true,
      }))
    : (kpis ?? []).map((kpi) => ({
        id: kpi.id,
        title: t(KPI_LABEL_KEYS[kpi.id]),
        value: formatKpiValue(kpi.value, numberLocale),
        secondaryLabel: formatSecondaryLabel(
          kpi.secondary,
          previousMonthLabel,
          t,
        ),
        isLoading: false,
      }))

  return (
    <section
      aria-label={t('overview.kpis.sectionLabel')}
      className="grid grid-cols-2 gap-3 xl:grid-cols-5"
    >
      {items.map((item) => (
        <OverviewKpiCard
          key={item.id}
          title={item.title}
          value={item.value}
          secondaryLabel={item.secondaryLabel}
          isLoading={item.isLoading}
        />
      ))}
    </section>
  )
}
