import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  OverviewAttentionId,
  OverviewAttentionItem,
  OverviewAttentionTone,
} from '@/features/overview/types/overview.types'
import { cn } from '@/lib/utils'

const TITLE_KEYS: Record<OverviewAttentionId, string> = {
  listingsAwaitingReview: 'overview.attention.items.listingsAwaitingReview.title',
  verificationRequests: 'overview.attention.items.verificationRequests.title',
  reportedContent: 'overview.attention.items.reportedContent.title',
  openSupportTickets: 'overview.attention.items.openSupportTickets.title',
}

const DETAIL_KEYS: Record<OverviewAttentionId, string> = {
  listingsAwaitingReview:
    'overview.attention.items.listingsAwaitingReview.detail',
  verificationRequests: 'overview.attention.items.verificationRequests.detail',
  reportedContent: 'overview.attention.items.reportedContent.detail',
  openSupportTickets: 'overview.attention.items.openSupportTickets.detail',
}

const TONE_BADGE_CLASS: Record<OverviewAttentionTone, string> = {
  warning: 'bg-warning/20 text-warning',
  info: 'bg-primary/10 text-primary',
  destructive: 'bg-destructive/10 text-destructive',
  neutral: 'bg-muted text-muted-foreground',
}

type OverviewAttentionPanelProps = {
  items: readonly OverviewAttentionItem[] | undefined
  isLoading?: boolean
  className?: string
}

function formatAttentionDetail(
  item: OverviewAttentionItem,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  switch (item.id) {
    case 'listingsAwaitingReview':
      return t(DETAIL_KEYS[item.id], {
        oldestWaitingHours: Number(item.detail.oldestWaitingHours ?? 0),
        slaHours: Number(item.detail.slaHours ?? 0),
      })
    case 'verificationRequests':
      return t(DETAIL_KEYS[item.id], {
        individuals: Number(item.detail.individuals ?? 0),
        companies: Number(item.detail.companies ?? 0),
      })
    case 'reportedContent':
      return t(DETAIL_KEYS[item.id], {
        highPriority: Number(item.detail.highPriority ?? 0),
      })
    case 'openSupportTickets':
      return t(DETAIL_KEYS[item.id], {
        unassigned: Number(item.detail.unassigned ?? 0),
      })
  }
}

export function OverviewAttentionPanel({
  items,
  isLoading = false,
  className,
}: OverviewAttentionPanelProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const numberLocale = isArabic ? 'ar' : 'en'

  return (
    <Card className={cn('min-w-0 shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-foreground">
          {t('overview.attention.title')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <ListSkeleton rows={4} label={t('overview.states.loading')} />
        ) : !items?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('overview.attention.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const title = t(TITLE_KEYS[item.id])
              const detail = formatAttentionDetail(item, t)
              const countLabel = new Intl.NumberFormat(numberLocale).format(
                item.count,
              )

              return (
                <li key={item.id}>
                  {/*
                    Destinations are existing admin route placeholders
                    (listings, verification, moderation, support).
                  */}
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors',
                      'hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    )}
                    aria-label={`${title}, ${countLabel}. ${detail}`}
                  >
                    <span
                      className={cn(
                        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums',
                        TONE_BADGE_CLASS[item.tone],
                      )}
                      aria-hidden="true"
                    >
                      {countLabel}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground">
                        {title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {detail}
                      </span>
                    </span>

                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
