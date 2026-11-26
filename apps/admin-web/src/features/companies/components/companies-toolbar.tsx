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
  COMPANIES_TAB_IDS,
  type CompaniesSortId,
  type CompaniesTabId,
} from '@/features/companies/types/companies.types'

type FilterMenuProps = {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  inactiveValues?: readonly string[]
}

function FilterMenu({
  label,
  value,
  options,
  onChange,
  inactiveValues = ['all'],
}: FilterMenuProps) {
  const selected = options.find((option) => option.value === value)
  const isActive = !inactiveValues.includes(value)

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

type CompaniesToolbarProps = {
  tab: CompaniesTabId
  onTabChange: (tab: CompaniesTabId) => void
  pendingVerificationCount: number
  cityId: string
  onCityChange: (value: string) => void
  cityOptions: readonly { value: string; label: string }[]
  industryKey: string
  onIndustryChange: (value: string) => void
  industryOptions: readonly { value: string; label: string }[]
  sort: CompaniesSortId
  onSortChange: (value: CompaniesSortId) => void
  sortOptions: readonly { value: string; label: string }[]
}

export function CompaniesToolbar({
  tab,
  onTabChange,
  pendingVerificationCount,
  cityId,
  onCityChange,
  cityOptions,
  industryKey,
  onIndustryChange,
  industryOptions,
  sort,
  onSortChange,
  sortOptions,
}: CompaniesToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="tablist"
        aria-label={t('companies.tabs.label')}
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[22px] bg-primary/10 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {COMPANIES_TAB_IDS.map((tabId) => {
          const selected = tab === tabId
          const label =
            tabId === 'pendingVerification'
              ? t('companies.tabs.pendingVerification', {
                  count: pendingVerificationCount,
                })
              : t(`companies.tabs.${tabId}`)

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
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterMenu
          label={t('companies.filters.city')}
          value={cityId}
          options={cityOptions}
          onChange={onCityChange}
        />
        <FilterMenu
          label={t('companies.filters.industry')}
          value={industryKey}
          options={industryOptions}
          onChange={onIndustryChange}
        />
        <FilterMenu
          label={t('companies.filters.sort')}
          value={sort}
          options={sortOptions}
          onChange={(value) => onSortChange(value as CompaniesSortId)}
          inactiveValues={['mostActive']}
        />
      </div>
    </div>
  )
}
