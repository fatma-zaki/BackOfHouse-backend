import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { ApplicationsDetailDialog } from '@/features/applications/components/applications-detail-dialog'
import { ApplicationsHeader } from '@/features/applications/components/applications-header'
import { ApplicationsInfoBanner } from '@/features/applications/components/applications-info-banner'
import { ApplicationsKpiGrid } from '@/features/applications/components/applications-kpi-grid'
import { ApplicationsTable } from '@/features/applications/components/applications-table'
import { ApplicationsToolbar } from '@/features/applications/components/applications-toolbar'
import { useApplicationsDashboard } from '@/features/applications/hooks/use-applications-dashboard'
import {
  filterApplications,
  paginateRows,
  uniqueOptionValues,
} from '@/features/applications/lib/filter-applications'
import { APPLICATIONS_DEFAULT_RANGE } from '@/features/applications/constants'
import type {
  ApplicationRow,
  ApplicationsDateRange,
  ApplicationsTabId,
} from '@/features/applications/types/applications.types'

const PAGE_SIZE = 7

export function ApplicationsDashboard() {
  const { t } = useTranslation()

  const [range, setRange] = useState<ApplicationsDateRange>(() => ({
    from: APPLICATIONS_DEFAULT_RANGE.from,
    to: APPLICATIONS_DEFAULT_RANGE.to,
  }))
  const [tab, setTab] = useState<ApplicationsTabId>('all')
  const [listingTypeId, setListingTypeId] = useState('all')
  const [companyKey, setCompanyKey] = useState('all')
  const [cityId, setCityId] = useState('all')
  const [page, setPage] = useState(1)
  const [viewId, setViewId] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useApplicationsDashboard({
    range,
  })

  const rows = data?.applications ?? []

  const filteredRows = useMemo(
    () =>
      filterApplications(rows, {
        tab,
        listingTypeId,
        companyKey,
        cityId,
      }),
    [rows, tab, listingTypeId, companyKey, cityId],
  )

  const pageRows = useMemo(
    () => paginateRows(filteredRows, page, PAGE_SIZE),
    [filteredRows, page],
  )

  const viewing: ApplicationRow | null =
    rows.find((row) => row.id === viewId) ?? null

  const listingTypeOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.listingTypeId)
    return [
      { value: 'all', label: t('applications.filters.listingType') },
      ...values.map((value) => ({
        value,
        label: t(`applications.listingTypes.${value}`),
      })),
    ]
  }, [rows, t])

  const companyOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.companyKey)
    return [
      { value: 'all', label: t('applications.filters.company') },
      ...values.map((value) => ({
        value,
        label: t(`applications.companies.${value}`),
      })),
    ]
  }, [rows, t])

  const cityOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.cityId)
    return [
      { value: 'all', label: t('applications.filters.city') },
      ...values.map((value) => ({
        value,
        label: t(`applications.cities.${value}`),
      })),
    ]
  }, [rows, t])

  return (
    <div className="flex flex-col gap-4">
      <ApplicationsHeader
        range={range}
        onRangeChange={(next) => {
          setRange(next)
          setPage(1)
        }}
      />

      {!isPending && isError ? (
        <ErrorState
          title={t('applications.states.errorTitle')}
          description={t('applications.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <ApplicationsKpiGrid
            kpis={data?.kpis ?? []}
            isLoading={isPending}
          />

          <ApplicationsToolbar
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setPage(1)
            }}
            listingTypeId={listingTypeId}
            onListingTypeChange={(next) => {
              setListingTypeId(next)
              setPage(1)
            }}
            listingTypeOptions={listingTypeOptions}
            companyKey={companyKey}
            onCompanyChange={(next) => {
              setCompanyKey(next)
              setPage(1)
            }}
            companyOptions={companyOptions}
            cityId={cityId}
            onCityChange={(next) => {
              setCityId(next)
              setPage(1)
            }}
            cityOptions={cityOptions}
          />

          <ApplicationsInfoBanner />

          <ApplicationsTable
            rows={pageRows}
            isLoading={isPending}
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={filteredRows.length}
            onPageChange={setPage}
            onView={setViewId}
          />
        </>
      )}

      <ApplicationsDetailDialog
        open={viewId !== null}
        application={viewing}
        onOpenChange={(open) => {
          if (!open) setViewId(null)
        }}
      />
    </div>
  )
}
