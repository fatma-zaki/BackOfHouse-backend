import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  APPLICATIONS_TAB_IDS,
  type ApplicationsTabId,
} from '@/features/applications/types/applications.types'

type FilterMenuProps = {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}

function FilterMenu({ label, value, options, onChange }: FilterMenuProps) {
  const selected = options.find((option) => option.value === value)
  const isActive = value !== 'all'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-8 rounded-full border-border bg-card px-3 text-xs font-bold shadow-none',
            isActive &&
              'border-primary/40 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
          )}
        >
          {selected?.label ?? label}
          <ChevronDown data-icon="inline-end" className="size-3" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={cn(
              'text-[13px] font-bold',
              option.value === value && 'text-primary',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type ApplicationsToolbarProps = {
  tab: ApplicationsTabId
  onTabChange: (tab: ApplicationsTabId) => void
  listingTypeId: string
  onListingTypeChange: (value: string) => void
  listingTypeOptions: readonly { value: string; label: string }[]
  companyKey: string
  onCompanyChange: (value: string) => void
  companyOptions: readonly { value: string; label: string }[]
  cityId: string
  onCityChange: (value: string) => void
  cityOptions: readonly { value: string; label: string }[]
}

export function ApplicationsToolbar({
  tab,
  onTabChange,
  listingTypeId,
  onListingTypeChange,
  listingTypeOptions,
  companyKey,
  onCompanyChange,
  companyOptions,
  cityId,
  onCityChange,
  cityOptions,
}: ApplicationsToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="tablist"
        aria-label={t('applications.tabs.label')}
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[22px] bg-primary/10 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {APPLICATIONS_TAB_IDS.map((tabId) => {
          const selected = tab === tabId
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tabId)}
              className={cn(
                'h-8 shrink-0 rounded-2xl px-3.5 text-xs font-bold whitespace-nowrap transition-colors',
                selected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`applications.tabs.${tabId}`)}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterMenu
          label={t('applications.filters.listingType')}
          value={listingTypeId}
          options={listingTypeOptions}
          onChange={onListingTypeChange}
        />
        <FilterMenu
          label={t('applications.filters.company')}
          value={companyKey}
          options={companyOptions}
          onChange={onCompanyChange}
        />
        <FilterMenu
          label={t('applications.filters.city')}
          value={cityId}
          options={cityOptions}
          onChange={onCityChange}
        />
      </div>
    </div>
  )
}
