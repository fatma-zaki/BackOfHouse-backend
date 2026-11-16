import type { ReactNode } from 'react'
import {
  StatusBadge,
  type StatusBadgeStatus,
} from '@/components/shared/status-badge'
import type { CompanyVerificationStatusId } from '@/features/companies/types/companies.types'

const statusMap: Record<CompanyVerificationStatusId, StatusBadgeStatus> = {
  verified: 'success',
  pending: 'warning',
  notVerified: 'neutral',
  suspended: 'destructive',
}

type CompaniesStatusBadgeProps = {
  verificationStatusId: CompanyVerificationStatusId
  children: ReactNode
  className?: string
}

export function CompaniesStatusBadge({
  verificationStatusId,
  children,
  className,
}: CompaniesStatusBadgeProps) {
  return (
    <StatusBadge
      status={statusMap[verificationStatusId]}
      className={className}
    >
      {children}
    </StatusBadge>
  )
}
