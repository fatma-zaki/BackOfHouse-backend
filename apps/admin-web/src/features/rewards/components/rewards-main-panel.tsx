import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RewardsCatalogTable } from '@/features/rewards/components/rewards-catalog-table'
import { cn } from '@/lib/utils'
import {
  REWARDS_TAB_IDS,
  type RewardRow,
  type RewardsTabId,
} from '@/features/rewards/types/rewards.types'

type RewardsMainPanelProps = {
  tab: RewardsTabId
  onTabChange: (tab: RewardsTabId) => void
  pendingRedemptionsCount: number
  rewards: readonly RewardRow[]
  isLoading?: boolean
  liveOverrides: Readonly<Record<string, boolean>>
  onLiveChange: (id: string, live: boolean) => void
}

function tabLabel(
  tabId: RewardsTabId,
  pendingRedemptionsCount: number,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  if (tabId === 'redemptions') {
    return t('rewards.tabs.redemptions', { count: pendingRedemptionsCount })
  }
  return t(`rewards.tabs.${tabId}`)
}

export function RewardsMainPanel({
  tab,
  onTabChange,
  pendingRedemptionsCount,
  rewards,
  isLoading = false,
  liveOverrides,
  onLiveChange,
}: RewardsMainPanelProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label={t('rewards.tabs.label')}
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[22px] bg-primary/10 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {REWARDS_TAB_IDS.map((tabId) => {
            const selected = tab === tabId
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(tabId)}
                className={cn(
                  'h-8 shrink-0 rounded-2xl px-3.5 text-xs font-bold whitespace-nowrap transition-colors',
                  selected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tabLabel(tabId, pendingRedemptionsCount, t)}
              </button>
            )
          })}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 self-start rounded-full px-3 text-xs font-bold text-primary hover:bg-primary/10 hover:text-primary sm:self-center"
          onClick={() => {
            toast.message(t('rewards.toasts.addReward'))
          }}
        >
          <Plus data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          {t('rewards.actions.addReward')}
        </Button>
      </div>

      <CardContent className="px-0 py-0">
        {tab === 'catalog' ? (
          <RewardsCatalogTable
            rows={rewards}
            isLoading={isLoading}
            liveOverrides={liveOverrides}
            onLiveChange={onLiveChange}
          />
        ) : tab === 'redemptions' ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('rewards.states.redemptionsPlaceholder')}
          </p>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('rewards.states.ledgerPlaceholder')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
