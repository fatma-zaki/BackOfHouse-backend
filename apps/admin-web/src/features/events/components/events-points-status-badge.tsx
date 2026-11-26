import type { ReactNode } from 'react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { EventPointsStatusId } from '@/features/events/types/events.types'

type EventsPointsStatusBadgeProps = {
  statusId: EventPointsStatusId
  children: ReactNode
}

function statusForPointsStatusId(
  statusId: EventPointsStatusId,
): 'warning' | 'success' | 'info' {
  switch (statusId) {
    case 'awaitingCheckIns':
      return 'warning'
    case 'pointsAwarded':
      return 'success'
    case 'partlyAwarded':
      return 'info'
  }
}

export function EventsPointsStatusBadge({
  statusId,
  children,
}: EventsPointsStatusBadgeProps) {
  return (
    <StatusBadge
      status={statusForPointsStatusId(statusId)}
      className="rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap"
    >
      {children}
    </StatusBadge>
  )
}
