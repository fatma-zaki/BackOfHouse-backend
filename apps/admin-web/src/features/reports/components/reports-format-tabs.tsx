import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { FORMAT_TABS } from '@/features/reports/lib/format-map'
import type { ExportFormatTab } from '@/features/reports/types/reports.types'

type ReportsFormatTabsProps = {
  value: ExportFormatTab
  onChange: (tab: ExportFormatTab) => void
}

export function ReportsFormatTabs({ value, onChange }: ReportsFormatTabsProps) {
  const { t } = useTranslation()

  return (
    <div
      role="tablist"
      aria-label={t('reports.builder.formatLabel')}
      className="flex max-w-full items-center gap-1 self-start overflow-x-auto rounded-[22px] bg-primary/10 p-1"
    >
      {FORMAT_TABS.map((tab) => {
        const selected = tab === value
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab)}
            className={cn(
              'h-8 shrink-0 rounded-2xl px-3.5 text-xs font-bold whitespace-nowrap transition-colors',
              selected
                ? 'bg-card text-primary shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`reports.formats.${tab}`)}
          </button>
        )
      })}
    </div>
  )
}
