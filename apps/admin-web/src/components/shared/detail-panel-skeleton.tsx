import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type DetailPanelSkeletonProps = {
  className?: string
  label?: string
  /** Show action button placeholders in a footer. Defaults to true. */
  showActions?: boolean
  /** Number of checklist / field rows. Defaults to 4. */
  rows?: number
}

export function DetailPanelSkeleton({
  className,
  label,
  showActions = true,
  rows = 4,
}: DetailPanelSkeletonProps) {
  const rowCount = Math.max(1, Math.floor(rows))

  return (
    <Card
      className={cn(
        'flex min-h-[24rem] min-w-0 flex-col overflow-hidden shadow-sm',
        className,
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <SkeletonRegion label={label} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            {Array.from({ length: rowCount }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-5 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </SkeletonRegion>
      </CardContent>

      {showActions ? (
        <CardFooter className="flex flex-wrap gap-2 border-t border-border p-4 sm:p-5">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="ms-auto h-9 w-28" />
        </CardFooter>
      ) : null}
    </Card>
  )
}
