import { useTranslation } from 'react-i18next'
import {
  StatusBadge,
  type StatusBadgeStatus,
} from '@/components/shared/status-badge'
import type { BroadcastStatusId } from '@/features/broadcasts/types/broadcasts.types'

const STATUS_MAP: Record<BroadcastStatusId, StatusBadgeStatus> = {
  scheduled: 'info',
  sent: 'success',
  draft: 'neutral',
}

type BroadcastsStatusBadgeProps = {
  statusId: BroadcastStatusId
}

export function BroadcastsStatusBadge({ statusId }: BroadcastsStatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <StatusBadge
      status={STATUS_MAP[statusId]}
      className="h-6 rounded-full px-2.5 text-[11px] font-bold"
    >
      {t(`broadcasts.statuses.${statusId}`)}
    </StatusBadge>
  )
}
