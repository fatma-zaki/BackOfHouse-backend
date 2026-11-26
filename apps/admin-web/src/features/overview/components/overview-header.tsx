import { format } from 'date-fns'
import { ar as dateFnsAr } from 'date-fns/locale/ar'
import { enUS as dateFnsEnUS } from 'date-fns/locale/en-US'
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DateRangePicker,
  type DateRange,
} from '@/components/shared/date-range-picker'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { OverviewDateRange } from '@/features/overview/types/overview.types'

type GreetingDaypart = 'morning' | 'afternoon' | 'evening' | 'night'

type OverviewHeaderProps = {
  range: OverviewDateRange
  onRangeChange: (range: OverviewDateRange) => void
}

function resolveGreetingDaypart(date: Date): GreetingDaypart {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

/**
 * Demo display name source:
 * Mock auth only stores email (no displayName). Reuse `header.userName`.
 * First token matches the Overview reference (“Nora”).
 */
function resolveDemoDisplayName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return fullName
  return trimmed.split(/\s+/)[0] ?? trimmed
}

/** Compact label matching the Overview reference: “Sep 1 – 28, 2026”. */
function formatOverviewRangeLabel(
  range: DateRange,
  locale: typeof dateFnsEnUS,
): string | null {
  if (!range.from || !range.to) return null

  const sameMonth =
    range.from.getFullYear() === range.to.getFullYear() &&
    range.from.getMonth() === range.to.getMonth()

  if (sameMonth) {
    return `${format(range.from, 'MMM d', { locale })} – ${format(range.to, 'd, yyyy', { locale })}`
  }

  const sameYear = range.from.getFullYear() === range.to.getFullYear()
  if (sameYear) {
    return `${format(range.from, 'MMM d', { locale })} – ${format(range.to, 'MMM d, yyyy', { locale })}`
  }

  return `${format(range.from, 'MMM d, yyyy', { locale })} – ${format(range.to, 'MMM d, yyyy', { locale })}`
}

export function OverviewHeader({ range, onRangeChange }: OverviewHeaderProps) {
  const { t, i18n } = useTranslation()
  const [daypart] = useState(() => resolveGreetingDaypart(new Date()))
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const dateFnsLocale = isArabic ? dateFnsAr : dateFnsEnUS

  const greeting = useMemo(() => {
    const displayName = resolveDemoDisplayName(t('header.userName'))
    return t(`overview.greeting.${daypart}`, { name: displayName })
  }, [daypart, t])

  const pickerValue: DateRange = {
    from: range.from,
    to: range.to,
  }

  return (
    <PageHeader
      title={greeting}
      description={t('overview.description')}
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker
            value={pickerValue}
            onChange={(next) => {
              if (next?.from && next.to) {
                onRangeChange({ from: next.from, to: next.to })
              }
            }}
            label={t('dateRange.label')}
            formatValue={(selected) =>
              formatOverviewRangeLabel(selected, dateFnsLocale)
            }
            className="w-auto shrink-0"
            triggerClassName="h-9 min-w-0 rounded-full border-border bg-card px-4 font-medium text-foreground shadow-none hover:bg-card"
          />

          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            title={t('overview.actions.exportDisabledHint')}
            className="h-9 rounded-full border-primary bg-transparent px-4 font-medium text-primary shadow-none hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-100"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            {t('overview.actions.exportReport')}
          </Button>
        </div>
      }
    />
  )
}
