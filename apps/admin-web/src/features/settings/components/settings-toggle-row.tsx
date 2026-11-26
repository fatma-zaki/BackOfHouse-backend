import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type SettingsToggleRowProps = {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  variant?: 'plain' | 'default'
  onCheckedChange: (checked: boolean) => void
}

export function SettingsToggleRow({
  title,
  description,
  checked,
  disabled = false,
  variant = 'default',
  onCheckedChange,
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 px-4 py-3',
        variant === 'default' && 'border-b border-border last:border-b-0',
        variant === 'plain' && 'border-b border-border last:border-b-0',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs font-medium text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        aria-label={title}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 shrink-0"
      />
    </div>
  )
}
