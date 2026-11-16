import { AlertTriangle, BadgeCheck, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DetailPanelSkeleton } from '@/components/shared/detail-panel-skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ListingsToneBadge } from '@/features/listings/components/listings-tone-badge'
import { isOpenListing } from '@/features/listings/lib/filter-listings'
import { cn } from '@/lib/utils'
import type { ListingSubmission } from '@/features/listings/types/listings.types'

type ListingsDetailProps = {
  listing: ListingSubmission | null
  isLoading?: boolean
  note: string
  onNoteChange: (value: string) => void
  onReject: () => void
  onRequestChanges: () => void
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

export function ListingsDetail({
  listing,
  isLoading = false,
  note,
  onNoteChange,
  onReject,
  onRequestChanges,
  onApprove,
}: ListingsDetailProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <DetailPanelSkeleton label={t('listings.states.loading')} showActions />
    )
  }

  if (!listing) {
    return (
      <Card className="flex min-h-[24rem] min-w-0 items-center justify-center shadow-sm">
        <p className="px-6 text-center text-sm text-muted-foreground">
          {t('listings.states.pickListing')}
        </p>
      </Card>
    )
  }

  const open = isOpenListing(listing.statusId)

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden shadow-sm ring-1 ring-primary/15">
      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <ListingsToneBadge tone={listing.typeTone} tag>
            {t(`listings.types.${listing.typeId}`)}
          </ListingsToneBadge>
          <ListingsToneBadge tone={listing.statusTone} className="uppercase">
            {t(`listings.statusDetail.${listing.statusId}`)}
          </ListingsToneBadge>
        </div>

        <div className="space-y-2">
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {t(`listings.items.${listing.titleKey}`)}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {t(`listings.companies.${listing.companyKey}`)
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-foreground">
              {t(`listings.companies.${listing.companyKey}`)}
              {listing.companyVerified ? (
                <BadgeCheck className="size-4 text-primary" aria-label={t('listings.verified')} />
              ) : null}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t('listings.submittedMeta', {
                when: t(`listings.submitted.${listing.submittedKey}`),
              })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {listing.facts.map((fact) => (
            <div
              key={`${fact.labelKey}-${fact.valueKey}`}
              className="rounded-xl bg-muted/70 px-3 py-2.5"
            >
              <p className="text-[11px] font-bold text-muted-foreground">
                {t(`listings.facts.${fact.labelKey}`)}
              </p>
              <p className="text-sm font-bold text-foreground">
                {t(`listings.factValues.${fact.valueKey}`)}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[13px] leading-relaxed text-foreground">
          {t(`listings.descriptions.${listing.descriptionKey}`)}
        </p>

        <div className="space-y-2">
          <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            {t('listings.checks.title')}
          </p>
          <ul className="flex flex-col gap-2">
            {listing.checks.map((check) => (
              <li
                key={check.textKey}
                className="flex items-start gap-2 text-[13px] text-foreground"
              >
                <CheckIcon state={check.state} />
                <span>{t(`listings.checks.items.${check.textKey}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        {open ? (
          <div className="space-y-2">
            <Label
              htmlFor="listings-company-note"
              className="text-[11px] font-bold tracking-wide text-foreground uppercase"
            >
              {t('listings.note.label')}
            </Label>
            <Textarea
              id="listings-company-note"
              rows={3}
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={t('listings.note.placeholder')}
              className="min-h-20 resize-none rounded-xl bg-muted/50 shadow-none"
            />
          </div>
        ) : null}
      </CardContent>

      {open ? (
        <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onReject}
          >
            {t('listings.actions.reject')}
          </Button>
          <div className="ms-auto flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                'border-warning/40 bg-warning/10 text-warning hover:bg-warning/15 hover:text-warning',
              )}
              onClick={onRequestChanges}
            >
              {t('listings.actions.requestChanges')}
            </Button>
            <Button type="button" onClick={onApprove}>
              {t('listings.actions.approve')}
            </Button>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  )
}
