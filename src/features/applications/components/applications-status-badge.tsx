import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ApplicationStatusId } from '@/features/applications/types/applications.types'

const statusClassNames: Record<ApplicationStatusId, string> = {
  shortlisted: 'border-transparent bg-primary/10 text-primary',
  inReview: 'border-transparent bg-info/10 text-info',
  selected: 'border-transparent bg-success/10 text-success',
  applied: 'border-border bg-muted text-muted-foreground',
  notSelected: 'border-transparent bg-destructive/10 text-destructive',
}

type ApplicationsStatusBadgeProps = {
  statusId: ApplicationStatusId
  children: ReactNode
  className?: string
}

export function ApplicationsStatusBadge({
  statusId,
  children,
  className,
}: ApplicationsStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
        statusClassNames[statusId],
        className,
      )}
    >
      {children}
    </Badge>
  )
}
