import { BadgeCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Pagination } from '@/components/shared/pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CompaniesStatusBadge } from '@/features/companies/components/companies-status-badge'
import { cn } from '@/lib/utils'
import type {
  CompanyAvatarTone,
  CompanyRow,
} from '@/features/companies/types/companies.types'

const GRID =
  'grid min-w-[880px] grid-cols-[minmax(0,1.6fr)_minmax(5rem,0.75fr)_minmax(4.5rem,0.65fr)_minmax(5.5rem,0.75fr)_minmax(0,1fr)_minmax(6.5rem,0.85fr)_minmax(3.5rem,0.5fr)] items-center'

const avatarToneClassNames: Record<CompanyAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type CompaniesTableProps = {
  rows: readonly CompanyRow[]
  isLoading?: boolean
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onView: (id: string) => void
}

function ResponseRateBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className="h-2 min-w-[4.5rem] flex-1 max-w-[5.5rem] overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="shrink-0 text-[13px] font-medium tabular-nums text-foreground">
        {clamped}%
      </span>
    </div>
  )
}

export function CompaniesTable({
  rows,
  isLoading = false,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onView,
}: CompaniesTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={7}
              columns={7}
              dense
              label={t('companies.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('companies.states.emptyList')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('companies.title')}
          >
            <div
              role="row"
              className={cn(GRID, 'border-b border-border bg-muted/40')}
            >
              {(
                [
                  'company',
                  'city',
                  'liveListings',
                  'applications',
                  'respondsToApplicants',
                  'verification',
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
                  {t(`companies.columns.${col}`)}
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
                        <p className="flex min-w-0 items-center gap-1 truncate text-[13px] font-bold text-foreground">
                          <span className="truncate">
                            {t(`companies.names.${row.companyKey}`)}
                          </span>
                          {row.showVerifiedBadge ? (
                            <BadgeCheck
                              className="size-3.5 shrink-0 text-primary"
                              aria-label={t('companies.verifiedBadge')}
                            />
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(`companies.industries.${row.industryKey}`)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] text-muted-foreground"
                  >
                    {t(`companies.cities.${row.cityId}`)}
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] font-bold tabular-nums text-foreground"
                  >
                    {row.liveListings}
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-[13px] tabular-nums text-muted-foreground"
                  >
                    {row.applicationsDisplay}
                  </div>

                  <div role="cell" className="px-3 py-2.5">
                    <ResponseRateBar percent={row.responseRatePercent} />
                  </div>

                  <div role="cell" className="px-3 py-2.5">
                    <CompaniesStatusBadge
                      verificationStatusId={row.verificationStatusId}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    >
                      {t(
                        `companies.verification.${row.verificationStatusId}`,
                      )}
                    </CompaniesStatusBadge>
                  </div>

                  <div role="cell" className="px-3 py-2.5 pe-4 text-end">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-[13px] font-bold text-primary"
                      onClick={() => onView(row.id)}
                    >
                      {t('companies.actions.view')}
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
