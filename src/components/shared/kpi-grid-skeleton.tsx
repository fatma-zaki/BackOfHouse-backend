import { KpiCardSkeleton } from '@/components/shared/kpi-card-skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type KpiGridSkeletonProps = {
  /** Number of KPI cards. Defaults to 4. */
  count?: number
  className?: string
  label?: string
  /** Tailwind grid class override. */
  gridClassName?: string
  /** When false, omit the accessible status region (parent announces). */
  announce?: boolean
}

export function KpiGridSkeleton({
  count = 4,
  className,
  label,
  gridClassName = 'grid grid-cols-2 gap-3 md:grid-cols-4',
  announce = true,
}: KpiGridSkeletonProps) {
  const safeCount = Math.max(1, Math.floor(count))
  const cards = Array.from({ length: safeCount }, (_, index) => (
    <KpiCardSkeleton key={index} announce={false} />
  ))

  if (!announce) {
    return <div className={cn(gridClassName, className)}>{cards}</div>
  }

  return (
    <SkeletonRegion label={label} className={cn(gridClassName, className)}>
      {cards}
    </SkeletonRegion>
  )
}
