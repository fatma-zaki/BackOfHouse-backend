import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { SupplierRequestsDetail } from '@/features/supplier-requests/components/supplier-requests-detail'
import { SupplierRequestsHeader } from '@/features/supplier-requests/components/supplier-requests-header'
import { SupplierRequestsKpiGrid } from '@/features/supplier-requests/components/supplier-requests-kpi-grid'
import { SupplierRequestsTable } from '@/features/supplier-requests/components/supplier-requests-table'
import { useSupplierRequestsDashboard } from '@/features/supplier-requests/hooks/use-supplier-requests-dashboard'
import {
  countByTab,
  filterSupplierRequests,
  uniqueOptionValues,
} from '@/features/supplier-requests/lib/filter-supplier-requests'
import { SUPPLIER_REQUESTS_DEFAULT_RANGE } from '@/features/supplier-requests/constants'
import type {
  SupplierRequestsDateRange,
  SupplierRequestsTabId,
} from '@/features/supplier-requests/types/supplier-requests.types'

export function SupplierRequestsDashboard() {
  const { t } = useTranslation()

  const [range, setRange] = useState<SupplierRequestsDateRange>(() => ({
    from: SUPPLIER_REQUESTS_DEFAULT_RANGE.from,
    to: SUPPLIER_REQUESTS_DEFAULT_RANGE.to,
  }))
  const [tab, setTab] = useState<SupplierRequestsTabId>('open')
  const [categoryId, setCategoryId] = useState('all')
  const [cityId, setCityId] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useSupplierRequestsDashboard({
    range,
  })

  const rows = data?.requests ?? []

  const tabCounts = useMemo(() => countByTab(rows), [rows])

  const visibleRows = useMemo(
    () =>
      filterSupplierRequests(rows, {
        tab,
        categoryId,
        cityId,
      }),
    [rows, tab, categoryId, cityId],
  )

  const selected =
    visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0] ?? null

  const effectiveSelectedId = selected?.id ?? null

  const categoryOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.categoryId)
    return [
      { value: 'all', label: t('supplierRequests.filters.allCategories') },
      ...values.map((value) => ({
        value,
        label: t(`supplierRequests.categories.${value}`),
      })),
    ]
  }, [rows, t])

  const cityOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.cityId)
    return [
      { value: 'all', label: t('supplierRequests.filters.allCities') },
      ...values.map((value) => ({
        value,
        label: t(`supplierRequests.cities.${value}`),
      })),
    ]
  }, [rows, t])

  return (
    <div className="flex flex-col gap-5">
      <SupplierRequestsHeader range={range} onRangeChange={setRange} />

      {!isPending && isError ? (
        <ErrorState
          title={t('supplierRequests.states.errorTitle')}
          description={t('supplierRequests.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <SupplierRequestsKpiGrid
            kpis={data?.kpis ?? []}
            isLoading={isPending}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,1fr)]">
            <SupplierRequestsTable
              rows={visibleRows}
              selectedId={effectiveSelectedId}
              isLoading={isPending}
              onSelect={(id) => setSelectedId(id)}
              tab={tab}
              onTabChange={(next) => {
                setTab(next)
                setSelectedId(null)
              }}
              tabCounts={tabCounts}
              categoryId={categoryId}
              onCategoryChange={setCategoryId}
              categoryOptions={categoryOptions}
              cityId={cityId}
              onCityChange={setCityId}
              cityOptions={cityOptions}
            />
            <SupplierRequestsDetail
              request={selected}
              isLoading={isPending}
            />
          </div>
        </>
      )}
    </div>
  )
}
