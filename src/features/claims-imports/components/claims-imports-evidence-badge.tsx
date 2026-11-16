import type { ReactNode } from 'react'
import {
  StatusBadge,
  type StatusBadgeStatus,
} from '@/components/shared/status-badge'
import type { ClaimEvidenceId } from '@/features/claims-imports/types/claims-imports.types'

const evidenceStatus: Record<ClaimEvidenceId, StatusBadgeStatus> = {
  domainMatches: 'success',
  needsDocuments: 'warning',
  approved: 'neutral',
  rejected: 'destructive',
}

type ClaimsImportsEvidenceBadgeProps = {
  evidenceId: ClaimEvidenceId
  children: ReactNode
  className?: string
}

export function ClaimsImportsEvidenceBadge({
  evidenceId,
  children,
  className,
}: ClaimsImportsEvidenceBadgeProps) {
  return (
    <StatusBadge
      status={evidenceStatus[evidenceId]}
      className={className}
    >
      {children}
    </StatusBadge>
  )
}
