import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type SettingsEditableChipsProps = {
  labelKey: string
  items: readonly string[]
  onChange: (items: string[]) => void
}

function itemLabel(
  t: (key: string, options?: { defaultValue?: string }) => string,
  labelKey: string,
  item: string,
): string {
  return t(`settings.categories.items.${labelKey}.${item}`, {
    defaultValue: item,
  })
}

export function SettingsEditableChips({
  labelKey,
  items,
  onChange,
}: SettingsEditableChipsProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)

  const groupLabel = t(`settings.categories.groups.${labelKey}`)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-muted-foreground">
        <span>{groupLabel}</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0 text-xs font-bold text-primary"
            >
              {t('settings.categories.add')}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[260px] p-1">
            <form
              className="flex gap-1.5 p-1"
              onSubmit={(event) => {
                event.preventDefault()
                const value = draft.trim()
                if (value && !items.includes(value)) {
                  onChange([...items, value])
                }
                setDraft('')
                setOpen(false)
              }}
            >
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={groupLabel}
                autoFocus
                className="h-8"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 shrink-0"
                disabled={!draft.trim()}
              >
                {t('settings.categories.addSubmit')}
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const label = itemLabel(t, labelKey, item)
          return (
            <li
              key={item}
              className="inline-flex h-[26px] items-center gap-0.5 rounded-[13px] bg-primary/10 pe-1 ps-2.5 text-xs font-bold text-primary"
            >
              <span>{label}</span>
              <button
                type="button"
                aria-label={t('settings.categories.removeItem', {
                  item: label,
                })}
                className="flex size-[18px] items-center justify-center rounded-full text-inherit opacity-60 hover:bg-background hover:opacity-100"
                onClick={() => onChange(items.filter((value) => value !== item))}
              >
                <X className="size-2.5" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
