import { useTranslation } from 'react-i18next'
import { AnalyticsMeterList } from '@/features/analytics/components/analytics-meter-list'
import { AnalyticsSectionCard } from '@/features/analytics/components/analytics-section-card'
import { downloadCsv } from '@/features/analytics/lib/download-csv'
import type { AnalyticsMeterItem } from '@/features/analytics/types/analytics.types'
import { cn } from '@/lib/utils'

type AnalyticsMembersByCityProps = {
  items: readonly AnalyticsMeterItem[] | undefined
  isLoading?: boolean
  className?: string
}

export function AnalyticsMembersByCity({
  items,
  isLoading = false,
  className,
}: AnalyticsMembersByCityProps) {
  const { t } = useTranslation()

  const handleDownload = () => {
    if (!items) return
    downloadCsv(
      'members-by-city',
      items.map((item) => ({
        city: t(`analytics.cities.${item.id}`),
        members: item.value,
      })),
    )
  }

  return (
    <AnalyticsSectionCard
      title={t('analytics.membersByCity.title')}
      description={t('analytics.membersByCity.subtitle')}
      action={
        <button
          type="button"
          className="text-xs font-bold text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          onClick={handleDownload}
          disabled={isLoading || !items?.length}
        >
          {t('analytics.actions.downloadCsv')}
        </button>
      }
      className={cn(className)}
    >
      <AnalyticsMeterList
        items={items}
        labelNamespace="analytics.cities"
        isLoading={isLoading}
      />
    </AnalyticsSectionCard>
  )
}
