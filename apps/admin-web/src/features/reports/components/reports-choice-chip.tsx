import { cn } from '@/lib/utils'

type ReportsChoiceChipProps = {
  label: string
  selected: boolean
  locked?: boolean
  lockedNote?: string
  onToggle?: () => void
}

export function ReportsChoiceChip({
  label,
  selected,
  locked = false,
  lockedNote,
  onToggle,
}: ReportsChoiceChipProps) {
  const prefix = locked ? '–' : selected ? '✓' : '+'

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={locked}
      onClick={onToggle}
      className={cn(
        'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-bold transition-colors',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
        locked && 'cursor-not-allowed opacity-75',
      )}
    >
      <span aria-hidden="true">{prefix}</span>
      <span>{label}</span>
      {locked && lockedNote ? (
        <span className="font-medium text-muted-foreground">· {lockedNote}</span>
      ) : null}
    </button>
  )
}
