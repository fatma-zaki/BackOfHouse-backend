import { Check, ChevronDown, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TableSkeleton } from '@/components/shared/table-skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type {
  ExportFormat,
  ReportDefinition,
  ReportModuleId,
} from '@/features/reports/types/reports.types'

const MODULES: readonly (ReportModuleId | 'all')[] = [
  'all',
  'people',
  'marketplace',
  'content',
  'trustSupport',
  'system',
]

const FORMATS: readonly ExportFormat[] = ['CSV', 'Excel', 'PDF']

/** Matches reference DataTable tracks: report · rows · download. */
const CATALOG_GRID =
  'grid min-w-[620px] grid-cols-[minmax(0,1fr)_5rem_14.75rem] items-center'

type ReportsCatalogProps = {
  catalog: readonly ReportDefinition[] | undefined
  isLoading?: boolean
  onDownload: (report: ReportDefinition, format: ExportFormat) => void
}

export function ReportsCatalog({
  catalog,
  isLoading = false,
  onDownload,
}: ReportsCatalogProps) {
  const { t } = useTranslation()
  const [module, setModule] = useState<(typeof MODULES)[number]>('all')

  const rows = useMemo(() => {
    const list = catalog ?? []
    if (module === 'all') return list
    return list.filter((item) => item.module === module)
  }, [catalog, module])

  return (
    <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0 space-y-1">
          <h2 className="font-heading text-[15px] leading-snug font-bold text-foreground">
            {t('reports.catalog.title')}
          </h2>
          <p className="text-xs leading-normal text-muted-foreground">
            {t('reports.catalog.subtitle')}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-8 shrink-0 rounded-full border-border bg-card px-3.5 text-xs font-bold shadow-none hover:bg-card',
                module !== 'all' &&
                  'border-primary/40 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
              )}
              aria-label={t('reports.catalog.moduleFilter')}
            >
              {module === 'all'
                ? t('reports.modules.allTrigger')
                : t('reports.catalog.moduleActive', {
                    value: t(`reports.modules.${module}`),
                  })}
              <ChevronDown data-icon="inline-end" aria-hidden="true" className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[11rem] p-1">
            {MODULES.map((id) => {
              const selected = module === id
              return (
                <DropdownMenuItem
                  key={id}
                  className={cn(
                    'min-h-9 cursor-pointer gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-bold',
                    selected
                      ? 'bg-transparent text-primary focus:bg-muted/60 focus:text-primary'
                      : 'text-foreground',
                  )}
                  onClick={() => setModule(id)}
                >
                  <span className="flex-1">
                    {t(`reports.modules.${id}`)}
                  </span>
                  {selected ? (
                    <Check
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-primary"
                    />
                  ) : (
                    <span className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardContent className="px-0 pt-0 pb-0">
        {isLoading ? (
          <div className="px-0 pb-4">
            <TableSkeleton
              rows={8}
              columns={3}
              dense
              label={t('reports.states.loading')}
            />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {t('reports.catalog.empty')}
          </p>
        ) : (
          <div
            className="overflow-x-auto"
            role="table"
            aria-label={t('reports.catalog.title')}
          >
            <div
              role="row"
              className={cn(
                CATALOG_GRID,
                'border-y border-border bg-muted/40',
              )}
            >
              <div
                role="columnheader"
                className="px-4 py-2.5 text-[11px] font-bold tracking-wide text-muted-foreground"
              >
                {t('reports.catalog.columns.report')}
              </div>
              <div
                role="columnheader"
                className="px-3 py-2.5 text-end text-[11px] font-bold tracking-wide text-muted-foreground"
              >
                {t('reports.catalog.columns.rows')}
              </div>
              <div
                role="columnheader"
                className="px-3 py-2.5 pe-4 text-start text-[11px] font-bold tracking-wide text-muted-foreground"
              >
                {t('reports.catalog.columns.download')}
              </div>
            </div>

            <div role="rowgroup">
              {rows.map((report, index) => (
                <div
                  key={report.id}
                  role="row"
                  className={cn(
                    CATALOG_GRID,
                    'min-h-[52px] transition-colors hover:bg-muted/30',
                    index < rows.length - 1 && 'border-b border-border',
                  )}
                >
                  <div role="cell" className="min-w-0 px-4 py-2.5">
                    <p className="truncate text-[13px] leading-5 font-bold text-foreground">
                      {t(`reports.catalog.items.${report.id}.title`)}
                    </p>
                    <p className="truncate text-xs leading-4 text-muted-foreground">
                      {t(`reports.catalog.items.${report.id}.description`)}
                    </p>
                  </div>

                  <div
                    role="cell"
                    className="px-3 py-2.5 text-end text-[13px] font-bold tabular-nums text-foreground"
                  >
                    {report.rows}
                  </div>

                  <div role="cell" className="px-3 py-2 pe-4">
                    <div className="flex items-center gap-1.5">
                      {FORMATS.map((format) => (
                        <Button
                          key={format}
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-7 gap-1 rounded-full border-primary/40 bg-transparent px-2.5 text-[11px] font-bold text-primary shadow-none hover:bg-primary/5 hover:text-primary"
                          onClick={() => onDownload(report, format)}
                        >
                          <Download
                            data-icon="inline-start"
                            aria-hidden="true"
                            className="size-3.5"
                          />
                          {t(`reports.formatLabels.${format}`)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
