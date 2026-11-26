import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { SupplierRequestsStatusBadge } from '@/features/supplier-requests/components/supplier-requests-status-badge'
import { SupplierRequestsToolbar } from '@/features/supplier-requests/components/supplier-requests-toolbar'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  SupplierRequestRow,
  SupplierRequestsTabId,
} from '@/features/supplier-requests/types/supplier-requests.types'

const GRID =
  'grid min-w-[520px] grid-cols-[minmax(0,1.8fr)_minmax(4.5rem,0.9fr)_minmax(5.5rem,1fr)_minmax(5.5rem,1fr)] items-center'

type SupplierRequestsTableProps = {
  rows: readonly SupplierRequestRow[]
  selectedId: string | null
  isLoading?: boolean
  onSelect: (id: string) => void
  tab: SupplierRequestsTabId
  onTabChange: (tab: SupplierRequestsTabId) => void
  tabCounts: Record<SupplierRequestsTabId, number>
  categoryId: string
  onCategoryChange: (value: string) => void
  categoryOptions: readonly { value: string; label: string }[]
  cityId: string
  onCityChange: (value: string) => void
  cityOptions: readonly { value: string; label: string }[]
}

function ResponsesCell({
  count,
  max,
}: {
  count: number
  max: number
}) {
  const ratio = max > 0 ? Math.min(count / max, 1) : 0

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className="h-2 min-w-[2.75rem] flex-1 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="shrink-0 text-[13px] font-bold tabular-nums text-foreground">
        {count}
      </span>
    </div>
  )
}

export function SupplierRequestsTable({
  rows,
  selectedId,
  isLoading = false,
  onSelect,
  tab,
  onTabChange,
  tabCounts,
  categoryId,
  onCategoryChange,
  categoryOptions,
  cityId,
  onCityChange,
  cityOptions,
}: SupplierRequestsTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl py-0 shadow-sm">
      <CardContent className="flex flex-col gap-3 px-4 pt-4 pb-0">
        <SupplierRequestsToolbar
          tab={tab}
          onTabChange={onTabChange}
          tabCounts={tabCounts}
          categoryId={categoryId}
          onCategoryChange={onCategoryChange}
          categoryOptions={categoryOptions}
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
              columns={4}
              dense
              label={t('supplierRequests.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {t('supplierRequests.states.emptyList')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('supplierRequests.table.label')}
          >
            <div role="row" className={cn(GRID, 'border-b border-border')}>
              {(['request', 'closes', 'responses', 'status'] as const).map(
                (col) => (
                  <div
                    key={col}
                    role="columnheader"
                    className="px-3 py-2.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase first:ps-4 last:pe-4"
                  >
                    {t(`supplierRequests.columns.${col}`)}
                  </div>
                ),
              )}
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
                        {t(`supplierRequests.items.${row.titleKey}`)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t(`supplierRequests.companies.${row.companyKey}`)}
                      </p>
                    </div>
                    <div
                      role="cell"
                      className="px-3 py-2.5 text-[13px] text-muted-foreground"
                    >
                      {t(`supplierRequests.dates.closes.${row.closesKey}`)}
                    </div>
                    <div role="cell" className="px-3 py-2.5 pe-2">
                      <ResponsesCell
                        count={row.responseCount}
                        max={row.responseBarMax}
                      />
                    </div>
                    <div role="cell" className="px-3 py-2.5 pe-4">
                      <SupplierRequestsStatusBadge statusId={row.statusId}>
                        {t(`supplierRequests.statuses.${row.statusId}`)}
                      </SupplierRequestsStatusBadge>
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
