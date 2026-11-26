import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type ListSkeletonProps = {
  /** Number of list items. Defaults to 6. */
  rows?: number
  className?: string
  label?: string
  /** Show a leading avatar/icon circle. Defaults to true. */
  showAvatar?: boolean
  /** Show a trailing badge/action placeholder. Defaults to true. */
  showMeta?: boolean
}

export function ListSkeleton({
  rows = 6,
  className,
  label,
  showAvatar = true,
  showMeta = true,
}: ListSkeletonProps) {
  const count = Math.max(1, Math.floor(rows))

  return (
    <SkeletonRegion label={label} className={cn('flex w-full flex-col', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-3 px-4 py-3',
            index < count - 1 && 'border-b border-border',
          )}
        >
          {showAvatar ? (
            <Skeleton className="size-9 shrink-0 rounded-full" />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          {showMeta ? <Skeleton className="h-5 w-14 shrink-0 rounded-full" /> : null}
        </div>
      ))}
    </SkeletonRegion>
  )
}
