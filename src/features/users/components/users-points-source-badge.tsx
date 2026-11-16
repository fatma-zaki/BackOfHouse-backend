import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserPointsSourceTone } from '@/features/users/types/users.types'

const toneClassNames: Record<UserPointsSourceTone, string> = {
  success: 'border-transparent bg-success/10 text-success',
  violet: 'border-transparent bg-primary/10 text-primary',
  warning: 'border-transparent bg-warning/15 text-warning',
  neutral: 'border-border bg-muted text-muted-foreground',
  info: 'border-transparent bg-info/10 text-info',
}

type UsersPointsSourceBadgeProps = {
  tone: UserPointsSourceTone
  children: React.ReactNode
  className?: string
}

export function UsersPointsSourceBadge({
  tone,
  children,
  className,
}: UsersPointsSourceBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-md px-1.5 py-0 text-[10px] font-bold tracking-wide uppercase',
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </Badge>
  )
}
