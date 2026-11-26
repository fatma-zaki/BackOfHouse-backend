import type { ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusBadgeStatus =
  | 'success'
  | 'warning'
  | 'info'
  | 'destructive'
  | 'neutral'

const statusClassNames: Record<StatusBadgeStatus, string> = {
  success: 'border-transparent bg-success/10 text-success',
  warning: 'border-transparent bg-warning/15 text-warning',
  info: 'border-transparent bg-info/10 text-info',
  destructive: 'border-transparent bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
}

export type StatusBadgeProps = Omit<ComponentProps<typeof Badge>, 'variant'> & {
  status: StatusBadgeStatus
}

export function StatusBadge({
  status,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      data-status={status}
      className={cn(statusClassNames[status], className)}
      {...props}
    />
  )
}
