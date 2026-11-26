import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared/error-state'
import { ModerationDetail } from '@/features/moderation/components/moderation-detail'
import { ModerationHeader } from '@/features/moderation/components/moderation-header'
import { ModerationTable } from '@/features/moderation/components/moderation-table'
import { ModerationToolbar } from '@/features/moderation/components/moderation-toolbar'
import { useModerationDashboard } from '@/features/moderation/hooks/use-moderation-dashboard'
import {
  countModerationByTab,
  filterModerationReports,
  moderationTabForStatus,
  uniqueContentTypes,
} from '@/features/moderation/lib/filter-moderation'
import type {
  ModerationReport,
  ModerationStatusId,
  ModerationTabId,
} from '@/features/moderation/types/moderation.types'

type ModerationAction = 'dismiss' | 'warn' | 'remove' | 'suspend'

const ACTION_STATUS: Record<ModerationAction, ModerationStatusId> = {
  dismiss: 'resolvedDismissed',
  warn: 'resolvedWarned',
  remove: 'resolvedRemoved',
  suspend: 'resolvedSuspended',
}

export function ModerationDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useModerationDashboard()

  const [rowsOverride, setRowsOverride] = useState<ModerationReport[] | null>(
    null,
  )
  const [tab, setTab] = useState<ModerationTabId>('open')
  const [contentTypeId, setContentTypeId] = useState('all')
  const [reasonKey, setReasonKey] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = rowsOverride ?? data?.reports ?? []

  const tabCounts = useMemo(() => countModerationByTab(rows), [rows])

  const visibleRows = useMemo(
    () =>
      filterModerationReports(rows, {
        tab,
        contentTypeId,
        reasonKey,
      }),
    [rows, tab, contentTypeId, reasonKey],
  )

  const selected =
    visibleRows.find((row) => row.id === selectedId) ??
    visibleRows[0] ??
    null

  const effectiveSelectedId = selected?.id ?? null

  const contentTypeOptions = useMemo(() => {
    const values = uniqueContentTypes(rows)
    return [
      { value: 'all', label: t('moderation.filters.allContentTypes') },
      ...values.map((value) => ({
        value,
        label: t(`moderation.contentTypes.${value}`),
      })),
    ]
  }, [rows, t])

  const reasonOptions = useMemo(() => {
    const keys = data?.reasonFilterKeys ?? []
    return [
      { value: 'all', label: t('moderation.filters.allReasons') },
      ...keys.map((key) => ({
        value: key,
        label: t(`moderation.reasons.${key}`),
      })),
    ]
  }, [data?.reasonFilterKeys, t])

  const patchStatus = (id: string, statusId: ModerationStatusId) => {
    setRowsOverride((prev) => {
      const base = prev ?? data?.reports ?? []
      return base.map((row) =>
        row.id === id ? { ...row, statusId } : row,
      )
    })
  }

  const applyAction = (action: ModerationAction) => {
    if (!selected) return
    const statusId = ACTION_STATUS[action]
    patchStatus(selected.id, statusId)
    toast.success(t(`moderation.toasts.${action}`))
    setTab(moderationTabForStatus(statusId))
    setSelectedId(selected.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <ModerationHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('moderation.states.errorTitle')}
          description={t('moderation.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <ModerationToolbar
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setSelectedId(null)
            }}
            tabCounts={tabCounts}
            contentTypeId={contentTypeId}
            onContentTypeChange={setContentTypeId}
            contentTypeOptions={contentTypeOptions}
            reasonKey={reasonKey}
            onReasonChange={setReasonKey}
            reasonOptions={reasonOptions}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,1fr)]">
            <ModerationTable
              rows={visibleRows}
              selectedId={effectiveSelectedId}
              isLoading={isPending}
              onSelect={setSelectedId}
            />
            <ModerationDetail
              report={selected}
              isLoading={isPending}
              onDismiss={() => applyAction('dismiss')}
              onWarn={() => applyAction('warn')}
              onRemove={() => applyAction('remove')}
              onSuspend={() => applyAction('suspend')}
            />
          </div>
        </>
      )}
    </div>
  )
}
