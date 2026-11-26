import { useTranslation } from 'react-i18next'
import { DetailPanelSkeleton } from '@/components/shared/detail-panel-skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ModerationTypeBadge } from '@/features/moderation/components/moderation-type-badge'
import { isModerationActionable } from '@/features/moderation/lib/filter-moderation'
import { cn } from '@/lib/utils'
import type { ModerationReport } from '@/features/moderation/types/moderation.types'

type ModerationDetailProps = {
  report: ModerationReport | null
  isLoading?: boolean
  onDismiss: () => void
  onWarn: () => void
  onRemove: () => void
  onSuspend: () => void
}

export function ModerationDetail({
  report,
  isLoading = false,
  onDismiss,
  onWarn,
  onRemove,
  onSuspend,
}: ModerationDetailProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <DetailPanelSkeleton
        label={t('moderation.states.loading')}
        showActions
      />
    )
  }

  if (!report) {
    return (
      <Card className="flex min-h-[24rem] min-w-0 items-center justify-center shadow-sm">
        <p className="px-6 text-center text-sm text-muted-foreground">
          {t('moderation.states.pickReport')}
        </p>
      </Card>
    )
  }

  const actionable = isModerationActionable(report.statusId)
  const maxReasonCount = Math.max(
    ...report.reportReasons.map((r) => r.count),
    1,
  )

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden shadow-sm ring-1 ring-primary/15">
      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <ModerationTypeBadge contentTypeId={report.contentTypeId}>
            {t(`moderation.contentTypes.${report.contentTypeId}`)}
          </ModerationTypeBadge>
          {report.reportCount > 0 ? (
            <StatusBadge
              status="warning"
              className="rounded-full border-transparent bg-warning/15 text-[10px] font-bold tracking-wide text-warning uppercase"
            >
              {t('moderation.detail.reportsBadge', {
                count: report.reportCount,
              })}
            </StatusBadge>
          ) : null}
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {t(`moderation.items.${report.titleKey}`)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(`moderation.meta.${report.metaKey}`)}
          </p>
        </div>

        <blockquote className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-[13px] leading-relaxed text-foreground">
          {t(`moderation.quotes.${report.contentQuoteKey}`)}
        </blockquote>

        {report.reportReasons.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              {t('moderation.detail.whyReported')}
            </p>
            <ul className="flex flex-col gap-2.5">
              {report.reportReasons.map((reason) => (
                <li key={reason.reasonKey} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="font-bold text-foreground">
                      {t(`moderation.reasons.${reason.reasonKey}`)}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {reason.count}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(reason.count / maxReasonCount) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {report.reporterQuotes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              {t('moderation.detail.fromReporters')}
            </p>
            <ul className="flex flex-col gap-2">
              {report.reporterQuotes.map((entry) => (
                <li
                  key={entry.quoteKey}
                  className="text-[13px] leading-relaxed text-foreground"
                >
                  <span className="italic">
                    &ldquo;{t(`moderation.reporterQuotes.${entry.quoteKey}`)}
                    &rdquo;
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    — {t(`moderation.reporterAttribution.${entry.attributionKey}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {t(`moderation.accountHistory.${report.accountHistoryKey}`)}
        </p>
      </CardContent>

      {actionable ? (
        <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/20">
          <Button type="button" variant="ghost" onClick={onDismiss}>
            {t('moderation.actions.dismiss')}
          </Button>
          <div className="ms-auto flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onWarn}>
              {t('moderation.actions.warn')}
            </Button>
            <Button type="button" onClick={onRemove}>
              {t('moderation.actions.removeListing')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive',
              )}
              onClick={onSuspend}
            >
              {t('moderation.actions.suspend')}
            </Button>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  )
}
