import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type LoadingStateProps = {
  className?: string
  /** Number of skeleton rows. Defaults to 3. */
  rows?: number
  /** Screen-reader loading announcement. */
  label?: string
}

/**
 * Compact line-list loading placeholder.
 * Prefer TableSkeleton / ChartSkeleton / DetailPanelSkeleton when the
 * surrounding layout is known.
 */
export function LoadingState({
  className,
  rows = 3,
  label,
}: LoadingStateProps) {
  const count = Math.max(1, Math.floor(rows))

  return (
    <SkeletonRegion
      label={label}
      className={cn('flex w-full flex-col gap-3', className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4 w-full', index === count - 1 && 'w-2/3')}
        />
      ))}
    </SkeletonRegion>
  )
}
