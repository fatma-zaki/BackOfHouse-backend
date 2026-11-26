import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type TableSkeletonProps = {
  /** Number of body rows. Defaults to 6. */
  rows?: number
  /** Number of columns. Defaults to 5. */
  columns?: number
  className?: string
  label?: string
  /** Show a header row. Defaults to true. */
  showHeader?: boolean
  /** Approximate row height. */
  dense?: boolean
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
  label,
  showHeader = true,
  dense = false,
}: TableSkeletonProps) {
  const rowCount = Math.max(1, Math.floor(rows))
  const colCount = Math.max(1, Math.floor(columns))
  const rowPad = dense ? 'py-2.5' : 'py-3.5'

  return (
    <SkeletonRegion label={label} className={cn('w-full', className)}>
      <div className="w-full overflow-hidden">
        {showHeader ? (
          <div
            className="grid gap-3 border-b border-border bg-muted/40 px-4 py-2.5"
            style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: colCount }, (_, index) => (
              <Skeleton
                key={`h-${index}`}
                className={cn('h-3', index === 0 ? 'w-3/5' : 'w-2/5')}
              />
            ))}
          </div>
        ) : null}

        <div className="divide-y divide-border">
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className={cn('grid gap-3 px-4', rowPad)}
              style={{
                gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: colCount }, (_, colIndex) => (
                <div key={colIndex} className="flex min-w-0 flex-col gap-1.5">
                  <Skeleton
                    className={cn(
                      'h-3.5',
                      colIndex === 0 ? 'w-4/5' : 'w-3/5',
                    )}
                  />
                  {colIndex === 0 && !dense ? (
                    <Skeleton className="h-3 w-1/2" />
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  )
}
