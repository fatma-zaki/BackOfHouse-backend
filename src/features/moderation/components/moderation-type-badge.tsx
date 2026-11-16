import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'
import type { ModerationContentTypeId } from '@/features/moderation/types/moderation.types'

const typeClassNames: Record<ModerationContentTypeId, string> = {
  listing: 'border-transparent bg-primary/10 text-primary',
  profile: 'border-transparent bg-success/10 text-success',
  response: 'border-transparent bg-warning/15 text-warning',
  company: 'border-transparent bg-info/10 text-info',
}

type ModerationTypeBadgeProps = {
  contentTypeId: ModerationContentTypeId
  children: React.ReactNode
  className?: string
}

export function ModerationTypeBadge({
  contentTypeId,
  children,
  className,
}: ModerationTypeBadgeProps) {
  return (
    <StatusBadge
      status="neutral"
      className={cn(
        'rounded-md px-1.5 py-0 text-[10px] font-bold tracking-wide uppercase',
        typeClassNames[contentTypeId],
        className,
      )}
    >
      {children}
    </StatusBadge>
  )
}
