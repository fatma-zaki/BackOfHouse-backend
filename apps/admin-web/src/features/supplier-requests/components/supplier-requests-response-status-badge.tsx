import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SupplierResponseStatusId } from '@/features/supplier-requests/types/supplier-requests.types'

const statusClassNames: Record<SupplierResponseStatusId, string> = {
  shortlisted: 'border-transparent bg-primary/15 text-primary',
  new: 'border-transparent bg-muted text-muted-foreground',
  declined: 'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
}

type SupplierRequestsResponseStatusBadgeProps = {
  statusId: SupplierResponseStatusId
  children: ReactNode
  className?: string
}

export function SupplierRequestsResponseStatusBadge({
  statusId,
  children,
  className,
}: SupplierRequestsResponseStatusBadgeProps) {
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
