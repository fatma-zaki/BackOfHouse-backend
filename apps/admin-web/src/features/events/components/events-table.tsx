import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { EventsEventThumb } from '@/features/events/components/events-event-thumb'
import { EventsPointsStatusBadge } from '@/features/events/components/events-points-status-badge'
import { EventsToolbar } from '@/features/events/components/events-toolbar'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { EventRow, EventsTabId } from '@/features/events/types/events.types'

const GRID =
  'grid min-w-[640px] grid-cols-[minmax(0,2fr)_minmax(4.5rem,0.85fr)_minmax(4rem,0.7fr)_minmax(5.5rem,1fr)_minmax(6.5rem,1.05fr)] items-center'

type EventsTableProps = {
  rows: readonly EventRow[]
  selectedId: string | null
  isLoading?: boolean
  onSelect: (id: string) => void
  tab: EventsTabId
  onTabChange: (tab: EventsTabId) => void
  tabCounts: Record<EventsTabId, number>
  cityId: string
  onCityChange: (value: string) => void
  cityOptions: readonly { value: string; label: string }[]
}

function CheckedInCell({ percent }: { percent: number }) {
  const ratio = Math.min(Math.max(percent, 0), 100) / 100

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className="h-1.5 min-w-[3rem] flex-1 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="shrink-0 text-[13px] font-bold tabular-nums text-foreground">
        {percent}%
      </span>
    </div>
  )
}

export function EventsTable({
  rows,
  selectedId,
  isLoading = false,
  onSelect,
  tab,
  onTabChange,
  tabCounts,
  cityId,
  onCityChange,
  cityOptions,
}: EventsTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="flex flex-col gap-3 px-4 pt-4 pb-0">
        <EventsToolbar
          tab={tab}
          onTabChange={onTabChange}
          tabCounts={tabCounts}
          cityId={cityId}
          onCityChange={onCityChange}
          cityOptions={cityOptions}
        />
      </CardContent>

      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={7}
              columns={5}
              dense
              label={t('events.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('events.states.emptyList')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('events.table.label')}
          >
            <div
              role="row"
              className={cn(GRID, 'border-y border-border bg-muted/40')}
            >
              {(
                ['event', 'dates', 'registered', 'checkedIn', 'points'] as const
              ).map((col) => (
                <div
                  key={col}
                  role="columnheader"
                  className="px-3 py-2.5 text-[11px] font-bold text-muted-foreground first:ps-4 last:pe-4"
                >
                  {t(`events.columns.${col}`)}
                </div>
              ))}
            </div>

            <div role="rowgroup">
              {rows.map((row) => {
                const active = row.id === selectedId
                return (
                  <button
                    key={row.id}
                    type="button"
                    role="row"
                    onClick={() => onSelect(row.id)}
                    className={cn(
                      GRID,
                      'w-full min-h-[62px] border-b border-border text-start transition-colors last:border-b-0',
                      'border-s-[3px] border-s-transparent hover:bg-muted/40',
                      active &&
                        'border-s-primary bg-primary/8 hover:bg-primary/8',
                    )}
                  >
                    <div
                      role="cell"
                      className="flex min-w-0 items-center gap-2.5 px-3 py-2.5 ps-4"
                    >
                      <EventsEventThumb
                        gradient={row.thumbGradient}
                        className="size-10"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-foreground">
                          {t(`events.items.${row.titleKey}`)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(`events.venues.${row.venueKey}`)}
                        </p>
                      </div>
                    </div>
                    <div
                      role="cell"
                      className="px-3 py-2.5 text-[13px] text-muted-foreground"
                    >
                      {t(`events.dates.${row.datesKey}`)}
                    </div>
                    <div
                      role="cell"
                      className="px-3 py-2.5 text-[13px] font-bold tabular-nums text-foreground"
                    >
                      {row.registered.toLocaleString()}
                    </div>
                    <div role="cell" className="px-3 py-2.5 pe-2">
                      <CheckedInCell percent={row.checkInPercent} />
                    </div>
                    <div role="cell" className="px-3 py-2.5 pe-4">
                      <EventsPointsStatusBadge statusId={row.pointsStatusId}>
                        {t(`events.pointsStatuses.${row.pointsStatusId}`)}
                      </EventsPointsStatusBadge>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
