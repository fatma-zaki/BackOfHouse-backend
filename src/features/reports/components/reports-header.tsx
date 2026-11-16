import { format } from 'date-fns'
import { ar as dateFnsAr } from 'date-fns/locale/ar'
import { enUS as dateFnsEnUS } from 'date-fns/locale/en-US'
import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DateRangePicker,
  type DateRange,
} from '@/components/shared/date-range-picker'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ReportsFileTile } from '@/features/reports/components/reports-file-tile'
import type {
  RecentExportItem,
  ReportsDateRange,
} from '@/features/reports/types/reports.types'

type ReportsHeaderProps = {
  range: ReportsDateRange
  onRangeChange: (range: ReportsDateRange) => void
  scheduled: readonly RecentExportItem[]
}

function formatReportsRangeLabel(
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

export function ReportsHeader({
  range,
  onRangeChange,
  scheduled,
}: ReportsHeaderProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const dateFnsLocale = isArabic ? dateFnsAr : dateFnsEnUS

  const pickerValue: DateRange = {
    from: range.from,
    to: range.to,
  }

  return (
    <PageHeader
      title={t('reports.title')}
      description={t('reports.description')}
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
              formatReportsRangeLabel(selected, dateFnsLocale)
            }
            className="w-auto shrink-0"
            triggerClassName="h-9 min-w-0 rounded-full border-border bg-card px-4 font-medium text-foreground shadow-none hover:bg-card"
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full border-primary bg-transparent px-4 font-medium text-primary shadow-none hover:bg-primary/5 hover:text-primary"
              >
                <CalendarClock data-icon="inline-start" aria-hidden="true" />
                {t('reports.actions.scheduledExports', {
                  count: scheduled.length,
                })}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-2">
              {scheduled.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  {t('reports.scheduled.empty')}
                </p>
              ) : (
                <ul className="flex flex-col">
                  {scheduled.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg px-2 py-2.5"
                    >
                      <ReportsFileTile type={item.type} tone={item.tone} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {t(`reports.recent.titles.${item.titleKey}`)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(`reports.recent.meta.${item.metaKey}`, item.metaParams)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>
        </div>
      }
    />
  )
}
