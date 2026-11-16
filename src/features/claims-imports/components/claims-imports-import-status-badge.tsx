import type { ReactNode } from 'react'
import {
  StatusBadge,
  type StatusBadgeStatus,
} from '@/components/shared/status-badge'
import type { ImportStatusId } from '@/features/claims-imports/types/claims-imports.types'

const importStatusMap: Record<ImportStatusId, StatusBadgeStatus> = {
  processing: 'info',
  doneWithErrors: 'warning',
  done: 'success',
}

type ClaimsImportsImportStatusBadgeProps = {
  statusId: ImportStatusId
  children: ReactNode
  className?: string
}

export function ClaimsImportsImportStatusBadge({
  statusId,
  children,
  className,
}: ClaimsImportsImportStatusBadgeProps) {
  return (
    <StatusBadge status={importStatusMap[statusId]} className={className}>
      {children}
    </StatusBadge>
  )
}
