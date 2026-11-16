import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Button } from '@/components/ui/button'
import { ClaimsImportsEvidenceBadge } from '@/features/claims-imports/components/claims-imports-evidence-badge'
import { cn } from '@/lib/utils'
import type {
  ClaimAvatarTone,
  ClaimRow,
} from '@/features/claims-imports/types/claims-imports.types'

const GRID =
  'grid min-w-[640px] grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(4.5rem,0.6fr)_minmax(4rem,0.5fr)] items-center'

const avatarToneClassNames: Record<ClaimAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type ClaimsImportsClaimsTableProps = {
  rows: readonly ClaimRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
  onReview: (id: string) => void
}

export function ClaimsImportsClaimsTable({
  rows,
  selectedId,
  onSelect,
  isLoading = false,
  onReview,
}: ClaimsImportsClaimsTableProps) {
  const { t } = useTranslation()

  return (
    <>
      {isLoading ? (
        <div className="px-0 py-2">
          <TableSkeleton
            rows={4}
            columns={5}
            dense
            label={t('claimsImports.states.loadingClaims')}
          />
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">
          {t('claimsImports.states.emptyClaims')}
        </p>
      ) : (
        <div
          className="overflow-x-auto"
          role="table"
          aria-label={t('claimsImports.pageClaims.title')}
        >
          <div
            role="row"
            className={cn(GRID, 'border-b border-border bg-muted/40')}
          >
            {(
              [
                'companyPage',
                'claimedBy',
                'evidence',
                'submitted',
                'actions',
              ] as const
            ).map((col) => (
              <div
                key={col}
                role="columnheader"
                className={cn(
                  'px-3 py-2.5 text-[11px] font-bold text-muted-foreground first:ps-4 last:pe-4',
                  col === 'actions' && 'sr-only',
                )}
              >
                {t(`claimsImports.columns.${col}`)}
              </div>
            ))}
          </div>

          <div role="rowgroup">
            {rows.map((row) => {
              const active = row.id === selectedId
              return (
                <div
                  key={row.id}
                  role="row"
                  tabIndex={0}
                  aria-selected={active}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(row.id)
                    }
                  }}
                  className={cn(
                    GRID,
                    'min-h-[64px] cursor-pointer border-b border-border text-start transition-colors last:border-b-0',
                    'border-s-[3px] border-s-transparent hover:bg-muted/40',
                    active &&
                      'border-s-primary bg-primary/8 hover:bg-primary/8',
                  )}
                >
                  <div role="cell" className="min-w-0 px-3 py-2.5 ps-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                          avatarToneClassNames[row.avatarTone],
                        )}
                        aria-hidden="true"
                      >
                        {row.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {t(`claimsImports.companies.${row.companyPageKey}`)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t('claimsImports.pageClaims.importMeta', {
                            month: t(
                              `claimsImports.importMonths.${row.importMonthKey}`,
                            ),
                            count: row.listingsCount,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div role="cell" className="min-w-0 px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-foreground">
                      {t(`claimsImports.claimants.${row.claimantNameKey}`)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(`claimsImports.emails.${row.claimantEmailKey}`)}
                    </p>
                  </div>

                  <div role="cell" className="px-3 py-2.5">
                    <ClaimsImportsEvidenceBadge evidenceId={row.evidenceId}>
                      {t(`claimsImports.evidence.${row.evidenceId}`)}
                    </ClaimsImportsEvidenceBadge>
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-sm font-medium text-foreground"
                  >
                    {t(`claimsImports.dates.${row.submittedKey}`)}
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 pe-4 text-end"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs font-bold text-primary"
                      onClick={() => onReview(row.id)}
                    >
                      {t(
                        row.tab === 'open'
                          ? 'claimsImports.actions.review'
                          : 'claimsImports.actions.view',
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
