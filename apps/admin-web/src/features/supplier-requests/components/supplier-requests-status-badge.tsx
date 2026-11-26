import type { ReactNode } from 'react'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import type { SupplierRequestRowStatusId } from '@/features/supplier-requests/types/supplier-requests.types'

const statusMap: Record<
  SupplierRequestRowStatusId,
  'success' | 'warning' | 'info' | 'neutral'
> = {
  open: 'success',
  noResponses: 'warning',
  awarded: 'info',
  closed: 'neutral',
}

type SupplierRequestsStatusBadgeProps = {
  statusId: SupplierRequestRowStatusId
  children: ReactNode
  className?: string
}

export function SupplierRequestsStatusBadge({
  statusId,
  children,
  className,
}: SupplierRequestsStatusBadgeProps) {
  return (
    <StatusBadge
      status={statusMap[statusId]}
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
        className,
      )}
    >
      {children}
    </StatusBadge>
  )
}
