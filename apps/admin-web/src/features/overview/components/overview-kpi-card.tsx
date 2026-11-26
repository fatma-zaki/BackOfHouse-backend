import { useTranslation } from 'react-i18next'
import { StatusBadge } from '@/components/shared/status-badge'
import { KpiCardSkeleton } from '@/components/shared/kpi-card-skeleton'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type OverviewKpiCardProps = {
  title: string
  value: string
  secondaryLabel: string
  isLoading?: boolean
  className?: string
}

/**
 * Single Overview KPI presentation aligned to the reference (label, value, green pill).
 * Uses Card + StatusBadge instead of StatCard: StatCard always renders trend icons,
 * which do not match the reference pills (e.g. “214 verified”).
 */
export function OverviewKpiCard({
  title,
  value,
  secondaryLabel,
  isLoading = false,
  className,
}: OverviewKpiCardProps) {
  const { t } = useTranslation()

  return (
    <Card size="sm" className={cn('min-w-0 shadow-sm', className)}>
      {isLoading ? (
        <CardContent>
          <KpiCardSkeleton
            withCard={false}
            label={t('overview.states.loading')}
          />
        </CardContent>
      ) : (
        <>
          <CardHeader className="gap-0">
            <CardTitle className="text-xs! font-medium leading-snug text-secondary-foreground">
              {title}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-2">
            <p className="num font-heading text-xl leading-none tracking-tight text-foreground">
              {value}
            </p>

            <StatusBadge
              status="success"
              className="w-fit rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium"
            >
              {secondaryLabel}
            </StatusBadge>
          </CardContent>
        </>
      )}
    </Card>
  )
}
