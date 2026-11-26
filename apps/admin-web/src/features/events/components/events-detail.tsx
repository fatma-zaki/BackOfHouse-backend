import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DetailPanelSkeleton } from '@/components/shared/detail-panel-skeleton'
import { EventsEventThumb } from '@/features/events/components/events-event-thumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { EventRow } from '@/features/events/types/events.types'

type EventsDetailProps = {
  event: EventRow | null
  isLoading?: boolean
}

export function EventsDetail({
  event,
  isLoading = false,
}: EventsDetailProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <DetailPanelSkeleton label={t('events.states.loading')} showActions />
    )
  }

  if (!event) {
    return (
      <Card className="flex min-h-[24rem] min-w-0 items-center justify-center shadow-sm">
        <p className="px-6 text-center text-sm text-muted-foreground">
          {t('events.states.pickEvent')}
        </p>
      </Card>
    )
  }

  const verifiedRatio =
    event.registered > 0
      ? Math.min(event.verifiedAttendance / event.registered, 1)
      : 0

  const awardCount = event.verifiedAttendance
  const pointsEach = event.pointsPerAttendee

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden shadow-sm ring-1 ring-primary/15">
      <EventsEventThumb
        gradient={event.coverGradient}
        className="h-36 w-full rounded-none"
        decorative
      />

      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {t(`events.items.${event.titleKey}`)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(`events.detailMeta.${event.detailMetaKey}`)}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            {t('events.detail.attendanceSection')}
          </p>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-foreground">
                {t('events.detail.verifiedAttendance')}
              </p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                {t('events.detail.verifiedOfRegistered', {
                  verified: event.verifiedAttendance.toLocaleString(),
                  registered: event.registered.toLocaleString(),
                })}
              </p>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={event.registered}
              aria-valuenow={event.verifiedAttendance}
              aria-label={t('events.detail.verifiedAttendance')}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${verifiedRatio * 100}%` }}
              />
            </div>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">
                {t('events.detail.registeredLabel')}
              </dt>
              <dd className="font-bold tabular-nums text-foreground">
                {event.registered.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">
                {t('events.detail.checkInMethodLabel')}
              </dt>
              <dd className="font-bold text-foreground">
                {t(`events.checkInMethods.${event.checkInMethodKey}`)}
              </dd>
            </div>
            {event.unmatchedScans > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">
                  {t('events.detail.notYetMatchedLabel')}
                </dt>
                <dd className="font-bold tabular-nums text-foreground">
                  {t('events.detail.unmatchedScans', {
                    count: event.unmatchedScans,
                  })}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div
          className={cn(
            'flex gap-2.5 rounded-xl border border-warning/25 bg-warning/10 px-3 py-2.5 text-sm text-foreground',
          )}
        >
          <Info
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p className="leading-snug">{t('events.detail.pointsCallout')}</p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/20">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            toast.message(t('events.toasts.importCheckIns'))
          }}
        >
          {t('events.actions.importCheckIns')}
        </Button>
        <Button
          type="button"
          className="ms-auto"
          disabled={awardCount === 0}
          onClick={() => {
            toast.message(
              t('events.toasts.awardPoints', {
                count: awardCount,
                points: pointsEach,
              }),
            )
          }}
        >
          {t('events.actions.awardPoints', {
            count: awardCount.toLocaleString(),
            points: pointsEach,
          })}
        </Button>
      </CardFooter>
    </Card>
  )
}
