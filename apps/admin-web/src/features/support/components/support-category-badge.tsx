import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  SupportCategoryTone,
  SupportTicketCategory,
} from '@/features/support/types/support.types'

const categoryTone: Record<SupportTicketCategory, SupportCategoryTone> = {
  points: 'violet',
  company: 'success',
  verification: 'warning',
  account: 'info',
}

const toneClassNames: Record<SupportCategoryTone, string> = {
  violet: 'border-transparent bg-primary/10 text-primary',
  success: 'border-transparent bg-success/10 text-success',
  warning: 'border-transparent bg-warning/15 text-warning',
  info: 'border-transparent bg-info/10 text-info',
}

type SupportCategoryBadgeProps = {
  category: SupportTicketCategory
  label: string
  className?: string
}

export function SupportCategoryBadge({
  category,
  label,
  className,
}: SupportCategoryBadgeProps) {
  const tone = categoryTone[category]

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-md px-1.5 py-0 text-[10px] font-bold tracking-wide uppercase',
        toneClassNames[tone],
        className,
      )}
    >
      {label}
    </Badge>
  )
}
