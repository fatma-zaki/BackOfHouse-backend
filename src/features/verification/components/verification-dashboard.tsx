import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ErrorState } from '@/components/shared/error-state'
import { VerificationDetail } from '@/features/verification/components/verification-detail'
import { VerificationHeader } from '@/features/verification/components/verification-header'
import { VerificationInfoBanner } from '@/features/verification/components/verification-info-banner'
import { VerificationMasterList } from '@/features/verification/components/verification-master-list'
import { useVerificationReview } from '@/features/verification/hooks/use-verification-review'
import {
  countVerificationByTab,
  filterVerificationRequests,
} from '@/features/verification/lib/filter-verification'
import type {
  VerificationQueueStatusId,
  VerificationRequest,
  VerificationSlaTone,
  VerificationTabId,
} from '@/features/verification/types/verification.types'

type PendingAction = 'reject' | 'moreInfo' | 'approve'

export function VerificationDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useVerificationReview()

  const [rowsOverride, setRowsOverride] = useState<
    VerificationRequest[] | null
  >(null)
  const [tab, setTab] = useState<VerificationTabId>('waiting')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  )

  const rows = rowsOverride ?? data?.requests ?? []

  const tabCounts = useMemo(() => countVerificationByTab(rows), [rows])

  const visibleRows = useMemo(
    () => filterVerificationRequests(rows, tab),
    [rows, tab],
  )

  const selected =
    visibleRows.find((row) => row.id === selectedId) ??
    visibleRows[0] ??
    null

  const effectiveSelectedId = selected?.id ?? null

  const patchStatus = (
    id: string,
    queueStatusId: VerificationQueueStatusId,
    slaLabelKey: string,
    slaTone: VerificationSlaTone,
  ) => {
    setRowsOverride((prev) => {
      const base = prev ?? data?.requests ?? []
      return base.map((row) =>
        row.id === id
          ? { ...row, queueStatusId, slaLabelKey, slaTone }
          : row,
      )
    })
  }

  const openConfirm = (action: PendingAction) => {
    if (!selected) return
    setPendingAction(action)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (!selected || !pendingAction) return

    switch (pendingAction) {
      case 'reject':
        patchStatus(selected.id, 'rejected', 'decidedRejected', 'muted')
        toast.message(t('verification.toasts.rejected'))
        setTab('decided')
        setSelectedId(selected.id)
        break
      case 'moreInfo':
        patchStatus(selected.id, 'moreInfo', 'waitingOnApplicant', 'muted')
        toast.success(t('verification.toasts.moreInfoRequested'))
        setTab('moreInfo')
        setSelectedId(selected.id)
        break
      case 'approve':
        patchStatus(selected.id, 'approved', 'decidedApproved', 'muted')
        toast.success(t('verification.toasts.approved'))
        setTab('decided')
        setSelectedId(selected.id)
        break
    }

    setConfirmOpen(false)
    setPendingAction(null)
  }

  const confirmCopy = (() => {
    if (!selected || !pendingAction) {
      return { title: '', description: '' }
    }
    const name = t(`verification.names.${selected.nameKey}`)
    switch (pendingAction) {
      case 'reject':
        return {
          title: t('verification.dialogs.reject.title', { name }),
          description: t('verification.dialogs.reject.description'),
        }
      case 'moreInfo':
        return {
          title: t('verification.dialogs.moreInfo.title', { name }),
          description: t('verification.dialogs.moreInfo.description'),
        }
      case 'approve':
        return {
          title: t('verification.dialogs.approve.title', { name }),
          description: t('verification.dialogs.approve.description'),
        }
    }
  })()

  return (
    <div className="flex flex-col gap-4">
      <VerificationHeader />
      <VerificationInfoBanner />

      {!isPending && isError ? (
        <ErrorState
          title={t('verification.states.errorTitle')}
          description={t('verification.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <VerificationMasterList
            rows={visibleRows}
            selectedId={effectiveSelectedId}
            isLoading={isPending}
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setSelectedId(null)
            }}
            tabCounts={tabCounts}
            onSelect={(id) => setSelectedId(id)}
          />
          <VerificationDetail
            request={selected}
            isLoading={isPending}
            onReject={() => openConfirm('reject')}
            onAskMoreInfo={() => openConfirm('moreInfo')}
            onApprove={() => openConfirm('approve')}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setPendingAction(null)
        }}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={
          pendingAction === 'reject'
            ? t('verification.actions.reject')
            : pendingAction === 'moreInfo'
              ? t('verification.actions.askMoreInfo')
              : t('verification.actions.approve')
        }
        destructive={pendingAction === 'reject'}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
