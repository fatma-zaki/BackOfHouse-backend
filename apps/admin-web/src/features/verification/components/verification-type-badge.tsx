import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import type { VerificationApplicantTypeId } from '@/features/verification/types/verification.types'

const typeStatus: Record<
  VerificationApplicantTypeId,
  'info' | 'success' | 'neutral'
> = {
  company: 'info',
  pro: 'info',
  student: 'success',
}

type VerificationTypeBadgeProps = {
  typeId: VerificationApplicantTypeId
  children: React.ReactNode
  className?: string
}

export function VerificationTypeBadge({
  typeId,
  children,
  className,
}: VerificationTypeBadgeProps) {
  return (
    <StatusBadge
      status={typeStatus[typeId]}
      className={cn(
        'rounded-md px-1.5 py-0 text-[10px] font-bold tracking-wide uppercase',
        typeId === 'pro' && 'bg-primary/10 text-primary',
        typeId === 'company' && 'bg-primary/10 text-primary',
        className,
      )}
    >
      {children}
    </StatusBadge>
  )
}
