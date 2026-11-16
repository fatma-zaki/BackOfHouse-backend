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
  USERS_TAB_IDS,
  type UserJoinedFilter,
  type UsersTabCounts,
  type UsersTabId,
  type UserStudentsFilter,
  type UserVerificationFilter,
} from '@/features/users/types/users.types'

type FilterMenuProps = {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  inactiveValue?: string
}

function FilterMenu({
  label,
  value,
  options,
  onChange,
  inactiveValue = 'all',
}: FilterMenuProps) {
  const selected = options.find((option) => option.value === value)
  const isActive = value !== inactiveValue

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

type UsersToolbarProps = {
  tab: UsersTabId
  onTabChange: (tab: UsersTabId) => void
  tabCounts: UsersTabCounts
  cityId: string
  onCityChange: (value: string) => void
  cityOptions: readonly { value: string; label: string }[]
  verified: UserVerificationFilter
  onVerifiedChange: (value: UserVerificationFilter) => void
  students: UserStudentsFilter
  onStudentsChange: (value: UserStudentsFilter) => void
  joined: UserJoinedFilter
  onJoinedChange: (value: UserJoinedFilter) => void
}

export function UsersToolbar({
  tab,
  onTabChange,
  tabCounts,
  cityId,
  onCityChange,
  cityOptions,
  verified,
  onVerifiedChange,
  students,
  onStudentsChange,
  joined,
  onJoinedChange,
}: UsersToolbarProps) {
  const { t } = useTranslation()

  const verifiedOptions = [
    { value: 'all', label: t('users.filters.verified') },
    { value: 'verified', label: t('users.filters.verifiedYes') },
    { value: 'notVerified', label: t('users.filters.verifiedNo') },
  ] as const

  const studentsOptions = [
    { value: 'all', label: t('users.filters.students') },
    { value: 'students', label: t('users.filters.studentsOnly') },
    { value: 'nonStudents', label: t('users.filters.nonStudents') },
  ] as const

  const joinedOptions = [
    { value: 'all', label: t('users.filters.joined') },
    { value: 'last30', label: t('users.filters.joinedLast30') },
    { value: 'last90', label: t('users.filters.joinedLast90') },
    { value: 'lastYear', label: t('users.filters.joinedLastYear') },
  ] as const

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="tablist"
        aria-label={t('users.tabs.label')}
        className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[22px] bg-primary/10 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {USERS_TAB_IDS.map((tabId) => {
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
              {t(`users.tabs.${tabId}`, { count: tabCounts[tabId] })}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterMenu
          label={t('users.filters.city')}
          value={cityId}
          options={cityOptions}
          onChange={onCityChange}
        />
        <FilterMenu
          label={t('users.filters.verified')}
          value={verified}
          options={[...verifiedOptions]}
          onChange={(value) => onVerifiedChange(value as UserVerificationFilter)}
        />
        <FilterMenu
          label={t('users.filters.students')}
          value={students}
          options={[...studentsOptions]}
          onChange={(value) => onStudentsChange(value as UserStudentsFilter)}
        />
        <FilterMenu
          label={t('users.filters.joined')}
          value={joined}
          options={[...joinedOptions]}
          onChange={(value) => onJoinedChange(value as UserJoinedFilter)}
        />
      </div>
    </div>
  )
}
