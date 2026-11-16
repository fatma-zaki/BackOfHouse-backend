import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type KpiCardSkeletonProps = {
  className?: string
  label?: string
  /** When false, renders only the inner bars (for cards that already wrap content). */
  withCard?: boolean
  /** When false, omit the accessible region wrapper (parent provides it). */
  announce?: boolean
}

function KpiCardSkeletonBody() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  )
}

export function KpiCardSkeleton({
  className,
  label,
  withCard = true,
  announce = true,
}: KpiCardSkeletonProps) {
  const body = announce ? (
    <SkeletonRegion label={label}>
      <KpiCardSkeletonBody />
    </SkeletonRegion>
  ) : (
    <KpiCardSkeletonBody />
  )

  if (!withCard) {
    return <div className={className}>{body}</div>
  }

  return (
    <Card size="sm" className={cn('min-w-0 shadow-sm', className)}>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
