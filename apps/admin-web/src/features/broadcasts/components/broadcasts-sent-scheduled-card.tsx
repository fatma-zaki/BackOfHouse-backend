import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BroadcastsOpenedCell } from '@/features/broadcasts/components/broadcasts-opened-cell'
import { BroadcastsStatusBadge } from '@/features/broadcasts/components/broadcasts-status-badge'
import { cn } from '@/lib/utils'
import type { BroadcastRow } from '@/features/broadcasts/types/broadcasts.types'

const GRID =
  'grid min-w-[560px] grid-cols-[minmax(0,1.7fr)_0.8fr_1.1fr_0.9fr] items-center'

type BroadcastsSentScheduledCardProps = {
  rows: readonly BroadcastRow[]
  isLoading?: boolean
}

function formatSentTo(
  value: number | null,
  t: (key: string) => string,
  locale: string,
): string {
  if (value === null) {
    return t('broadcasts.table.sentToEmpty')
  }
  return value.toLocaleString(locale)
}

export function BroadcastsSentScheduledCard({
  rows,
  isLoading = false,
}: BroadcastsSentScheduledCardProps) {
  const { t, i18n } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 px-[18px] py-3.5">
        <CardTitle className="text-[15px] font-bold tracking-tight">
          {t('broadcasts.sentScheduled.title')}
        </CardTitle>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-[13px] font-bold text-primary"
          onClick={() => {
            toast.message(t('broadcasts.toasts.downloadCsv'))
          }}
        >
          {t('broadcasts.sentScheduled.downloadCsv')}
        </Button>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={6}
              columns={4}
              dense
              label={t('broadcasts.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            {t('broadcasts.states.emptyList')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('broadcasts.sentScheduled.title')}
          >
            <div
              role="row"
              className={cn(GRID, 'border-y border-border')}
            >
              {(['broadcast', 'sentTo', 'opened', 'status'] as const).map(
                (col) => (
                  <div
                    key={col}
                    role="columnheader"
                    className={cn(
                      'px-4 py-2.5 text-[12px] font-bold text-muted-foreground',
                      (col === 'sentTo' || col === 'opened') && 'text-end',
                    )}
                  >
                    {t(`broadcasts.columns.${col}`)}
                  </div>
                ),
              )}
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                role="row"
                className={cn(
                  GRID,
                  'h-[58px] border-b border-border last:border-b-0',
                )}
              >
                <div role="cell" className="min-w-0 px-4 py-2">
                  <p className="truncate text-[13px] leading-snug font-bold text-foreground">
                    {t(`broadcasts.rows.${row.titleKey}`)}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {t(`broadcasts.rowMeta.${row.channelsMetaKey}`)}
                  </p>
                </div>
                <div
                  role="cell"
                  className="px-4 py-2 text-end text-[13px] font-bold tabular-nums text-foreground"
                >
                  {formatSentTo(row.sentTo, t, i18n.language)}
                </div>
                <div role="cell" className="flex justify-end px-4 py-2">
                  <BroadcastsOpenedCell openedPercent={row.openedPercent} />
                </div>
                <div role="cell" className="px-4 py-2 pe-5">
                  <BroadcastsStatusBadge statusId={row.statusId} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
