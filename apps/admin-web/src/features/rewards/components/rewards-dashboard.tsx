import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { RewardsEarnRulesCard } from '@/features/rewards/components/rewards-earn-rules-card'
import { RewardsHeader } from '@/features/rewards/components/rewards-header'
import { RewardsKpiGrid } from '@/features/rewards/components/rewards-kpi-grid'
import { RewardsMainPanel } from '@/features/rewards/components/rewards-main-panel'
import { RewardsManualAdjustmentCard } from '@/features/rewards/components/rewards-manual-adjustment-card'
import { useRewardsDashboard } from '@/features/rewards/hooks/use-rewards-dashboard'
import { REWARDS_DEFAULT_RANGE } from '@/features/rewards/constants'
import type {
  RewardsDateRange,
  RewardsTabId,
} from '@/features/rewards/types/rewards.types'

export function RewardsDashboard() {
  const { t } = useTranslation()

  const [range, setRange] = useState<RewardsDateRange>(() => ({
    from: REWARDS_DEFAULT_RANGE.from,
    to: REWARDS_DEFAULT_RANGE.to,
  }))
  const [tab, setTab] = useState<RewardsTabId>('catalog')
  const [liveOverrides, setLiveOverrides] = useState<Record<string, boolean>>(
    {},
  )

  const { data, isPending, isError, refetch } = useRewardsDashboard({ range })

  return (
    <div className="flex flex-col gap-4">
      <RewardsHeader range={range} onRangeChange={setRange} />

      {!isPending && isError ? (
        <ErrorState
          title={t('rewards.states.errorTitle')}
          description={t('rewards.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <RewardsKpiGrid kpis={data?.kpis ?? []} isLoading={isPending} />

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22.5rem]">
            <RewardsMainPanel
              tab={tab}
              onTabChange={setTab}
              pendingRedemptionsCount={data?.pendingRedemptionsCount ?? 0}
              rewards={data?.rewards ?? []}
              isLoading={isPending}
              liveOverrides={liveOverrides}
              onLiveChange={(id, live) => {
                setLiveOverrides((prev) => ({ ...prev, [id]: live }))
              }}
            />

            <aside className="flex min-w-0 flex-col gap-4">
              <RewardsEarnRulesCard
                rules={data?.earnRules ?? []}
                isLoading={isPending}
              />
              {data?.manualAdjustmentDefaults ? (
                <RewardsManualAdjustmentCard
                  key={isPending ? 'loading' : 'ready'}
                  members={data.adjustmentMembers}
                  defaults={data.manualAdjustmentDefaults}
                  isLoading={isPending}
                />
              ) : null}
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
