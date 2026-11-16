import { useTranslation } from 'react-i18next'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { VerificationTypeBadge } from '@/features/verification/components/verification-type-badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  VerificationRequest,
  VerificationTabId,
} from '@/features/verification/types/verification.types'

const TABS: readonly VerificationTabId[] = ['waiting', 'moreInfo', 'decided']

const avatarToneClassNames = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  mint: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  amber: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  slate: 'bg-muted text-muted-foreground',
} as const

type VerificationMasterListProps = {
  rows: readonly VerificationRequest[]
  selectedId: string | null
  isLoading?: boolean
  tab: VerificationTabId
  onTabChange: (tab: VerificationTabId) => void
  tabCounts: Record<VerificationTabId, number>
  onSelect: (id: string) => void
}

export function VerificationMasterList({
  rows,
  selectedId,
  isLoading = false,
  tab,
  onTabChange,
  tabCounts,
  onSelect,
}: VerificationMasterListProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="border-b border-border px-4 pt-4 pb-0">
        <div
          role="tablist"
          aria-label={t('verification.tabs.label')}
          className="flex items-end gap-4 overflow-x-auto"
        >
          {TABS.map((tabId) => {
            const selected = tab === tabId
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(tabId)}
                className={cn(
                  'shrink-0 border-b-2 pb-2.5 text-sm font-bold transition-colors',
                  selected
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`verification.tabs.${tabId}`, { count: tabCounts[tabId] })}
              </button>
            )
          })}
        </div>
      </CardContent>

      <CardContent className="px-0 py-0">
        {isLoading ? (
          <ListSkeleton rows={6} label={t('verification.states.loading')} />
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('verification.states.emptyList')}
          </p>
        ) : (
          <ul className="flex flex-col" aria-label={t('verification.list.label')}>
            {rows.map((row) => {
              const active = row.id === selectedId
              const meta = row.listSubtitleKey
                ? t('verification.list.roleDocuments', {
                    role: t(
                      `verification.listSubtitles.${row.listSubtitleKey}`,
                    ),
                    count: row.documentCount,
                  })
                : t('verification.list.documentsCity', {
                    count: row.documentCount,
                    city: t(`verification.cities.${row.cityId}`),
                  })

              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(row.id)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-border px-4 py-3 text-start transition-colors last:border-b-0',
                      'border-s-[3px] border-s-transparent hover:bg-muted/40',
                      active &&
                        'border-s-primary bg-primary/8 hover:bg-primary/8',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        avatarToneClassNames[row.avatarTone],
                      )}
                      aria-hidden="true"
                    >
                      {row.initials}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-foreground">
                        {t(`verification.names.${row.nameKey}`)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {meta}
                      </span>
                    </span>

                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <VerificationTypeBadge typeId={row.applicantTypeId}>
                        {t(`verification.types.${row.applicantTypeId}`)}
                      </VerificationTypeBadge>
                      <span
                        className={cn(
                          'text-[11px] font-bold',
                          row.slaTone === 'warning' && 'text-warning',
                          row.slaTone === 'success' && 'text-success',
                          row.slaTone === 'danger' && 'text-destructive',
                          row.slaTone === 'muted' && 'text-muted-foreground',
                        )}
                      >
                        {t(`verification.sla.${row.slaLabelKey}`)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
