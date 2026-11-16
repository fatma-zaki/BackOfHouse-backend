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
  SUPPLIER_REQUESTS_TAB_IDS,
  type SupplierRequestsTabId,
} from '@/features/supplier-requests/types/supplier-requests.types'

type FilterMenuProps = {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
}

function FilterMenu({ label, value, options, onChange }: FilterMenuProps) {
  const isActive = value !== 'all'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-8 rounded-full border-border bg-card px-3.5 text-xs font-bold text-muted-foreground shadow-none',
            isActive &&
              'border-primary/40 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
          )}
        >
          {label}
          <ChevronDown
            data-icon="inline-end"
            className="size-3.5 opacity-70"
            aria-hidden="true"
          />
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

type SupplierRequestsToolbarProps = {
  tab: SupplierRequestsTabId
  onTabChange: (tab: SupplierRequestsTabId) => void
  tabCounts: Record<SupplierRequestsTabId, number>
  categoryId: string
  onCategoryChange: (value: string) => void
  categoryOptions: readonly { value: string; label: string }[]
  cityId: string
  onCityChange: (value: string) => void
  cityOptions: readonly { value: string; label: string }[]
}

export function SupplierRequestsToolbar({
  tab,
  onTabChange,
  tabCounts,
  categoryId,
  onCategoryChange,
  categoryOptions,
  cityId,
  onCityChange,
  cityOptions,
}: SupplierRequestsToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="tablist"
        aria-label={t('supplierRequests.tabs.label')}
        className="flex max-w-full items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SUPPLIER_REQUESTS_TAB_IDS.map((tabId) => {
          const selected = tab === tabId
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tabId)}
              className={cn(
                'h-8 shrink-0 rounded-full border px-3.5 text-xs font-bold whitespace-nowrap transition-colors',
                selected
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`supplierRequests.tabs.${tabId}`, { count: tabCounts[tabId] })}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          label={t('supplierRequests.filters.category')}
          value={categoryId}
          options={categoryOptions}
          onChange={onCategoryChange}
        />
        <FilterMenu
          label={t('supplierRequests.filters.city')}
          value={cityId}
          options={cityOptions}
          onChange={onCityChange}
        />
      </div>
    </div>
  )
}
