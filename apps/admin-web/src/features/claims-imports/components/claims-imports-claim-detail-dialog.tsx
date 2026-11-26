import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClaimsImportsEvidenceBadge } from '@/features/claims-imports/components/claims-imports-evidence-badge'
import { cn } from '@/lib/utils'
import type {
  ClaimAvatarTone,
  ClaimRow,
} from '@/features/claims-imports/types/claims-imports.types'

const avatarToneClassNames: Record<ClaimAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type ClaimsImportsClaimDetailDialogProps = {
  open: boolean
  claim: ClaimRow | null
  onOpenChange: (open: boolean) => void
}

export function ClaimsImportsClaimDetailDialog({
  open,
  claim,
  onOpenChange,
}: ClaimsImportsClaimDetailDialogProps) {
  const { t } = useTranslation()

  const isOpenClaim = claim?.tab === 'open'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        closeLabel={t('claimsImports.dialogs.close')}
      >
        <DialogHeader>
          <DialogTitle>
            {t(
              isOpenClaim
                ? 'claimsImports.dialogs.review.title'
                : 'claimsImports.dialogs.view.title',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              isOpenClaim
                ? 'claimsImports.dialogs.review.description'
                : 'claimsImports.dialogs.view.description',
            )}
          </DialogDescription>
        </DialogHeader>

        {claim ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  avatarToneClassNames[claim.avatarTone],
                )}
                aria-hidden="true"
              >
                {claim.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">
                  {t(`claimsImports.companies.${claim.companyPageKey}`)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('claimsImports.pageClaims.importMeta', {
                    month: t(
                      `claimsImports.importMonths.${claim.importMonthKey}`,
                    ),
                    count: claim.listingsCount,
                  })}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('claimsImports.columns.claimedBy')}
                </dt>
                <dd className="text-sm font-bold text-foreground">
                  {t(`claimsImports.claimants.${claim.claimantNameKey}`)}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {t(`claimsImports.emails.${claim.claimantEmailKey}`)}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('claimsImports.columns.submitted')}
                </dt>
                <dd className="text-sm font-bold text-foreground">
                  {t(`claimsImports.dates.${claim.submittedKey}`)}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2.5 sm:col-span-2">
                <dt className="mb-1.5 text-[11px] font-bold text-muted-foreground">
                  {t('claimsImports.columns.evidence')}
                </dt>
                <dd>
                  <ClaimsImportsEvidenceBadge evidenceId={claim.evidenceId}>
                    {t(`claimsImports.evidence.${claim.evidenceId}`)}
                  </ClaimsImportsEvidenceBadge>
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('claimsImports.dialogs.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
