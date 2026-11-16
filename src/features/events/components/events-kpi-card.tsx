import { useTranslation } from 'react-i18next'
import { KpiCardSkeleton } from '@/components/shared/kpi-card-skeleton'
import {
  StatusBadge,
  type StatusBadgeStatus,
} from '@/components/shared/status-badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type EventsKpiCardProps = {
  title: string
  value: string
  footnoteLabel?: string
  footnoteStatus?: StatusBadgeStatus
  isLoading?: boolean
  className?: string
}

export function EventsKpiCard({
  title,
  value,
  footnoteLabel,
  footnoteStatus = 'success',
  isLoading = false,
  className,
}: EventsKpiCardProps) {
  const { t } = useTranslation()

  return (
    <Card size="sm" className={cn('min-w-0 shadow-sm', className)}>
      {isLoading ? (
        <CardContent>
          <KpiCardSkeleton
            withCard={false}
            label={t('events.states.loading')}
          />
        </CardContent>
      ) : (
        <>
          <CardHeader className="gap-0 pb-0">
            <CardTitle className="text-xs! font-bold leading-snug text-muted-foreground">
              {title}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-1.5 pt-1">
            <p className="font-heading text-2xl leading-none font-bold tracking-tight text-foreground tabular-nums">
              {value}
            </p>

            {footnoteLabel ? (
              <StatusBadge
                status={footnoteStatus}
                className="w-fit rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium"
              >
                {footnoteLabel}
              </StatusBadge>
            ) : null}
          </CardContent>
        </>
      )}
    </Card>
  )
}
