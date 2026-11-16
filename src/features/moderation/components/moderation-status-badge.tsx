import {
  StatusBadge,
  type StatusBadgeStatus,
} from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import type { ModerationStatusId } from '@/features/moderation/types/moderation.types'

const statusMap: Record<ModerationStatusId, StatusBadgeStatus> = {
  open: 'warning',
  autoFlagged: 'warning',
  resolvedWarned: 'neutral',
  resolvedDismissed: 'neutral',
  resolvedRemoved: 'neutral',
  resolvedSuspended: 'neutral',
}

const statusExtraClass: Partial<Record<ModerationStatusId, string>> = {
  autoFlagged: 'border-transparent bg-warning/10 text-warning',
  open: 'border-transparent bg-destructive/10 text-destructive',
}

type ModerationStatusBadgeProps = {
  statusId: ModerationStatusId
  children: React.ReactNode
  className?: string
}

export function ModerationStatusBadge({
  statusId,
  children,
  className,
}: ModerationStatusBadgeProps) {
  return (
    <StatusBadge
      status={statusMap[statusId]}
      className={cn(
        'rounded-full text-[11px] font-bold',
        statusExtraClass[statusId],
        className,
      )}
    >
      {children}
    </StatusBadge>
  )
}
