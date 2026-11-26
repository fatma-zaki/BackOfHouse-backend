import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { UsersHeader } from '@/features/users/components/users-header'
import { UsersSelectionBar } from '@/features/users/components/users-selection-bar'
import { UsersTable } from '@/features/users/components/users-table'
import { UsersToolbar } from '@/features/users/components/users-toolbar'
import { useUsersDashboard } from '@/features/users/hooks/use-users-dashboard'
import {
  filterUsers,
  paginateRows,
  uniqueOptionValues,
} from '@/features/users/lib/filter-users'
import type {
  UserJoinedFilter,
  UsersTabId,
  UserStudentsFilter,
  UserVerificationFilter,
} from '@/features/users/types/users.types'

const PAGE_SIZE = 8

export function UsersDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useUsersDashboard()

  const [tab, setTab] = useState<UsersTabId>('all')
  const [cityId, setCityId] = useState('all')
  const [verified, setVerified] = useState<UserVerificationFilter>('all')
  const [students, setStudents] = useState<UserStudentsFilter>('all')
  const [joined, setJoined] = useState<UserJoinedFilter>('all')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const clearSelection = () => setSelectedIds(new Set())

  const rows = data?.users ?? []

  const filteredRows = useMemo(
    () =>
      filterUsers(rows, {
        tab,
        cityId,
        verified,
        students,
        joined,
      }),
    [rows, tab, cityId, verified, students, joined],
  )

  const pageRows = useMemo(
    () => paginateRows(filteredRows, page, PAGE_SIZE),
    [filteredRows, page],
  )

  // Paginate over loaded mock rows. Tab counts remain demo totals in the toolbar.
  const totalItems = filteredRows.length

  const cityOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.cityId)
    return [
      { value: 'all', label: t('users.filters.allCities') },
      ...values.map((value) => ({
        value,
        label: t(`users.cities.${value}`),
      })),
    ]
  }, [rows, t])

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleAll = (checked: boolean, visibleIds: readonly string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of visibleIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const selectionCount = selectedIds.size

  return (
    <div className="flex flex-col gap-4">
      <UsersHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('users.states.errorTitle')}
          description={t('users.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <UsersToolbar
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setPage(1)
              clearSelection()
            }}
            tabCounts={
              data?.tabCounts ?? {
                all: 0,
                individuals: 0,
                companies: 0,
                suspended: 0,
              }
            }
            cityId={cityId}
            onCityChange={(next) => {
              setCityId(next)
              setPage(1)
              clearSelection()
            }}
            cityOptions={cityOptions}
            verified={verified}
            onVerifiedChange={(next) => {
              setVerified(next)
              setPage(1)
              clearSelection()
            }}
            students={students}
            onStudentsChange={(next) => {
              setStudents(next)
              setPage(1)
              clearSelection()
            }}
            joined={joined}
            onJoinedChange={(next) => {
              setJoined(next)
              setPage(1)
              clearSelection()
            }}
          />

          <UsersTable
            rows={pageRows}
            isLoading={isPending}
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalItems}
            onPageChange={setPage}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            selectionBar={
              selectionCount > 0 ? (
                <UsersSelectionBar
                  count={selectionCount}
                  onClear={clearSelection}
                />
              ) : undefined
            }
          />
        </>
      )}
    </div>
  )
}
