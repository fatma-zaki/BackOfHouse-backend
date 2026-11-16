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
import { ApplicationsStatusBadge } from '@/features/applications/components/applications-status-badge'
import { cn } from '@/lib/utils'
import type {
  ApplicationAvatarTone,
  ApplicationRow,
} from '@/features/applications/types/applications.types'

const avatarToneClassNames: Record<ApplicationAvatarTone, string> = {
  violet: 'bg-primary/15 text-primary',
  sky: 'bg-info/15 text-info',
  mint: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  rose: 'bg-destructive/10 text-destructive',
  slate: 'bg-muted text-muted-foreground',
}

type ApplicationsDetailDialogProps = {
  open: boolean
  application: ApplicationRow | null
  onOpenChange: (open: boolean) => void
}

export function ApplicationsDetailDialog({
  open,
  application,
  onOpenChange,
}: ApplicationsDetailDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" closeLabel={t('applications.dialogs.close')}>
        <DialogHeader>
          <DialogTitle>{t('applications.dialogs.view.title')}</DialogTitle>
          <DialogDescription>
            {t('applications.dialogs.view.description')}
          </DialogDescription>
        </DialogHeader>

        {application ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  avatarToneClassNames[application.avatarTone],
                )}
                aria-hidden="true"
              >
                {application.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">
                  {t(`applications.applicants.${application.applicantNameKey}`)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(`applications.cities.${application.cityId}`)}
                  {' · '}
                  {t(`applications.personas.${application.personaKey}`)}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('applications.columns.listing')}
                </dt>
                <dd className="text-sm font-bold text-foreground">
                  {t(`applications.listings.${application.listingTitleKey}`)}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {t(`applications.companies.${application.companyKey}`)}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('applications.columns.status')}
                </dt>
                <dd className="mt-1">
                  <ApplicationsStatusBadge statusId={application.statusId}>
                    {t(`applications.statuses.${application.statusId}`)}
                  </ApplicationsStatusBadge>
                </dd>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('applications.columns.applied')}
                </dt>
                <dd className="text-sm font-bold text-foreground">
                  {t(`applications.applied.${application.appliedKey}`)}
                </dd>
              </div>
              <div className="rounded-xl bg-muted/70 px-3 py-2.5">
                <dt className="text-[11px] font-bold text-muted-foreground">
                  {t('applications.columns.timeInStage')}
                </dt>
                <dd className="text-sm font-bold text-foreground">
                  {t(`applications.timeInStage.${application.timeInStageKey}`)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('applications.dialogs.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
