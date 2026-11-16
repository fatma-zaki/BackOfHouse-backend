import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/shared/error-state'
import { ClaimsImportsClaimDetailDialog } from '@/features/claims-imports/components/claims-imports-claim-detail-dialog'
import { ClaimsImportsHeader } from '@/features/claims-imports/components/claims-imports-header'
import { ClaimsImportsImportDataCard } from '@/features/claims-imports/components/claims-imports-import-data-card'
import { ClaimsImportsPageClaimsCard } from '@/features/claims-imports/components/claims-imports-page-claims-card'
import { ClaimsImportsRecentImportsCard } from '@/features/claims-imports/components/claims-imports-recent-imports-card'
import { useClaimsImportsDashboard } from '@/features/claims-imports/hooks/use-claims-imports-dashboard'
import {
  countClaimsByTab,
  filterClaimsByTab,
} from '@/features/claims-imports/lib/filter-claims'
import type {
  ClaimRow,
  ClaimsTabId,
} from '@/features/claims-imports/types/claims-imports.types'

export function ClaimsImportsDashboard() {
  const { t } = useTranslation()

  const [tab, setTab] = useState<ClaimsTabId>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useClaimsImportsDashboard()

  const claims = data?.claims ?? []
  const recentImports = data?.recentImports ?? []

  const tabCounts = useMemo(() => countClaimsByTab(claims), [claims])

  const filteredClaims = useMemo(
    () => filterClaimsByTab(claims, tab),
    [claims, tab],
  )

  const effectiveSelectedId =
    filteredClaims.find((row) => row.id === selectedId)?.id ??
    filteredClaims[0]?.id ??
    null

  const viewing: ClaimRow | null =
    claims.find((row) => row.id === viewId) ?? null

  return (
    <div className="flex flex-col gap-4">
      <ClaimsImportsHeader />

      {!isPending && isError ? (
        <ErrorState
          title={t('claimsImports.states.errorTitle')}
          description={t('claimsImports.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,22.5rem)]">
          <ClaimsImportsPageClaimsCard
            tab={tab}
            onTabChange={(next) => {
              setTab(next)
              setSelectedId(null)
            }}
            tabCounts={tabCounts}
            rows={filteredClaims}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedId}
            isLoading={isPending}
            onReview={setViewId}
          />

          <aside className="flex min-w-0 flex-col gap-4">
            <ClaimsImportsImportDataCard />
            <ClaimsImportsRecentImportsCard
              rows={recentImports}
              isLoading={isPending}
            />
          </aside>
        </div>
      )}

      <ClaimsImportsClaimDetailDialog
        open={viewId !== null}
        claim={viewing}
        onOpenChange={(open) => {
          if (!open) setViewId(null)
        }}
      />
    </div>
  )
}
