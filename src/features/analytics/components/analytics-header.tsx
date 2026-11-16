import { format } from 'date-fns'
import { ar as dateFnsAr } from 'date-fns/locale/ar'
import { enUS as dateFnsEnUS } from 'date-fns/locale/en-US'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DateRangePicker,
  type DateRange,
} from '@/components/shared/date-range-picker'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { AnalyticsDateRange } from '@/features/analytics/types/analytics.types'

type AnalyticsHeaderProps = {
  range: AnalyticsDateRange
  onRangeChange: (range: AnalyticsDateRange) => void
}

/** Compact label matching Overview: “Sep 1 – 28, 2026”. */
function formatAnalyticsRangeLabel(
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

export function AnalyticsHeader({
  range,
  onRangeChange,
}: AnalyticsHeaderProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const dateFnsLocale = isArabic ? dateFnsAr : dateFnsEnUS

  const pickerValue: DateRange = {
    from: range.from,
    to: range.to,
  }

  return (
    <PageHeader
      title={t('analytics.title')}
      description={t('analytics.description')}
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
              formatAnalyticsRangeLabel(selected, dateFnsLocale)
            }
            className="w-auto shrink-0"
            triggerClassName="h-9 min-w-0 rounded-full border-border bg-card px-4 font-medium text-foreground shadow-none hover:bg-card"
          />

          <Button
            type="button"
            variant="default"
            disabled
            aria-disabled="true"
            title={t('analytics.actions.exportDisabledHint')}
            className="h-9 rounded-full px-4 font-medium shadow-none disabled:pointer-events-none disabled:opacity-100"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            {t('analytics.actions.exportReport')}
          </Button>
        </div>
      }
    />
  )
}
