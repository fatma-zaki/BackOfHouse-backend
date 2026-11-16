import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ListingsToneBadge } from '@/features/listings/components/listings-tone-badge'
import { cn } from '@/lib/utils'
import type { ListingSubmission } from '@/features/listings/types/listings.types'

const GRID =
  'grid min-w-[600px] grid-cols-[minmax(0,1.7fr)_minmax(5.5rem,1.1fr)_minmax(4.5rem,0.8fr)_minmax(5.5rem,0.9fr)_minmax(5.5rem,1fr)] items-center'

type ListingsTableProps = {
  rows: readonly ListingSubmission[]
  selectedId: string | null
  isLoading?: boolean
  onSelect: (id: string) => void
}

export function ListingsTable({
  rows,
  selectedId,
  isLoading = false,
  onSelect,
}: ListingsTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="px-0 py-2">
            <TableSkeleton
              rows={7}
              columns={5}
              dense
              label={t('listings.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('listings.states.emptyList')}
          </p>
        ) : (
          <div className="overflow-x-auto" role="table" aria-label={t('listings.title')}>
            <div role="row" className={cn(GRID, 'border-b border-border bg-muted/40')}>
              {(
                [
                  'listing',
                  'type',
                  'submitted',
                  'sla',
                  'status',
                ] as const
              ).map((col) => (
                <div
                  key={col}
                  role="columnheader"
                  className="px-3 py-2.5 text-[11px] font-bold text-muted-foreground first:ps-4 last:pe-4"
                >
                  {t(`listings.columns.${col}`)}
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
                      active && 'border-s-primary bg-primary/8 hover:bg-primary/8',
                    )}
                  >
                    <div role="cell" className="min-w-0 px-3 py-2.5 ps-4">
                      <p className="truncate text-[13px] font-bold text-foreground">
                        {t(`listings.items.${row.titleKey}`)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t(`listings.companies.${row.companyKey}`)}
                      </p>
                    </div>
                    <div role="cell" className="px-3 py-2.5">
                      <ListingsToneBadge tone={row.typeTone} tag>
                        {t(`listings.types.${row.typeId}`)}
                      </ListingsToneBadge>
                    </div>
                    <div
                      role="cell"
                      className="px-3 py-2.5 text-[13px] text-muted-foreground"
                    >
                      {t(`listings.submitted.${row.submittedKey}`)}
                    </div>
                    <div role="cell" className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[12px] font-bold',
                          row.slaTone === 'danger' && 'text-destructive',
                          row.slaTone === 'warning' && 'text-warning',
                          row.slaTone === 'success' && 'text-success',
                          row.slaTone === 'muted' && 'text-muted-foreground',
                        )}
                      >
                        {row.slaTone !== 'muted' ? (
                          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : null}
                        {t(`listings.sla.${row.slaLabelKey}`)}
                      </span>
                    </div>
                    <div role="cell" className="px-3 py-2.5 pe-4">
                      <ListingsToneBadge tone={row.statusTone}>
                        {t(`listings.statuses.${row.statusId}`)}
                      </ListingsToneBadge>
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
