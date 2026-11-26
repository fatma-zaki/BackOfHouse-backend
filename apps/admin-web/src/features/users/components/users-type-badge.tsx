import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserTypeId } from '@/features/users/types/users.types'

const typeToneClassNames: Record<UserTypeId, string> = {
  individual: 'border-transparent bg-primary/10 text-primary',
  company: 'border-transparent bg-info/10 text-info',
  student: 'border-transparent bg-success/10 text-success',
}

type UsersTypeBadgeProps = {
  typeId: UserTypeId
  children: React.ReactNode
  className?: string
}

export function UsersTypeBadge({
  typeId,
  children,
  className,
}: UsersTypeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-md px-1.5 py-0 text-[10px] font-bold tracking-wide uppercase',
        typeToneClassNames[typeId],
        className,
      )}
    >
      {children}
    </Badge>
  )
}
