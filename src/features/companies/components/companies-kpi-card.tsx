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

type CompaniesKpiCardProps = {
  title: string
  value: string
  deltaLabel?: string
  deltaStatus?: StatusBadgeStatus
  isLoading?: boolean
  className?: string
}

export function CompaniesKpiCard({
  title,
  value,
  deltaLabel,
  deltaStatus = 'success',
  isLoading = false,
  className,
}: CompaniesKpiCardProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <KpiCardSkeleton
        className={cn('min-w-0 shadow-sm', className)}
        label={t('companies.states.loading')}
      />
    )
  }

  return (
    <Card size="sm" className={cn('min-w-0 shadow-sm', className)}>
      <CardHeader className="gap-0 pb-0">
        <CardTitle className="text-xs! font-bold leading-snug text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5 pt-1">
        <p className="font-heading text-2xl leading-none font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>

        {deltaLabel ? (
          <StatusBadge
            status={deltaStatus}
            className="w-fit rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium"
          >
            {deltaLabel}
          </StatusBadge>
        ) : null}
      </CardContent>
    </Card>
  )
}
