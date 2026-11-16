import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { AnalyticsApplicationsByType } from '@/features/analytics/components/analytics-applications-by-type'
import { AnalyticsEventAttendance } from '@/features/analytics/components/analytics-event-attendance'
import { AnalyticsHeader } from '@/features/analytics/components/analytics-header'
import { AnalyticsKpiGrid } from '@/features/analytics/components/analytics-kpi-grid'
import { AnalyticsMembersByCity } from '@/features/analytics/components/analytics-members-by-city'
import { AnalyticsRedemptionsByReward } from '@/features/analytics/components/analytics-redemptions-by-reward'
import { AnalyticsTabs } from '@/features/analytics/components/analytics-tabs'
import { AnalyticsTopListingsTable } from '@/features/analytics/components/analytics-top-listings-table'
import { AnalyticsWeeklyActiveChart } from '@/features/analytics/components/analytics-weekly-active-chart'
import { useAnalyticsDashboard } from '@/features/analytics/hooks/use-analytics-dashboard'
import {
  selectAnalyticsKpis,
  showAnalyticsMarketplaceSection,
  showAnalyticsUsersSection,
} from '@/features/analytics/lib/select-analytics-kpis'
import { ANALYTICS_DEFAULT_RANGE } from '@/features/analytics/constants'
import type {
  AnalyticsDateRange,
  AnalyticsTabId,
} from '@/features/analytics/types/analytics.types'

/**
 * Composes Analytics sections and connects range + tab + query state.
 */
export function AnalyticsDashboard() {
  const { t } = useTranslation()

  const [range, setRange] = useState<AnalyticsDateRange>(() => ({
    from: ANALYTICS_DEFAULT_RANGE.from,
    to: ANALYTICS_DEFAULT_RANGE.to,
  }))
  const [tab, setTab] = useState<AnalyticsTabId>('overview')

  const { data, isPending, isError, refetch } = useAnalyticsDashboard({
    range,
  })

  const kpis = useMemo(() => selectAnalyticsKpis(data, tab), [data, tab])

  return (
    <div className="flex flex-col gap-4">
      <AnalyticsHeader range={range} onRangeChange={setRange} />
      <AnalyticsTabs value={tab} onChange={setTab} />

      {!isPending && isError ? (
        <ErrorState
          title={t('analytics.states.errorTitle')}
          description={t('analytics.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <AnalyticsKpiGrid kpis={kpis} isLoading={isPending} />

          {showAnalyticsUsersSection(tab) ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <AnalyticsWeeklyActiveChart
                weeklyActive={data?.weeklyActive}
                isLoading={isPending}
              />
              <AnalyticsMembersByCity
                items={data?.membersByCity}
                isLoading={isPending}
              />
            </div>
          ) : null}

          {showAnalyticsMarketplaceSection(tab) ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <AnalyticsApplicationsByType
                items={data?.applicationsByType}
                isLoading={isPending}
              />
              <AnalyticsTopListingsTable
                listings={data?.topListings}
                isLoading={isPending}
              />
            </div>
          ) : null}

          {tab === 'events' ? (
            <AnalyticsEventAttendance
              items={data?.eventAttendance}
              isLoading={isPending}
            />
          ) : null}

          {tab === 'rewards' ? (
            <AnalyticsRedemptionsByReward
              items={data?.redemptionsByReward}
              isLoading={isPending}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
