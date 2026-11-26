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
import type { ModerationTabId } from '@/features/moderation/types/moderation.types'

const TABS: readonly ModerationTabId[] = ['open', 'autoFlagged', 'resolved']

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

type ModerationToolbarProps = {
  tab: ModerationTabId
  onTabChange: (tab: ModerationTabId) => void
  tabCounts: Record<ModerationTabId, number>
  contentTypeId: string
  onContentTypeChange: (value: string) => void
  contentTypeOptions: readonly { value: string; label: string }[]
  reasonKey: string
  onReasonChange: (value: string) => void
  reasonOptions: readonly { value: string; label: string }[]
}

export function ModerationToolbar({
  tab,
  onTabChange,
  tabCounts,
  contentTypeId,
  onContentTypeChange,
  contentTypeOptions,
  reasonKey,
  onReasonChange,
  reasonOptions,
}: ModerationToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="tablist"
        aria-label={t('moderation.tabs.label')}
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[22px] bg-primary/10 p-1"
      >
        {TABS.map((tabId) => {
          const selected = tab === tabId
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tabId)}
              className={cn(
                'h-8 shrink-0 rounded-2xl px-3 text-xs font-bold whitespace-nowrap transition-colors',
                selected
                  ? 'bg-card text-primary shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`moderation.tabs.${tabId}`, { count: tabCounts[tabId] })}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterMenu
          label={t('moderation.filters.contentType')}
          value={contentTypeId}
          options={contentTypeOptions}
          onChange={onContentTypeChange}
        />
        <FilterMenu
          label={t('moderation.filters.reason')}
          value={reasonKey}
          options={reasonOptions}
          onChange={onReasonChange}
        />
      </div>
    </div>
  )
}
