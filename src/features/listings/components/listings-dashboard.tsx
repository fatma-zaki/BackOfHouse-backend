import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ErrorState } from '@/components/shared/error-state'
import { ListingsApprovedDialog } from '@/features/listings/components/listings-approved-dialog'
import { ListingsDetail } from '@/features/listings/components/listings-detail'
import { ListingsHeader } from '@/features/listings/components/listings-header'
import { ListingsRequestChangesDialog } from '@/features/listings/components/listings-request-changes-dialog'
import { ListingsTable } from '@/features/listings/components/listings-table'
import { ListingsToolbar } from '@/features/listings/components/listings-toolbar'
import { useListingsReview } from '@/features/listings/hooks/use-listings-review'
import {
  countListingsByTab,
  filterAndSortListings,
  isOpenListing,
  uniqueOptionValues,
} from '@/features/listings/lib/filter-listings'
import type {
  ListingStatusId,
  ListingSubmission,
  ListingsSortId,
  ListingsTabId,
} from '@/features/listings/types/listings.types'

export function ListingsDashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useListingsReview()

  const [rowsOverride, setRowsOverride] = useState<ListingSubmission[] | null>(
    null,
  )
  const [tab, setTab] = useState<ListingsTabId>('pending')
  const [typeId, setTypeId] = useState('all')
  const [cityId, setCityId] = useState('all')
  const [companyKey, setCompanyKey] = useState('all')
  const [sort, setSort] = useState<ListingsSortId>('oldest')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)
  const [approvedOpen, setApprovedOpen] = useState(false)
  const [decidedId, setDecidedId] = useState<string | null>(null)
  const [changeMessage, setChangeMessage] = useState('')
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(
    () => new Set(),
  )

  const rows = rowsOverride ?? data?.submissions ?? []

  const tabCounts = useMemo(() => countListingsByTab(rows), [rows])

  const visibleRows = useMemo(
    () =>
      filterAndSortListings(rows, {
        tab,
        typeId,
        cityId,
        companyKey,
        sort,
      }),
    [rows, tab, typeId, cityId, companyKey, sort],
  )

  const selected =
    visibleRows.find((row) => row.id === selectedId) ??
    visibleRows[0] ??
    null

  const effectiveSelectedId = selected?.id ?? null

  const typeOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.typeId)
    return [
      { value: 'all', label: t('listings.filters.allTypes') },
      ...values.map((value) => ({
        value,
        label: t(`listings.types.${value}`),
      })),
    ]
  }, [rows, t])

  const cityOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.cityId)
    return [
      { value: 'all', label: t('listings.filters.allCities') },
      ...values.map((value) => ({
        value,
        label: t(`listings.cities.${value}`),
      })),
    ]
  }, [rows, t])

  const companyOptions = useMemo(() => {
    const values = uniqueOptionValues(rows, (row) => row.companyKey)
    return [
      { value: 'all', label: t('listings.filters.company') },
      ...values.map((value) => ({
        value,
        label: t(`listings.companies.${value}`),
      })),
    ]
  }, [rows, t])

  const setStatus = (id: string, statusId: ListingStatusId, statusTone: ListingSubmission['statusTone']) => {
    setRowsOverride((prev) => {
      const base = prev ?? data?.submissions ?? []
      return base.map((row) =>
        row.id === id
          ? {
              ...row,
              statusId,
              statusTone,
              slaLabelKey: 'done',
              slaTone: 'muted',
            }
          : row,
      )
    })
  }

  const decided =
    rows.find((row) => row.id === decidedId) ?? selected
  const nextOpen =
    rows.find(
      (row) => isOpenListing(row.statusId) && row.id !== decided?.id,
    ) ?? null

  const handleApprove = () => {
    if (!selected) return
    setStatus(selected.id, 'live', 'success')
    setDecidedId(selected.id)
    setApprovedOpen(true)
    setNote('')
  }

  const handleRejectConfirm = () => {
    if (!selected) return
    setStatus(selected.id, 'rejected', 'danger')
    setNote('')
    setRejectOpen(false)
    toast.message(t('listings.toasts.rejected'))
  }

  const openReject = () => {
    if (!selected) return
    if (!note.trim()) {
      toast.warning(t('listings.toasts.noteRequired'))
      return
    }
    setRejectOpen(true)
  }

  const openRequestChanges = () => {
    if (!selected || !data) return
    setChangeMessage(t(`listings.${data.defaultChangeMessageKey}`))
    setSelectedReasons(new Set())
    setChangesOpen(true)
  }

  const confirmRequestChanges = () => {
    if (!selected) return
    if (selectedReasons.size === 0 && !changeMessage.trim()) {
      toast.warning(t('listings.toasts.changesRequired'))
      return
    }
    setStatus(selected.id, 'changesRequested', 'warning')
    setChangesOpen(false)
    setSelectedReasons(new Set())
    setChangeMessage('')
    setNote('')
    toast.success(t('listings.toasts.changesRequested'))
  }

  return (
    <div className="flex flex-col gap-4">
      <ListingsHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('listings.states.errorTitle')}
          description={t('listings.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <>
          <ListingsToolbar
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setSelectedId(null)
            }}
            tabCounts={tabCounts}
            typeId={typeId}
            onTypeChange={setTypeId}
            typeOptions={typeOptions}
            cityId={cityId}
            onCityChange={setCityId}
            cityOptions={cityOptions}
            companyKey={companyKey}
            onCompanyChange={setCompanyKey}
            companyOptions={companyOptions}
            sort={sort}
            onSortChange={setSort}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,1fr)]">
            <ListingsTable
              rows={visibleRows}
              selectedId={effectiveSelectedId}
              isLoading={isPending}
              onSelect={(id) => {
                setSelectedId(id)
                setNote('')
              }}
            />
            <ListingsDetail
              listing={selected}
              isLoading={isPending}
              note={note}
              onNoteChange={setNote}
              onReject={openReject}
              onRequestChanges={openRequestChanges}
              onApprove={handleApprove}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t('listings.dialogs.reject.title', {
          title: selected ? t(`listings.items.${selected.titleKey}`) : '',
        })}
        description={t('listings.dialogs.reject.description')}
        confirmLabel={t('listings.actions.reject')}
        destructive
        onConfirm={handleRejectConfirm}
      />

      <ListingsRequestChangesDialog
        open={changesOpen}
        listing={selected}
        message={changeMessage}
        onMessageChange={setChangeMessage}
        reasons={data?.changeReasons ?? []}
        selectedReasons={selectedReasons}
        onToggleReason={(reason) => {
          setSelectedReasons((prev) => {
            const next = new Set(prev)
            if (next.has(reason)) next.delete(reason)
            else next.add(reason)
            return next
          })
        }}
        onOpenChange={setChangesOpen}
        onConfirm={confirmRequestChanges}
      />

      <ListingsApprovedDialog
        open={approvedOpen}
        listing={decided}
        nextListing={nextOpen}
        onOpenChange={setApprovedOpen}
        onReviewNext={() => {
          if (!nextOpen) return
          setSelectedId(nextOpen.id)
          setApprovedOpen(false)
          setTab('pending')
        }}
      />
    </div>
  )
}
