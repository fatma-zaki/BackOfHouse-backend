import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { UsersPointsSourceBadge } from '@/features/users/components/users-points-source-badge'
import { cn } from '@/lib/utils'
import type { UserPointsEntry } from '@/features/users/types/users.types'

const GRID =
  'grid grid-cols-[minmax(5rem,0.7fr)_minmax(0,1.5fr)_minmax(6rem,0.9fr)_minmax(4rem,0.5fr)] items-center gap-2'

type UserDetailPointsTableProps = {
  entries: readonly UserPointsEntry[]
}

export function UserDetailPointsTable({ entries }: UserDetailPointsTableProps) {
  const { t } = useTranslation()

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('users.detail.emptyPoints')}
      </p>
    )
  }

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="px-0 py-0">
        <div className="overflow-x-auto" role="table">
          <div
            role="row"
            className={cn(GRID, 'border-b border-border bg-muted/40 px-4 py-2.5')}
          >
            {(['date', 'activity', 'source', 'points'] as const).map((col) => (
              <div
                key={col}
                role="columnheader"
                className="text-[11px] font-bold text-muted-foreground"
              >
                {t(`users.detail.pointsColumns.${col}`)}
              </div>
            ))}
          </div>

          <div role="rowgroup">
            {entries.map((entry) => (
              <div
                key={entry.id}
                role="row"
                className={cn(
                  GRID,
                  'border-b border-border px-4 py-3 last:border-b-0',
                )}
              >
                <div role="cell" className="text-[13px] text-muted-foreground">
                  {t(`users.detail.pointDates.${entry.dateKey}`)}
                </div>
                <div role="cell" className="text-[13px] font-medium text-foreground">
                  {t(`users.detail.pointActivities.${entry.activityKey}`)}
                </div>
                <div role="cell">
                  <UsersPointsSourceBadge tone={entry.sourceTone}>
                    {t(`users.detail.pointSources.${entry.sourceId}`)}
                  </UsersPointsSourceBadge>
                </div>
                <div
                  role="cell"
                  className={cn(
                    'text-end text-[13px] font-bold tabular-nums',
                    entry.points >= 0 ? 'text-success' : 'text-destructive',
                  )}
                >
                  {entry.points >= 0 ? '+' : ''}
                  {entry.points.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
