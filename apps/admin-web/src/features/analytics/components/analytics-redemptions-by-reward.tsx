import { useTranslation } from 'react-i18next'
import { AnalyticsMeterList } from '@/features/analytics/components/analytics-meter-list'
import { AnalyticsSectionCard } from '@/features/analytics/components/analytics-section-card'
import { downloadCsv } from '@/features/analytics/lib/download-csv'
import type { AnalyticsMeterItem } from '@/features/analytics/types/analytics.types'

type AnalyticsRedemptionsByRewardProps = {
  items: readonly AnalyticsMeterItem[] | undefined
  isLoading?: boolean
}

export function AnalyticsRedemptionsByReward({
  items,
  isLoading = false,
}: AnalyticsRedemptionsByRewardProps) {
  const { t } = useTranslation()

  const handleDownload = () => {
    if (!items) return
    downloadCsv(
      'redemptions-by-reward',
      items.map((item) => ({
        reward: t(`analytics.rewards.${item.id}`),
        redeemed: item.value,
      })),
    )
  }

  return (
    <AnalyticsSectionCard
      title={t('analytics.redemptionsByReward.title')}
      description={t('analytics.redemptionsByReward.subtitle')}
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
    >
      <AnalyticsMeterList
        items={items}
        labelNamespace="analytics.rewards"
        isLoading={isLoading}
      />
    </AnalyticsSectionCard>
  )
}
