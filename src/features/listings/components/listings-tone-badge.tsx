import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ListingTone } from '@/features/listings/types/listings.types'

const toneClassNames: Record<ListingTone, string> = {
  violet: 'border-transparent bg-primary/10 text-primary',
  info: 'border-transparent bg-info/10 text-info',
  warning: 'border-transparent bg-warning/15 text-warning',
  success: 'border-transparent bg-success/10 text-success',
  danger: 'border-transparent bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
  muted: 'border-border bg-muted text-muted-foreground',
}

type ListingsToneBadgeProps = {
  tone: ListingTone
  children: React.ReactNode
  className?: string
  /** Uppercase tag style (JOB, CO-OP…). */
  tag?: boolean
}

export function ListingsToneBadge({
  tone,
  children,
  className,
  tag = false,
}: ListingsToneBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full font-bold',
        tag && 'rounded-md px-1.5 py-0 text-[10px] tracking-wide uppercase',
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </Badge>
  )
}
