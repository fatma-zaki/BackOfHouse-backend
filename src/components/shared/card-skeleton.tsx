import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type CardSkeletonProps = {
  className?: string
  label?: string
  /** Number of body lines. Defaults to 4. */
  lines?: number
  showHeader?: boolean
  /** Optional fixed min-height for the body area. */
  bodyClassName?: string
  /** When false, omit the accessible status region (parent announces). */
  announce?: boolean
}

export function CardSkeleton({
  className,
  label,
  lines = 4,
  showHeader = true,
  bodyClassName,
  announce = true,
}: CardSkeletonProps) {
  const lineCount = Math.max(1, Math.floor(lines))

  const body = (
    <div className="flex flex-col gap-3">
      {Array.from({ length: lineCount }, (_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === lineCount - 1 ? 'w-2/3' : 'w-full',
          )}
        />
      ))}
    </div>
  )

  return (
    <Card className={cn('min-w-0 shadow-sm', className)}>
      {showHeader ? (
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </CardHeader>
      ) : null}
      <CardContent className={cn(showHeader && 'pt-0', bodyClassName)}>
        {announce ? (
          <SkeletonRegion label={label}>{body}</SkeletonRegion>
        ) : (
          body
        )}
      </CardContent>
    </Card>
  )
}
