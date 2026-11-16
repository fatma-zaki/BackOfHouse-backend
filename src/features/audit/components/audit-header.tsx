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
import type { AuditDateRange } from '@/features/audit/types/audit.types'

type AuditHeaderProps = {
  range: AuditDateRange
  onRangeChange: (range: AuditDateRange) => void
}

function formatAuditRangeLabel(
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

export function AuditHeader({ range, onRangeChange }: AuditHeaderProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.resolvedLanguage?.startsWith('ar') ?? false
  const dateFnsLocale = isArabic ? dateFnsAr : dateFnsEnUS

  const pickerValue: DateRange = {
    from: range.from,
    to: range.to,
  }

  return (
    <PageHeader
      title={t('audit.title')}
      description={t('audit.description')}
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
              formatAuditRangeLabel(selected, dateFnsLocale)
            }
            className="w-auto shrink-0"
            triggerClassName="h-9 min-w-0 rounded-full border-border bg-card px-4 font-medium text-foreground shadow-none hover:bg-card"
          />

          <Button
            type="button"
            variant="outline"
            disabled
            aria-disabled="true"
            title={t('audit.actions.exportDisabledHint')}
            className="h-9 rounded-full border-primary bg-transparent px-4 font-medium text-primary shadow-none hover:bg-transparent hover:text-primary disabled:pointer-events-none disabled:opacity-100"
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            {t('audit.actions.exportLog')}
          </Button>
        </div>
      }
    />
  )
}
