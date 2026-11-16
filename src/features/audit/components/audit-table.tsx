import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Pagination } from '@/components/shared/pagination'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { AuditActionBadge } from '@/features/audit/components/audit-action-badge'
import { cn } from '@/lib/utils'
import type {
  AuditAvatarTone,
  AuditRow,
} from '@/features/audit/types/audit.types'

const GRID =
  'grid min-w-[720px] grid-cols-[minmax(5.5rem,0.75fr)_minmax(0,1.35fr)_minmax(0,1.1fr)_minmax(0,1.35fr)_minmax(0,1fr)] items-center'

const avatarToneClassNames: Record<AuditAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type AuditTableProps = {
  rows: readonly AuditRow[]
  isLoading?: boolean
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function AuditTable({
  rows,
  isLoading = false,
  page,
  pageSize,
  totalItems,
  onPageChange,
}: AuditTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={8}
              columns={5}
              dense
              label={t('audit.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('audit.states.emptyList')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('audit.title')}
          >
            <div
              role="row"
              className={cn(GRID, 'border-b border-border bg-muted/40')}
            >
              {(['when', 'admin', 'action', 'target', 'details'] as const).map(
                (col) => (
                  <div
                    key={col}
                    role="columnheader"
                    className="px-3 py-2.5 text-[11px] font-bold text-muted-foreground first:ps-4 last:pe-4"
                  >
                    {t(`audit.columns.${col}`)}
                  </div>
                ),
              )}
            </div>

            <div role="rowgroup">
              {rows.map((row) => (
                <div
                  key={row.id}
                  role="row"
                  className={cn(
                    GRID,
                    'min-h-[56px] border-b border-border last:border-b-0',
                  )}
                >
                  <div
                    role="cell"
                    className="px-3 py-2.5 ps-4 text-[13px] text-muted-foreground"
                  >
                    {t(`audit.when.${row.whenKey}`)}
                  </div>

                  <div role="cell" className="min-w-0 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                          avatarToneClassNames[row.avatarTone],
                        )}
                        aria-hidden="true"
                      >
                        {row.initials}
                      </span>
                      <p className="truncate text-[13px] font-bold text-foreground">
                        {t(`audit.admins.${row.adminKey}`)}
                      </p>
                    </div>
                  </div>

                  <div role="cell" className="px-3 py-2.5">
                    <AuditActionBadge actionId={row.actionId}>
                      {t(`audit.actions.${row.actionId}`)}
                    </AuditActionBadge>
                  </div>

                  <div
                    role="cell"
                    className="min-w-0 px-3 py-2.5 text-[13px] font-bold text-foreground"
                  >
                    <span className="line-clamp-2">
                      {t(`audit.targets.${row.targetKey}`)}
                    </span>
                  </div>

                  <div
                    role="cell"
                    className="min-w-0 px-3 py-2.5 pe-4 text-[13px] text-muted-foreground"
                  >
                    {row.detailsKey
                      ? t(`audit.details.${row.detailsKey}`)
                      : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {!isLoading && totalItems > 0 ? (
        <CardFooter className="border-t bg-card px-4 py-3">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            className="w-full"
          />
        </CardFooter>
      ) : null}
    </Card>
  )
}
