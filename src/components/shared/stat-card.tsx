import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { KpiCardSkeleton } from '@/components/shared/kpi-card-skeleton'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type StatCardTrendDirection = 'up' | 'down' | 'neutral'

export type StatCardTrend = {
  direction: StatCardTrendDirection
  /** Short visible trend text (e.g. "+12%"). */
  value: string
  /**
   * Accessible description of the trend.
   * Defaults to `value` when omitted.
   */
  label?: string
}

export type StatCardProps = {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: StatCardTrend
  isLoading?: boolean
  className?: string
}

const trendClassNames: Record<StatCardTrendDirection, string> = {
  up: 'text-success',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
}

function TrendIcon({ direction }: { direction: StatCardTrendDirection }) {
  const className = 'size-3.5 shrink-0'

  switch (direction) {
    case 'up':
      return <TrendingUp aria-hidden="true" className={className} />
    case 'down':
      return <TrendingDown aria-hidden="true" className={className} />
    case 'neutral':
      return <Minus aria-hidden="true" className={className} />
  }
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading = false,
  className,
}: StatCardProps) {
  return (
    <Card size="sm" className={cn(className)}>
      {isLoading ? (
        <CardContent>
          <KpiCardSkeleton withCard={false} />
        </CardContent>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="text-muted-foreground">{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
            {icon ? (
              <CardAction>
                <div
                  className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
                  aria-hidden="true"
                >
                  {icon}
                </div>
              </CardAction>
            ) : null}
          </CardHeader>

          <CardContent className="flex flex-col gap-2">
            <p className="num font-heading text-2xl leading-none tracking-tight text-foreground">
              {value}
            </p>

            {trend ? (
              <p
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  trendClassNames[trend.direction],
                )}
                aria-label={trend.label ?? trend.value}
              >
                <TrendIcon direction={trend.direction} />
                <span aria-hidden="true">{trend.value}</span>
              </p>
            ) : null}
          </CardContent>
        </>
      )}
    </Card>
  )
}
