import { useTranslation } from 'react-i18next'
import { AnalyticsMeterList } from '@/features/analytics/components/analytics-meter-list'
import { AnalyticsSectionCard } from '@/features/analytics/components/analytics-section-card'
import type { AnalyticsMeterItem } from '@/features/analytics/types/analytics.types'
import { cn } from '@/lib/utils'

type AnalyticsApplicationsByTypeProps = {
  items: readonly AnalyticsMeterItem[] | undefined
  isLoading?: boolean
  className?: string
}

export function AnalyticsApplicationsByType({
  items,
  isLoading = false,
  className,
}: AnalyticsApplicationsByTypeProps) {
  const { t } = useTranslation()

  return (
    <AnalyticsSectionCard
      title={t('analytics.applicationsByType.title')}
      description={t('analytics.applicationsByType.subtitle')}
      className={cn(className)}
    >
      <AnalyticsMeterList
        items={items}
        labelNamespace="analytics.listingTypes"
        isLoading={isLoading}
      />
    </AnalyticsSectionCard>
  )
}
