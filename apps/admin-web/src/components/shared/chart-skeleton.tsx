import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type ChartSkeletonProps = {
  className?: string
  label?: string
  /** Chart plot height class. Defaults to matching overview/analytics charts. */
  heightClassName?: string
  showLegend?: boolean
}

export function ChartSkeleton({
  className,
  label,
  heightClassName = 'h-56 sm:h-64',
  showLegend = false,
}: ChartSkeletonProps) {
  return (
    <SkeletonRegion label={label} className={cn('flex w-full flex-col gap-3', className)}>
      <div
        className={cn(
          'flex w-full items-end gap-1.5 sm:gap-2',
          heightClassName,
        )}
      >
        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 48, 68].map((height, index) => (
          <Skeleton
            key={index}
            className="min-w-0 flex-1 rounded-sm"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      {showLegend ? (
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      ) : null}
    </SkeletonRegion>
  )
}
