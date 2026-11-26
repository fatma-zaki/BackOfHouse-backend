import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { CompaniesDetailDialog } from '@/features/companies/components/companies-detail-dialog'
import { CompaniesHeader } from '@/features/companies/components/companies-header'
import { CompaniesKpiGrid } from '@/features/companies/components/companies-kpi-grid'
import { CompaniesTable } from '@/features/companies/components/companies-table'
import { CompaniesToolbar } from '@/features/companies/components/companies-toolbar'
import { useCompaniesDashboard } from '@/features/companies/hooks/use-companies-dashboard'
import {
  filterAndSortCompanies,
  paginateRows,
  uniqueOptionValues,
} from '@/features/companies/lib/filter-companies'
import type {
  CompaniesSortId,
  CompaniesTabId,
  CompanyRow,
} from '@/features/companies/types/companies.types'

const PAGE_SIZE = 7

export function CompaniesDashboard() {
  const { t } = useTranslation()

  const [tab, setTab] = useState<CompaniesTabId>('all')
  const [cityId, setCityId] = useState('all')
  const [industryKey, setIndustryKey] = useState('all')
  const [sort, setSort] = useState<CompaniesSortId>('mostActive')
  const [page, setPage] = useState(1)
  const [viewId, setViewId] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useCompaniesDashboard()

  const rows = data?.companies ?? []

  const pendingVerificationCount = useMemo(
    () => rows.filter((row) => row.verificationStatusId === 'pending').length,
    [rows],
  )

  const filteredRows = useMemo(
    () =>
      filterAndSortCompanies(rows, {
        tab,
        cityId,
        industryKey,
        sort,
        nameForSort: (row) => t(`companies.names.${row.companyKey}`),
      }),
    [rows, tab, cityId, industryKey, sort, t],
  )

  const pageRows = useMemo(
    () => paginateRows(filteredRows, page, PAGE_SIZE),
    [filteredRows, page],
  )

  // Paginate over loaded mock rows. KPI cards keep catalog totals (e.g. 1,146).
  const paginationTotalItems = filteredRows.length

  const viewing: CompanyRow | null =
    rows.find((row) => row.id === viewId) ?? null

  const cityOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.cityId)
    return [
      { value: 'all', label: t('companies.filters.city') },
      ...values.map((value) => ({
        value,
        label: t(`companies.cities.${value}`),
      })),
    ]
  }, [rows, t])

  const industryOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.industryKey)
    return [
      { value: 'all', label: t('companies.filters.industry') },
      ...values.map((value) => ({
        value,
        label: t(`companies.industries.${value}`),
      })),
    ]
  }, [rows, t])

  const sortOptions = useMemo(
    () =>
      (
        [
          'mostActive',
          'leastActive',
          'name',
        ] as const satisfies readonly CompaniesSortId[]
      ).map((value) => ({
        value,
        label: t(`companies.sorts.${value}`),
      })),
    [t],
  )

  return (
    <div className="flex flex-col gap-4">
      <CompaniesHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('companies.states.errorTitle')}
          description={t('companies.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <CompaniesKpiGrid kpis={data?.kpis ?? []} isLoading={isPending} />

          <CompaniesToolbar
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setPage(1)
            }}
            pendingVerificationCount={pendingVerificationCount}
            cityId={cityId}
            onCityChange={(next) => {
              setCityId(next)
              setPage(1)
            }}
            cityOptions={cityOptions}
            industryKey={industryKey}
            onIndustryChange={(next) => {
              setIndustryKey(next)
              setPage(1)
            }}
            industryOptions={industryOptions}
            sort={sort}
            onSortChange={(next) => {
              setSort(next)
              setPage(1)
            }}
            sortOptions={sortOptions}
          />

          <CompaniesTable
            rows={pageRows}
            isLoading={isPending}
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={paginationTotalItems}
            onPageChange={setPage}
            onView={setViewId}
          />
        </>
      )}

      <CompaniesDetailDialog
        open={viewId !== null}
        company={viewing}
        onOpenChange={(open) => {
          if (!open) setViewId(null)
        }}
      />
    </div>
  )
}
