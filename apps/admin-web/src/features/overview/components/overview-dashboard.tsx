import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { OverviewAttentionPanel } from '@/features/overview/components/overview-attention-panel'
import { OverviewHeader } from '@/features/overview/components/overview-header'
import { OverviewKpiGrid } from '@/features/overview/components/overview-kpi-grid'
import { OverviewOpportunityFunnel } from '@/features/overview/components/overview-opportunity-funnel'
import { OverviewRecentActivity } from '@/features/overview/components/overview-recent-activity'
import { OverviewSignupsChart } from '@/features/overview/components/overview-signups-chart'
import { useOverviewDashboard } from '@/features/overview/hooks/use-overview-dashboard'
import { OVERVIEW_DEFAULT_RANGE } from '@/features/overview/constants'
import type { OverviewDateRange } from '@/features/overview/types/overview.types'

/**
 * Composes Overview sections and connects range + query state.
 * Section markup lives in dedicated component files.
 */
export function OverviewDashboard() {
  const { t } = useTranslation()

  const [range, setRange] = useState<OverviewDateRange>(() => ({
    from: OVERVIEW_DEFAULT_RANGE.from,
    to: OVERVIEW_DEFAULT_RANGE.to,
  }))

  const { data, isPending, isError, refetch } = useOverviewDashboard({
    range,
  })

  return (
    <div className="flex flex-col gap-6">
      <OverviewHeader range={range} onRangeChange={setRange} />

      {!isPending && isError ? (
        <ErrorState
          title={t('overview.states.errorTitle')}
          description={t('overview.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <OverviewKpiGrid
            kpis={data?.kpis}
            range={range}
            isLoading={isPending}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <OverviewSignupsChart
              signups={data?.signups}
              isLoading={isPending}
            />
            <OverviewAttentionPanel
              items={data?.attention}
              isLoading={isPending}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OverviewOpportunityFunnel
              funnel={data?.funnel}
              isLoading={isPending}
            />
            <OverviewRecentActivity
              items={data?.activity}
              activityAsOf={data?.activityAsOf}
              isLoading={isPending}
            />
          </div>
        </>
      )}
    </div>
  )
}
