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

type SupplierRequestsKpiCardProps = {
  title: string
  value: string
  footnoteLabel?: string
  footnoteStatus?: StatusBadgeStatus
  isLoading?: boolean
  className?: string
}

export function SupplierRequestsKpiCard({
  title,
  value,
  footnoteLabel,
  footnoteStatus = 'success',
  isLoading = false,
  className,
}: SupplierRequestsKpiCardProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <KpiCardSkeleton
        className={cn('min-w-0 rounded-2xl shadow-sm', className)}
        label={t('supplierRequests.states.loading')}
      />
    )
  }

  return (
    <Card size="sm" className={cn('min-w-0 rounded-2xl shadow-sm', className)}>
      <CardHeader className="gap-0 pb-0">
        <CardTitle className="text-xs! font-medium leading-snug text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 pt-1.5">
        <p className="font-heading text-[1.75rem] leading-none font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>

        {footnoteLabel ? (
          <StatusBadge
            status={footnoteStatus}
            className="w-fit rounded-full px-2 py-0.5 text-[11px] leading-4 font-bold"
          >
            {footnoteLabel}
          </StatusBadge>
        ) : null}
      </CardContent>
    </Card>
  )
}
