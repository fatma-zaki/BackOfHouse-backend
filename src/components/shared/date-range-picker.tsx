import { format } from 'date-fns'
import { ar as dateFnsAr } from 'date-fns/locale/ar'
import { enUS as dateFnsEnUS } from 'date-fns/locale/en-US'
import { CalendarIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import type { DateRange, Matcher } from 'react-day-picker'
import { ar as dayPickerAr, enUS as dayPickerEnUS } from 'react-day-picker/locale'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type { DateRange }

export type DateRangePickerProps = {
  /** Selected range. Empty / cleared when `undefined` or missing `from`. */
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Optional classes merged onto the trigger button. */
  triggerClassName?: string
  /**
   * Optional custom label for the selected range.
   * Return `null` to fall back to the default locale formatting.
   */
  formatValue?: (range: DateRange) => string | null
  /** Accessible name for the trigger control. */
  label?: string
  minDate?: Date
  maxDate?: Date
  id?: string
}

function hasCompleteRange(range: DateRange | undefined): boolean {
  return Boolean(range?.from && range.to)
}

function hasAnySelection(range: DateRange | undefined): boolean {
  return Boolean(range?.from)
}

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  triggerClassName,
  formatValue,
  label,
  minDate,
  maxDate,
  id: idProp,
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation()
  const generatedId = useId()
  const triggerId = idProp ?? generatedId
  const [open, setOpen] = useState(false)

  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const dayPickerLocale = isArabic ? dayPickerAr : dayPickerEnUS
  const dateFnsLocale = isArabic ? dateFnsAr : dateFnsEnUS

  const resolvedLabel = label ?? t('dateRange.label')
  const resolvedPlaceholder = placeholder ?? t('dateRange.placeholder')

  const disabledMatchers = useMemo(() => {
    const matchers: Matcher[] = []
    if (minDate) matchers.push({ before: minDate })
    if (maxDate) matchers.push({ after: maxDate })
    return matchers
  }, [minDate, maxDate])

  const displayValue = useMemo(() => {
    if (!value?.from) return null
    if (formatValue) {
      const custom = formatValue(value)
      if (custom != null) return custom
    }
    if (!value.to) {
      return format(value.from, 'PP', { locale: dateFnsLocale })
    }
    return `${format(value.from, 'PP', { locale: dateFnsLocale })} – ${format(value.to, 'PP', { locale: dateFnsLocale })}`
  }, [value, dateFnsLocale, formatValue])

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) return
    setOpen(nextOpen)
  }

  const handleSelect = (range: DateRange | undefined) => {
    onChange(range)
    if (hasCompleteRange(range)) {
      setOpen(false)
    }
  }

  const handleClear = () => {
    onChange(undefined)
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={triggerId} className="sr-only">
        {resolvedLabel}
      </label>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={
              displayValue
                ? `${resolvedLabel}: ${displayValue}`
                : resolvedLabel
            }
            className={cn(
              'h-8 w-full min-w-40 justify-start gap-2 px-2.5 font-normal',
              !displayValue && 'text-muted-foreground',
              triggerClassName,
            )}
          >
            <CalendarIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">
              {displayValue ?? resolvedPlaceholder}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-auto max-w-[calc(100vw-2rem)] p-0"
        >
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={value}
            onSelect={handleSelect}
            locale={dayPickerLocale}
            disabled={
              disabledMatchers.length > 0 ? disabledMatchers : undefined
            }
            defaultMonth={value?.from ?? minDate}
          />

          {hasAnySelection(value) ? (
            <div className="flex justify-end border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
              >
                {t('dateRange.clear')}
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}
