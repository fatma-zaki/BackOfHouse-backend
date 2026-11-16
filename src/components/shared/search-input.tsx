import { Search } from 'lucide-react'
import { useId, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type SearchInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'value' | 'onChange'
> & {
  value: string
  onChange: NonNullable<ComponentProps<typeof Input>['onChange']>
  /** Accessible label. Defaults to the shared search translation. */
  label?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  disabled,
  label,
  className,
  id: idProp,
  ...props
}: SearchInputProps) {
  const { t } = useTranslation()
  const generatedId = useId()
  const id = idProp ?? generatedId
  const resolvedLabel = label ?? t('actions.search')
  const resolvedPlaceholder = placeholder ?? t('actions.search')

  return (
    <div className={cn('relative w-full', className)}>
      <label htmlFor={id} className="sr-only">
        {resolvedLabel}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        className="ps-8"
        {...props}
      />
    </div>
  )
}
