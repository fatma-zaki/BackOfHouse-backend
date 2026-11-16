import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonRegion } from '@/components/shared/skeleton-region'
import { cn } from '@/lib/utils'

export type FormSkeletonProps = {
  /** Number of field groups. Defaults to 4. */
  fields?: number
  className?: string
  label?: string
  /** Include a primary action bar. Defaults to true. */
  showActions?: boolean
  /** Use a taller control for the last field (textarea). Defaults to true. */
  lastFieldTall?: boolean
  /** When false, omit the accessible status region (parent announces). */
  announce?: boolean
}

export function FormSkeleton({
  fields = 4,
  className,
  label,
  showActions = true,
  lastFieldTall = true,
  announce = true,
}: FormSkeletonProps) {
  const count = Math.max(1, Math.floor(fields))

  const body = (
    <>
      {Array.from({ length: count }, (_, index) => {
        const tall = lastFieldTall && index === count - 1
        return (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className={cn(tall ? 'h-24 w-full' : 'h-9 w-full')} />
          </div>
        )
      })}
      {showActions ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      ) : null}
    </>
  )

  if (!announce) {
    return (
      <div className={cn('flex w-full flex-col gap-4', className)}>{body}</div>
    )
  }

  return (
    <SkeletonRegion
      label={label}
      className={cn('flex w-full flex-col gap-4', className)}
    >
      {body}
    </SkeletonRegion>
  )
}
