import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SupplierRequestCategoryTone } from '@/features/supplier-requests/types/supplier-requests.types'

const toneClassNames: Record<SupplierRequestCategoryTone, string> = {
  amber:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  violet: 'border-transparent bg-primary/10 text-primary',
  info: 'border-transparent bg-info/10 text-info',
  success: 'border-transparent bg-success/10 text-success',
  warning: 'border-transparent bg-warning/15 text-warning',
  neutral: 'border-border bg-muted text-muted-foreground',
}

type SupplierRequestsCategoryBadgeProps = {
  tone: SupplierRequestCategoryTone
  children: React.ReactNode
  className?: string
  tag?: boolean
}

export function SupplierRequestsCategoryBadge({
  tone,
  children,
  className,
  tag = false,
}: SupplierRequestsCategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full font-bold',
        tag && 'rounded-md px-1.5 py-0 text-[10px] tracking-wide uppercase',
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </Badge>
  )
}
