import { cn } from '@/lib/utils'
import type { RecentExportTone } from '@/features/reports/types/reports.types'

const toneClassNames: Record<RecentExportTone, string> = {
  info: 'bg-info/15 text-info',
  danger: 'bg-destructive/10 text-destructive',
  success: 'bg-success/15 text-success',
}

type ReportsFileTileProps = {
  type: string
  tone: RecentExportTone
  size?: 'sm' | 'lg'
  className?: string
}

export function ReportsFileTile({
  type,
  tone,
  size = 'sm',
  className,
}: ReportsFileTileProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tracking-wide uppercase',
        size === 'lg' ? 'size-[52px] text-xs' : 'size-10',
        toneClassNames[tone],
        className,
      )}
      aria-hidden="true"
    >
      {type}
    </span>
  )
}
