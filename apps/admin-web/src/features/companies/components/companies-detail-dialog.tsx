import { BadgeCheck } from 'lucide-react'
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
import { CompaniesStatusBadge } from '@/features/companies/components/companies-status-badge'
import { cn } from '@/lib/utils'
import type {
  CompanyAvatarTone,
  CompanyRow,
} from '@/features/companies/types/companies.types'

const avatarToneClassNames: Record<CompanyAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type CompaniesDetailDialogProps = {
  open: boolean
  company: CompanyRow | null
  onOpenChange: (open: boolean) => void
}

export function CompaniesDetailDialog({
  open,
  company,
  onOpenChange,
}: CompaniesDetailDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" closeLabel={t('companies.dialogs.close')}>
        <DialogHeader>
          <DialogTitle>{t('companies.dialogs.view.title')}</DialogTitle>
          <DialogDescription>
            {t('companies.dialogs.view.description')}
          </DialogDescription>
        </DialogHeader>

        {company ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  avatarToneClassNames[company.avatarTone],
                )}
                aria-hidden="true"
              >
                {company.initials}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-base font-bold text-foreground">
                  <span className="truncate">
                    {t(`companies.names.${company.companyKey}`)}
                  </span>
                  {company.showVerifiedBadge ? (
                    <BadgeCheck
                      className="size-4 shrink-0 text-primary"
                      aria-label={t('companies.verifiedBadge')}
                    />
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(`companies.industries.${company.industryKey}`)}
                  {' · '}
                  {t(`companies.cities.${company.cityId}`)}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('companies.columns.liveListings')}
                </dt>
                <dd className="text-sm font-bold tabular-nums text-foreground">
                  {company.liveListings}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('companies.columns.applications')}
                </dt>
                <dd className="text-sm font-bold tabular-nums text-foreground">
                  {company.applicationsDisplay}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('companies.columns.respondsToApplicants')}
                </dt>
                <dd className="text-sm font-bold tabular-nums text-foreground">
                  {company.responseRatePercent}%
                </dd>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('companies.columns.verification')}
                </dt>
                <dd className="pt-0.5">
                  <CompaniesStatusBadge
                    verificationStatusId={company.verificationStatusId}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  >
                    {t(
                      `companies.verification.${company.verificationStatusId}`,
                    )}
                  </CompaniesStatusBadge>
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            {t('companies.dialogs.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
