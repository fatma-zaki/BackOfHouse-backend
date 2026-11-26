import type { ReactNode } from 'react'
import {
  StatusBadge,
  type StatusBadgeStatus,
} from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AuditActionId } from '@/features/audit/types/audit.types'

type AuditActionBadgeProps = {
  actionId: AuditActionId
  children: ReactNode
  className?: string
}

const statusBadgeMap: Partial<
  Record<AuditActionId, StatusBadgeStatus>
> = {
  exportedData: 'info',
  requestedChanges: 'warning',
  approvedVerification: 'success',
  suspendedAccount: 'destructive',
  publishedStory: 'success',
  changedRole: 'info',
  signedIn: 'neutral',
}

export function AuditActionBadge({
  actionId,
  children,
  className,
}: AuditActionBadgeProps) {
  if (actionId === 'adjustedPoints') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'rounded-full border-transparent bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary',
          className,
        )}
      >
        {children}
      </Badge>
    )
  }

  const status = statusBadgeMap[actionId] ?? 'neutral'

  return (
    <StatusBadge
      status={status}
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
        className,
      )}
    >
      {children}
    </StatusBadge>
  )
}
