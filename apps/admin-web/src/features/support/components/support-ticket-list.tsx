import { useTranslation } from 'react-i18next'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { SupportCategoryBadge } from '@/features/support/components/support-category-badge'
import { cn } from '@/lib/utils'
import type {
  SupportTicket,
  SupportTicketTab,
} from '@/features/support/types/support.types'

const TABS: readonly SupportTicketTab[] = ['open', 'mine', 'closed']

type SupportTicketListProps = {
  tab: SupportTicketTab
  onTabChange: (tab: SupportTicketTab) => void
  tabCounts: Record<SupportTicketTab, number>
  tickets: readonly SupportTicket[]
  selectedId: string | null
  isLoading?: boolean
  onSelect: (id: string) => void
}

export function SupportTicketList({
  tab,
  onTabChange,
  tabCounts,
  tickets,
  selectedId,
  isLoading = false,
  onSelect,
}: SupportTicketListProps) {
  const { t } = useTranslation()

  return (
    <Card className="flex min-h-[32rem] min-w-0 flex-col gap-0 overflow-hidden py-0 shadow-sm">
      <div className="border-b border-border p-3">
        <div
          role="tablist"
          aria-label={t('support.tabs.label')}
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[22px] bg-primary/10 p-1"
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
                  'h-8 shrink-0 rounded-2xl px-3 text-xs font-bold whitespace-nowrap transition-colors',
                  selected
                    ? 'bg-card text-primary shadow-sm'
                    : 'bg-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`support.tabs.${tabId}`, { count: tabCounts[tabId] })}
              </button>
            )
          })}
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto px-0 py-0">
        {isLoading ? (
          <ListSkeleton
            rows={8}
            showAvatar={false}
            label={t('support.states.loading')}
          />
        ) : tickets.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('support.states.emptyList')}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((ticket) => {
              const active = ticket.id === selectedId
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(ticket.id)}
                    className={cn(
                      'flex w-full gap-2 border-s-[3px] border-s-transparent px-3 py-3 text-start transition-colors hover:bg-muted/40',
                      active && 'border-s-primary bg-primary/8 hover:bg-primary/8',
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-[13px] font-bold text-foreground">
                        {t(`support.senders.${ticket.senderNameKey}`)}
                      </p>
                      <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        {t(`support.subjects.${ticket.subjectKey}`)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <SupportCategoryBadge
                          category={ticket.category}
                          label={t(`support.categories.${ticket.category}`)}
                        />
                        {ticket.slaLabelKey ? (
                          <span
                            className={cn(
                              'text-[11px] font-bold',
                              ticket.slaTone === 'danger' && 'text-destructive',
                              ticket.slaTone === 'warning' && 'text-warning',
                            )}
                          >
                            {t(`support.sla.${ticket.slaLabelKey}`)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      {t(`support.age.${ticket.ageKey}`)}
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
