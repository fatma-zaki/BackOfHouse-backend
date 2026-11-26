import { AlertTriangle, Check, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DetailPanelSkeleton } from '@/components/shared/detail-panel-skeleton'
import { VerificationDocumentPanel } from '@/features/verification/components/verification-document-panel'
import { isOpenVerificationRequest } from '@/features/verification/lib/filter-verification'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import type { VerificationRequest } from '@/features/verification/types/verification.types'

type VerificationDetailProps = {
  request: VerificationRequest | null
  isLoading?: boolean
  onReject: () => void
  onAskMoreInfo: () => void
  onApprove: () => void
}

function CheckIcon({ state }: { state: 'pass' | 'warn' | 'fail' }) {
  if (state === 'pass') {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="size-3" aria-hidden="true" />
      </span>
    )
  }
  if (state === 'warn') {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
        <AlertTriangle className="size-3" aria-hidden="true" />
      </span>
    )
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
      <X className="size-3" aria-hidden="true" />
    </span>
  )
}

export function VerificationDetail({
  request,
  isLoading = false,
  onReject,
  onAskMoreInfo,
  onApprove,
}: VerificationDetailProps) {
  const { t } = useTranslation()
  const [documentByRequestId, setDocumentByRequestId] = useState<
    Record<string, string>
  >({})

  if (isLoading) {
    return (
      <DetailPanelSkeleton
        label={t('verification.states.loading')}
        showActions
      />
    )
  }

  if (!request) {
    return (
      <Card className="flex min-h-[24rem] min-w-0 items-center justify-center shadow-sm">
        <p className="px-6 text-center text-sm text-muted-foreground">
          {t('verification.states.pickRequest')}
        </p>
      </Card>
    )
  }

  const open = isOpenVerificationRequest(request.queueStatusId)
  const requesterRole =
    request.requestedMeta.requesterRoleKey === 'self'
      ? null
      : t(
          `verification.requesterRoles.${request.requestedMeta.requesterRoleKey}`,
        )

  const requestedMeta = t('verification.detail.requestedMeta', {
    type: t(
      `verification.applicantLabels.${request.requestedMeta.typeLabelKey}`,
    ),
    requester: t(`verification.people.${request.requestedMeta.requesterKey}`),
    role: requesterRole ? ` (${requesterRole})` : '',
    submitted: t(
      `verification.dates.submitted.${request.requestedMeta.submittedKey}`,
    ),
  })

  const effectiveDocumentId =
    documentByRequestId[request.id] ?? request.defaultDocumentId

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden shadow-sm ring-1 ring-primary/15">
      <CardContent className="flex flex-1 flex-col gap-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(11rem,15rem)]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                {t(`verification.names.${request.nameKey}`)}
              </h2>
              <p className="text-sm text-muted-foreground">{requestedMeta}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {request.facts.map((fact) => (
                <div
                  key={`${fact.labelKey}-${fact.valueKey}`}
                  className="rounded-xl bg-muted/70 px-3 py-2.5"
                >
                  <p className="text-[11px] font-bold text-muted-foreground">
                    {t(`verification.facts.${fact.labelKey}`)}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {t(`verification.factValues.${fact.valueKey}`)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                {t('verification.checks.title')}
              </p>
              <ul className="flex flex-col gap-2">
                {request.checks.map((check) => (
                  <li
                    key={check.textKey}
                    className="flex items-start gap-2 text-[13px] text-foreground"
                  >
                    <CheckIcon state={check.state} />
                    <span>
                      {t(`verification.checks.items.${check.textKey}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <VerificationDocumentPanel
            documents={request.documents}
            selectedDocumentId={effectiveDocumentId}
            onSelectDocument={(id) => {
              setDocumentByRequestId((prev) => ({ ...prev, [request.id]: id }))
            }}
          />
        </div>
      </CardContent>

      {open ? (
        <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onReject}
          >
            {t('verification.actions.reject')}
          </Button>
          <div className="ms-auto flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onAskMoreInfo}>
              {t('verification.actions.askMoreInfo')}
            </Button>
            <Button type="button" onClick={onApprove}>
              {t('verification.actions.approve')}
            </Button>
          </div>
        </CardFooter>
      ) : (
        <CardFooter className="border-t bg-muted/20 px-4 py-3 sm:px-5">
          <p className="text-sm text-muted-foreground">
            {t(`verification.decided.${request.queueStatusId}`)}
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
