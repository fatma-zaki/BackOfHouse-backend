import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserDetailPointsTable } from '@/features/users/components/user-detail-points-table'
import { cn } from '@/lib/utils'
import type {
  UserDetailTabId,
  UserPointsEntry,
} from '@/features/users/types/users.types'

const TAB_IDS: readonly UserDetailTabId[] = [
  'points',
  'applications',
  'events',
  'reports',
  'devices',
]

type UserDetailMainPanelProps = {
  pointsEntries: readonly UserPointsEntry[]
}

export function UserDetailMainPanel({ pointsEntries }: UserDetailMainPanelProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<UserDetailTabId>('points')

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-2 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label={t('users.detail.tabs.label')}
          className="flex flex-wrap gap-4"
        >
          {TAB_IDS.map((tabId) => {
            const selected = tab === tabId
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(tabId)}
                className={cn(
                  '-mb-px border-b-2 pb-2 text-sm font-bold transition-colors',
                  selected
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`users.detail.tabs.${tabId}`)}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled
          title={t('users.actions.downloadCsvDisabledHint')}
          className="pb-2 text-sm font-bold text-primary/40 disabled:pointer-events-none"
        >
          {t('users.actions.downloadCsv')}
        </button>
      </div>

      {tab === 'points' ? (
        <UserDetailPointsTable entries={pointsEntries} />
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t('users.detail.tabPlaceholder', {
            tab: t(`users.detail.tabs.${tab}`),
          })}
        </p>
      )}
    </div>
  )
}
