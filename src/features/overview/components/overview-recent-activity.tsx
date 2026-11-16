import { differenceInHours, differenceInMinutes, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/shared/empty-state'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type {
  OverviewActivityEntityKey,
  OverviewActivityItem,
  OverviewActivityTone,
} from '@/features/overview/types/overview.types'
import { cn } from '@/lib/utils'

const TONE_DOT_CLASS: Record<OverviewActivityTone, string> = {
  primary: 'bg-primary',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

type OverviewRecentActivityProps = {
  items: readonly OverviewActivityItem[] | undefined
  /** ISO-8601 reference instant from the Overview adapter. */
  activityAsOf: string | undefined
  isLoading?: boolean
  className?: string
}

function resolveEntityLabel(
  key: OverviewActivityEntityKey | undefined,
  t: (key: string) => string,
): string {
  if (!key) return ''
  return t(`overview.activity.entities.${key}`)
}

function formatCompactRelative(
  occurredAt: string,
  asOfIso: string | undefined,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  const occurred = parseISO(occurredAt)
  if (Number.isNaN(occurred.getTime())) {
    return t('overview.activity.relative.unknown')
  }

  const asOf = asOfIso ? parseISO(asOfIso) : new Date()
  const reference = Number.isNaN(asOf.getTime()) ? new Date() : asOf
  const minutes = Math.max(0, differenceInMinutes(reference, occurred))

  if (minutes < 60) {
    return t('overview.activity.relative.minutes', { count: minutes || 1 })
  }

  const hours = Math.max(1, differenceInHours(reference, occurred))
  if (hours < 24) {
    return t('overview.activity.relative.hours', { count: hours })
  }

  const days = Math.max(1, Math.floor(hours / 24))
  return t('overview.activity.relative.days', { count: days })
}

function resolveActivityTemplateKey(item: OverviewActivityItem): string {
  const extended = item as OverviewActivityItem & {
    messageKey?: string
    bodyKey?: string
  }
  if (extended.messageKey) {
    return extended.messageKey.startsWith('overview.')
      ? extended.messageKey
      : `overview.activity.items.${extended.messageKey}`
  }
  if (extended.bodyKey) {
    return extended.bodyKey.startsWith('overview.')
      ? extended.bodyKey
      : `overview.activity.items.${extended.bodyKey}`
  }
  // Derive locale item key from id (e.g. act-1 → act1) when message entities exist.
  if (item.message?.actorKey) {
    const derived = item.id.replace(/-/g, '')
    return `overview.activity.items.${derived}`
  }
  return 'overview.activity.items.fallback'
}

function formatActivityMessage(
  item: OverviewActivityItem,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  return t(resolveActivityTemplateKey(item), {
    actor: resolveEntityLabel(item.message.actorKey, t),
    target: resolveEntityLabel(item.message.targetKey, t),
  })
}

export function OverviewRecentActivity({
  items,
  activityAsOf,
  isLoading = false,
  className,
}: OverviewRecentActivityProps) {
  const { t } = useTranslation()
  const viewAllDisabledHint = t('overview.activity.viewAllDisabledHint')

  return (
    <Card className={cn('min-w-0 overflow-visible shadow-sm', className)}>
      <CardHeader className="gap-1">
        <CardTitle className="min-w-0 pe-2 text-base font-bold text-foreground">
          {t('overview.activity.title')}
        </CardTitle>

        <CardAction className="max-w-none justify-self-end">
          <Button
            type="button"
            variant="ghost"
            disabled
            aria-disabled="true"
            title={viewAllDisabledHint}
            aria-label={`${t('overview.activity.viewAll')}. ${viewAllDisabledHint}`}
            className="h-auto px-0 py-0.5 text-sm leading-5 font-medium text-primary opacity-60 hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-60"
          >
            {t('overview.activity.viewAll')}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <ListSkeleton rows={5} label={t('overview.states.loading')} />
        ) : !items?.length ? (
          <EmptyState
            title={t('overview.activity.emptyTitle')}
            description={t('overview.activity.emptyDescription')}
            className="py-6"
          />
        ) : (
          <ul
            className="divide-y divide-border"
            aria-label={t('overview.activity.title')}
          >
            {items.map((item) => {
              const description = formatActivityMessage(item, t)
              const timeLabel = formatCompactRelative(
                item.occurredAt,
                activityAsOf,
                t,
              )

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      TONE_DOT_CLASS[item.tone],
                    )}
                    aria-hidden="true"
                  />

                  <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                    <span className="sr-only">
                      {t('overview.activity.toneLabel', {
                        tone: t(`overview.activity.tones.${item.tone}`),
                      })}
                    </span>
                    {description}
                  </p>

                  <time
                    dateTime={item.occurredAt}
                    className="shrink-0 text-xs tabular-nums text-muted-foreground"
                  >
                    {timeLabel}
                  </time>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
