import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ApplicationsStatusBadge } from '@/features/applications/components/applications-status-badge'
import { cn } from '@/lib/utils'
import type {
  ApplicationAvatarTone,
  ApplicationRow,
} from '@/features/applications/types/applications.types'

const GRID =
  'grid min-w-[720px] grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_minmax(4.5rem,0.7fr)_minmax(6rem,0.9fr)_minmax(5.5rem,0.8fr)_minmax(3.5rem,0.5fr)] items-center'

const avatarToneClassNames: Record<ApplicationAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type ApplicationsTableProps = {
  rows: readonly ApplicationRow[]
  isLoading?: boolean
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onView: (id: string) => void
}

export function ApplicationsTable({
  rows,
  isLoading = false,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onView,
}: ApplicationsTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={7}
              columns={6}
              dense
              label={t('applications.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('applications.states.emptyList')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('applications.title')}
          >
            <div
              role="row"
              className={cn(GRID, 'border-b border-border bg-muted/40')}
            >
              {(
                [
                  'applicant',
                  'listing',
                  'applied',
                  'status',
                  'timeInStage',
                  'actions',
                ] as const
              ).map((col) => (
                <div
                  key={col}
                  role="columnheader"
                  className={cn(
                    'px-3 py-2.5 text-[11px] font-bold text-muted-foreground first:ps-4 last:pe-4',
                    col === 'actions' && 'sr-only',
                  )}
                >
                  {t(`applications.columns.${col}`)}
                </div>
              ))}
            </div>

            <div role="rowgroup">
              {rows.map((row) => (
                <div
                  key={row.id}
                  role="row"
                  className={cn(
                    GRID,
                    'min-h-[64px] border-b border-border last:border-b-0',
                  )}
                >
                  <div role="cell" className="min-w-0 px-3 py-2.5 ps-4">
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
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-foreground">
                          {t(`applications.applicants.${row.applicantNameKey}`)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(`applications.cities.${row.cityId}`)}
                          {' · '}
                          {t(`applications.personas.${row.personaKey}`)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div role="cell" className="min-w-0 px-3 py-2.5">
                    <p className="truncate text-[13px] font-bold text-foreground">
                      {t(`applications.listings.${row.listingTitleKey}`)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(`applications.companies.${row.companyKey}`)}
                    </p>
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] text-muted-foreground"
                  >
                    {t(`applications.applied.${row.appliedKey}`)}
                  </div>

                  <div role="cell" className="px-3 py-2.5">
                    <ApplicationsStatusBadge statusId={row.statusId}>
                      {t(`applications.statuses.${row.statusId}`)}
                    </ApplicationsStatusBadge>
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] text-muted-foreground"
                  >
                    {t(`applications.timeInStage.${row.timeInStageKey}`)}
                  </div>

                  <div role="cell" className="px-3 py-2.5 pe-4 text-end">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-[13px] font-bold text-primary"
                      onClick={() => onView(row.id)}
                    >
                      {t('applications.actions.view')}
                    </Button>
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
