import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ModerationStatusBadge } from '@/features/moderation/components/moderation-status-badge'
import { ModerationTypeBadge } from '@/features/moderation/components/moderation-type-badge'
import { cn } from '@/lib/utils'
import type { ModerationReport } from '@/features/moderation/types/moderation.types'

const GRID =
  'grid min-w-[560px] grid-cols-[minmax(0,1.8fr)_minmax(5.5rem,1fr)_minmax(3.5rem,0.6fr)_minmax(4.5rem,0.75fr)_minmax(5.5rem,1fr)] items-center'

type ModerationTableProps = {
  rows: readonly ModerationReport[]
  selectedId: string | null
  isLoading?: boolean
  onSelect: (id: string) => void
}

export function ModerationTable({
  rows,
  selectedId,
  isLoading = false,
  onSelect,
}: ModerationTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={6}
              columns={5}
              dense
              label={t('moderation.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('moderation.states.emptyList')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('moderation.title')}
          >
            <div
              role="row"
              className={cn(GRID, 'border-b border-border bg-muted/40')}
            >
              {(
                [
                  'reportedContent',
                  'type',
                  'reports',
                  'when',
                  'status',
                ] as const
              ).map((col) => (
                <div
                  key={col}
                  role="columnheader"
                  className="px-3 py-2.5 text-[11px] font-bold text-muted-foreground first:ps-4 last:pe-4"
                >
                  {t(`moderation.columns.${col}`)}
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
                    <div role="cell" className="min-w-0 px-3 py-2.5 ps-4">
                      <p className="truncate text-[13px] font-bold text-foreground">
                        {t(`moderation.items.${row.titleKey}`)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t(`moderation.subtitles.${row.subtitleKey}`)}
                      </p>
                    </div>
                    <div role="cell" className="px-3 py-2.5">
                      <ModerationTypeBadge contentTypeId={row.contentTypeId}>
                        {t(`moderation.contentTypes.${row.contentTypeId}`)}
                      </ModerationTypeBadge>
                    </div>
                    <div
                      role="cell"
                      className="px-3 py-2.5 text-[13px] font-bold text-foreground"
                    >
                      {row.reportCount}
                    </div>
                    <div
                      role="cell"
                      className="px-3 py-2.5 text-[13px] text-muted-foreground"
                    >
                      {t(`moderation.when.${row.whenKey}`)}
                    </div>
                    <div role="cell" className="px-3 py-2.5 pe-4">
                      <ModerationStatusBadge statusId={row.statusId}>
                        {t(`moderation.statuses.${row.statusId}`)}
                      </ModerationStatusBadge>
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
