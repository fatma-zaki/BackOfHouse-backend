import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { AuditHeader } from '@/features/audit/components/audit-header'
import { AuditTable } from '@/features/audit/components/audit-table'
import { AuditToolbar } from '@/features/audit/components/audit-toolbar'
import { useAuditDashboard } from '@/features/audit/hooks/use-audit-dashboard'
import {
  filterAuditLog,
  paginateRows,
  uniqueOptionValues,
} from '@/features/audit/lib/filter-audit-log'
import { AUDIT_DEFAULT_RANGE } from '@/features/audit/constants'
import type {
  AuditDateRange,
  AuditTabId,
} from '@/features/audit/types/audit.types'

const PAGE_SIZE = 8

export function AuditDashboard() {
  const { t } = useTranslation()

  const [range, setRange] = useState<AuditDateRange>(() => ({
    from: AUDIT_DEFAULT_RANGE.from,
    to: AUDIT_DEFAULT_RANGE.to,
  }))
  const [tab, setTab] = useState<AuditTabId>('all')
  const [adminKey, setAdminKey] = useState('all')
  const [actionId, setActionId] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isPending, isError, refetch } = useAuditDashboard({ range })

  const rows = data?.entries ?? []

  const filteredRows = useMemo(
    () =>
      filterAuditLog(rows, {
        tab,
        adminKey,
        actionId,
      }),
    [rows, tab, adminKey, actionId],
  )

  const pageRows = useMemo(
    () => paginateRows(filteredRows, page, PAGE_SIZE),
    [filteredRows, page],
  )

  const adminOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.adminKey)
    return [
      { value: 'all', label: t('audit.filters.admin') },
      ...values.map((value) => ({
        value,
        label: t(`audit.admins.${value}`),
      })),
    ]
  }, [rows, t])

  const actionOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.actionId)
    return [
      { value: 'all', label: t('audit.filters.action') },
      ...values.map((value) => ({
        value,
        label: t(`audit.actions.${value}`),
      })),
    ]
  }, [rows, t])

  return (
    <div className="flex flex-col gap-4">
      <AuditHeader
        range={range}
        onRangeChange={(next) => {
          setRange(next)
          setPage(1)
        }}
      />

      {!isPending && isError ? (
        <ErrorState
          title={t('audit.states.errorTitle')}
          description={t('audit.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <AuditToolbar
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setPage(1)
            }}
            adminKey={adminKey}
            onAdminChange={(next) => {
              setAdminKey(next)
              setPage(1)
            }}
            adminOptions={adminOptions}
            actionId={actionId}
            onActionChange={(next) => {
              setActionId(next)
              setPage(1)
            }}
            actionOptions={actionOptions}
          />

          <AuditTable
            rows={pageRows}
            isLoading={isPending}
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={filteredRows.length}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
