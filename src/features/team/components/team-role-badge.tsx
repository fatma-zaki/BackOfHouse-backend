import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TeamRoleId } from '@/features/team/types/team.types'

const roleToneClassNames: Record<TeamRoleId, string> = {
  superAdmin: 'border-transparent bg-primary/10 text-primary',
  reviewer: 'border-transparent bg-info/10 text-info',
  editor: 'border-transparent bg-success/10 text-success',
  support: 'border-transparent bg-warning/15 text-warning',
  analyst: 'border-transparent bg-muted text-muted-foreground',
}

type TeamRoleBadgeProps = {
  roleId: TeamRoleId
  children: ReactNode
  className?: string
}

export function TeamRoleBadge({
  roleId,
  children,
  className,
}: TeamRoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 rounded-full px-2 py-0 text-[10px] font-bold',
        roleToneClassNames[roleId],
        className,
      )}
    >
      {children}
    </Badge>
  )
}
