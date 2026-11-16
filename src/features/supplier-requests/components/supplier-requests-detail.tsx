import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DetailPanelSkeleton } from '@/components/shared/detail-panel-skeleton'
import { SupplierRequestsCategoryBadge } from '@/features/supplier-requests/components/supplier-requests-category-badge'
import { SupplierRequestsResponseStatusBadge } from '@/features/supplier-requests/components/supplier-requests-response-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  SupplierRequestRow,
  SupplierResponseAvatarTone,
} from '@/features/supplier-requests/types/supplier-requests.types'

type SupplierRequestsDetailProps = {
  request: SupplierRequestRow | null
  isLoading?: boolean
}

const avatarToneClassNames: Record<SupplierResponseAvatarTone, string> = {
  violet: 'bg-primary text-primary-foreground',
  sky: 'bg-sky-700 text-white dark:bg-sky-600',
  mint: 'bg-violet-300 text-violet-950 dark:bg-violet-400 dark:text-violet-950',
  amber: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  rose: 'bg-rose-300 text-rose-950 dark:bg-rose-400 dark:text-rose-950',
  slate: 'bg-muted text-muted-foreground',
}

function detailStatusTone(
  statusId: SupplierRequestRow['statusId'],
): 'success' | 'warning' | 'info' | 'neutral' {
  switch (statusId) {
    case 'open':
      return 'success'
    case 'noResponses':
      return 'warning'
    case 'awarded':
      return 'info'
    case 'closed':
      return 'neutral'
  }
}

export function SupplierRequestsDetail({
  request,
  isLoading = false,
}: SupplierRequestsDetailProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <DetailPanelSkeleton
        className="rounded-2xl"
        label={t('supplierRequests.states.loading')}
        showActions
      />
    )
  }

  if (!request) {
    return (
      <Card className="flex min-h-[24rem] min-w-0 items-center justify-center rounded-2xl shadow-sm">
        <p className="px-6 text-center text-sm text-muted-foreground">
          {t('supplierRequests.states.pickRequest')}
        </p>
      </Card>
    )
  }

  const statusTone = detailStatusTone(request.statusId)

  const statusDetailLabel =
    request.statusId === 'noResponses'
      ? t('supplierRequests.detail.statusNoResponses')
      : request.statusId === 'open'
        ? t('supplierRequests.detail.statusOpen', {
            count: request.responseCount,
          })
        : t(`supplierRequests.detail.status.${request.statusId}`, {
            count: request.responseCount,
          })

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-primary/20">
      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <SupplierRequestsCategoryBadge tone={request.categoryTone} tag>
            {t(`supplierRequests.categories.${request.categoryId}`)}
          </SupplierRequestsCategoryBadge>
          <SupplierRequestsCategoryBadge
            tone={
              statusTone === 'success'
                ? 'success'
                : statusTone === 'warning'
                  ? 'warning'
                  : statusTone === 'info'
                    ? 'info'
                    : 'neutral'
            }
            className="uppercase"
          >
            {statusDetailLabel}
          </SupplierRequestsCategoryBadge>
        </div>

        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {t(`supplierRequests.items.${request.titleKey}`)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('supplierRequests.detail.postedMeta', {
              company: t(`supplierRequests.companies.${request.companyKey}`),
              posted: t(`supplierRequests.dates.posted.${request.postedKey}`),
            })}
          </p>
        </div>

        <dl className="flex flex-col">
          {request.facts.map((fact, index) => (
            <div
              key={`${fact.labelKey}-${fact.valueKey}`}
              className={cn(
                'flex items-center justify-between gap-3 py-2.5',
                index < request.facts.length - 1 && 'border-b border-border',
              )}
            >
              <dt className="text-[13px] text-muted-foreground">
                {t(`supplierRequests.facts.${fact.labelKey}`)}
              </dt>
              <dd className="text-end text-[13px] font-bold text-foreground">
                {t(`supplierRequests.factValues.${fact.valueKey}`)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              {t('supplierRequests.responses.sectionTitle')}
            </p>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs font-bold text-primary"
              onClick={() => {
                toast.message(t('supplierRequests.toasts.exportResponses'))
              }}
            >
              {t('supplierRequests.actions.exportResponses')}
            </Button>
          </div>

          {request.responses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('supplierRequests.responses.empty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {request.responses.map((response) => (
                <li key={response.id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                      avatarToneClassNames[response.avatarTone],
                    )}
                  >
                    {response.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-foreground">
                      {t(
                        `supplierRequests.suppliers.${response.supplierNameKey}`,
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {response.verified ? (
                        <>
                          {t('supplierRequests.responses.verified')}
                          <span aria-hidden="true"> · </span>
                        </>
                      ) : null}
                      {t('supplierRequests.responses.replied', {
                        when: t(
                          `supplierRequests.dates.replied.${response.repliedKey}`,
                        ),
                      })}
                    </p>
                  </div>
                  <SupplierRequestsResponseStatusBadge
                    statusId={response.statusId}
                  >
                    {t(
                      `supplierRequests.responseStatuses.${response.statusId}`,
                    )}
                  </SupplierRequestsResponseStatusBadge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t bg-transparent sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full flex-1 rounded-full border-primary bg-transparent font-medium text-primary shadow-none hover:bg-primary/5 hover:text-primary"
          onClick={() => {
            toast.message(t('supplierRequests.toasts.reportIssue'))
          }}
        >
          {t('supplierRequests.actions.reportIssue')}
        </Button>
        <Button
          type="button"
          className="h-10 w-full flex-1 rounded-full font-medium"
          onClick={() => {
            toast.message(t('supplierRequests.toasts.openListing'))
          }}
        >
          {t('supplierRequests.actions.openListing')}
        </Button>
      </CardFooter>
    </Card>
  )
}
