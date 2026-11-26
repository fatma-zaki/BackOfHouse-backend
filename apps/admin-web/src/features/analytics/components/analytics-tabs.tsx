import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  ANALYTICS_TAB_IDS,
  type AnalyticsTabId,
} from '@/features/analytics/types/analytics.types'

type AnalyticsTabsProps = {
  value: AnalyticsTabId
  onChange: (tab: AnalyticsTabId) => void
}

/**
 * Segmented pill tabs matching the Analytics reference control.
 */
export function AnalyticsTabs({ value, onChange }: AnalyticsTabsProps) {
  const { t } = useTranslation()

  return (
    <div
      role="tablist"
      aria-label={t('analytics.tabs.label')}
      className="flex max-w-full items-center gap-1 self-start overflow-x-auto rounded-[22px] bg-primary/10 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ANALYTICS_TAB_IDS.map((tabId) => {
        const selected = tabId === value

        return (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tabId)}
            className={cn(
              'h-8 shrink-0 rounded-2xl border border-transparent px-3.5 text-xs font-bold whitespace-nowrap transition-colors',
              selected
                ? 'bg-card text-primary shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`analytics.tabs.${tabId}`)}
          </button>
        )
      })}
    </div>
  )
}
