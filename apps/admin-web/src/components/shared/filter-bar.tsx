import { useId, type ChangeEventHandler, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DateRangePicker,
  type DateRange,
} from '@/components/shared/date-range-picker'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type FilterBarSearchConfig = {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  label?: string
}

export type FilterBarSelectOption = {
  value: string
  label: string
}

export type FilterBarSelectFilter = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly FilterBarSelectOption[]
  placeholder?: string
}

export type FilterBarDateRangeConfig = {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  label?: string
  minDate?: Date
  maxDate?: Date
}

export type FilterBarProps = {
  search?: FilterBarSearchConfig
  filters?: readonly FilterBarSelectFilter[]
  dateRange?: FilterBarDateRangeConfig
  /** Invoked when the clear control is pressed. Parent owns reset behavior. */
  onClear?: () => void
  clearLabel?: string
  actions?: ReactNode
  disabled?: boolean
  className?: string
}

function FilterSelect({
  filter,
  disabled,
}: {
  filter: FilterBarSelectFilter
  disabled: boolean
}) {
  const generatedId = useId()
  const triggerId = `${generatedId}-${filter.id}`

  return (
    <div className="flex min-w-36 flex-1 basis-36 flex-col gap-1.5 sm:flex-none">
      <label
        htmlFor={triggerId}
        className="text-xs font-medium text-muted-foreground"
      >
        {filter.label}
      </label>
      <Select
        value={filter.value}
        onValueChange={filter.onChange}
        disabled={disabled}
      >
        <SelectTrigger id={triggerId} className="w-full min-w-36">
          <SelectValue placeholder={filter.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filter.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function FilterBar({
  search,
  filters,
  dateRange,
  onClear,
  clearLabel,
  actions,
  disabled = false,
  className,
}: FilterBarProps) {
  const { t } = useTranslation()

  const selectFilters = filters?.length ? filters : null
  const hasContent = Boolean(
    search || selectFilters || dateRange || onClear || actions,
  )

  if (!hasContent) {
    return null
  }

  return (
    <section
      aria-label={t('filters.label')}
      className={cn('flex flex-col gap-3', className)}
    >
      <div className="flex flex-wrap items-end gap-2">
        {search ? (
          <SearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
            label={search.label}
            disabled={disabled}
            className="min-w-48 flex-1 basis-48"
          />
        ) : null}

        {selectFilters
          ? selectFilters.map((filter) => (
              <FilterSelect
                key={filter.id}
                filter={filter}
                disabled={disabled}
              />
            ))
          : null}

        {dateRange ? (
          <DateRangePicker
            value={dateRange.value}
            onChange={dateRange.onChange}
            placeholder={dateRange.placeholder}
            label={dateRange.label}
            minDate={dateRange.minDate}
            maxDate={dateRange.maxDate}
            disabled={disabled}
            className="min-w-48 flex-1 basis-48 sm:flex-none"
          />
        ) : null}

        {onClear ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={onClear}
            className="shrink-0"
          >
            {clearLabel ?? t('filters.clear')}
          </Button>
        ) : null}

        {actions ? (
          <div
            className={cn(
              'ms-auto flex shrink-0 flex-wrap items-center gap-2',
              disabled && 'pointer-events-none opacity-50',
            )}
            aria-disabled={disabled || undefined}
            inert={disabled || undefined}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  )
}
