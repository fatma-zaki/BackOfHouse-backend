import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ErrorState } from '@/components/shared/error-state'
import { ReportsCatalog } from '@/features/reports/components/reports-catalog'
import { ReportsCustomExport } from '@/features/reports/components/reports-custom-export'
import { ReportsExportReadyDialog } from '@/features/reports/components/reports-export-ready-dialog'
import { ReportsHeader } from '@/features/reports/components/reports-header'
import { ReportsRecent } from '@/features/reports/components/reports-recent'
import { useReportsDashboard } from '@/features/reports/hooks/use-reports-dashboard'
import {
  FORMAT_TAB_TO_FORMAT,
  FORMAT_TO_TILE,
  isReportId,
} from '@/features/reports/lib/format-map'
import { REPORTS_DEFAULT_RANGE } from '@/features/reports/constants'
import type {
  ExportColumnId,
  ExportFilterFieldId,
  ExportFormat,
  ExportFormatTab,
  ExportRequest,
  RecentExportItem,
  ReportDefinition,
  ReportsDateRange,
} from '@/features/reports/types/reports.types'

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

const FALLBACK_BUILDER: Record<ExportFilterFieldId, string> = {
  dataSet: 'applications',
  dateRange: 'sep2026',
  city: 'all',
  listingType: 'jobsCoop',
}

const EMPTY_RECENT: RecentExportItem[] = []

export function ReportsDashboard() {
  const { t } = useTranslation()

  const [range, setRange] = useState<ReportsDateRange>(() => ({
    from: REPORTS_DEFAULT_RANGE.from,
    to: REPORTS_DEFAULT_RANGE.to,
  }))

  const { data, isPending, isError, refetch } = useReportsDashboard({ range })

  const [format, setFormat] = useState<ExportFormatTab>('xlsx')
  const [columnOverride, setColumnOverride] = useState<Set<ExportColumnId> | null>(
    null,
  )
  const [builderOverride, setBuilderOverride] = useState<Partial<
    Record<ExportFilterFieldId, string>
  > | null>(null)
  const [recentOverride, setRecentOverride] = useState<RecentExportItem[] | null>(
    null,
  )
  const [exportRequest, setExportRequest] = useState<ExportRequest | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const defaultBuilder = useMemo(() => {
    if (!data) return FALLBACK_BUILDER
    return Object.fromEntries(
      data.exportFilters.map((field) => [field.id, field.defaultValue]),
    ) as Record<ExportFilterFieldId, string>
  }, [data])

  const builder = useMemo(
    () => ({ ...defaultBuilder, ...builderOverride }),
    [defaultBuilder, builderOverride],
  )

  const selectedColumns = useMemo(() => {
    if (columnOverride) return columnOverride
    return new Set(data?.standardColumns ?? [])
  }, [columnOverride, data?.standardColumns])

  const recent = recentOverride ?? data?.recent ?? EMPTY_RECENT

  const displayRecent = useMemo(() => {
    return recent.map((item) => {
      if (item.titleKey.startsWith('scheduled:')) {
        const [, datasetId = 'applications', scheduleId = 'everyDay'] =
          item.titleKey.split(':')
        return {
          ...item,
          titleKey: 'dynamicScheduled',
          metaKey: 'dynamicScheduleMeta',
          metaParams: {
            dataset: t(`reports.builder.options.dataSet.${datasetId}`),
            schedule: t(`reports.schedules.${scheduleId}`),
          },
        }
      }
      if (item.titleKey.startsWith('downloaded:')) {
        const reportId = item.titleKey.split(':')[1] ?? 'applications'
        return {
          ...item,
          titleKey: 'dynamicDownloaded',
          metaKey: 'youJustNow',
          metaParams: {
            rows: item.metaParams?.rows ?? '—',
            dataset: t(`reports.catalog.items.${reportId}.title`),
          },
        }
      }
      return item
    })
  }, [recent, t])

  const scheduled = useMemo(
    () => displayRecent.filter((item) => item.action === 'edit'),
    [displayRecent],
  )

  const openExport = (request: ExportRequest) => {
    setExportRequest(request)
    setExportOpen(true)
  }

  const handleCatalogDownload = (
    report: ReportDefinition,
    chosen: ExportFormat,
  ) => {
    openExport({
      titleKey: `reports.catalog.items.${report.id}.title`,
      format: chosen,
      rows: report.rows,
      columnsLabel: t('reports.exportReady.allColumns'),
      filtersLabel: t(
        `reports.builder.options.dateRange.${builder.dateRange}`,
      ),
      sampleReportId: report.id,
    })
  }

  const handleGenerate = () => {
    if (!data) return
    if (selectedColumns.size === 0) {
      toast.warning(t('reports.toasts.pickColumn'))
      return
    }

    const datasetId = builder.dataSet
    const report = data.catalog.find((item) => item.id === datasetId)
    const columnsLabel = [...selectedColumns]
      .map((id) => t(`reports.builder.columns.${id}`))
      .join(', ')

    openExport({
      titleKey: isReportId(datasetId)
        ? `reports.catalog.items.${datasetId}.title`
        : `reports.builder.options.dataSet.${datasetId}`,
      format: FORMAT_TAB_TO_FORMAT[format],
      rows: report?.rows ?? '—',
      columnsLabel,
      filtersLabel: [
        t(`reports.builder.options.listingType.${builder.listingType}`),
        t(`reports.builder.options.city.${builder.city}`),
      ].join(' · '),
      sampleReportId: isReportId(datasetId) ? datasetId : 'applications',
    })
  }

  const handleSchedule = (scheduleId: string) => {
    const tile = FORMAT_TO_TILE[FORMAT_TAB_TO_FORMAT[format]]
    const datasetId = builder.dataSet
    setRecentOverride([
      {
        id: createId('s'),
        type: tile.type,
        tone: tile.tone,
        titleKey: `scheduled:${datasetId}:${scheduleId}`,
        metaKey: scheduleId,
        action: 'edit',
        sampleReportId: isReportId(datasetId) ? datasetId : 'applications',
      },
      ...recent,
    ])
    toast.success(
      t('reports.toasts.scheduled', {
        title: t(`reports.builder.options.dataSet.${datasetId}`),
      }),
    )
  }

  const handleDownloaded = (done: ExportRequest) => {
    const tile = FORMAT_TO_TILE[done.format]
    setRecentOverride([
      {
        id: createId('d'),
        type: tile.type,
        tone: tile.tone,
        titleKey: `downloaded:${done.sampleReportId}`,
        metaKey: 'youJustNow',
        metaParams: { rows: done.rows },
        action: 'download',
        sampleReportId: done.sampleReportId,
      },
      ...recent,
    ])
  }

  const toggleColumn = (id: ExportColumnId) => {
    setColumnOverride(() => {
      const next = new Set(selectedColumns)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <ReportsHeader
        range={range}
        onRangeChange={setRange}
        scheduled={scheduled}
      />

      {!isPending && isError ? (
        <ErrorState
          title={t('reports.states.errorTitle')}
          description={t('reports.states.errorDescription')}
          onRetry={() => {
            void refetch()
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(20rem,1fr)]">
          <ReportsCatalog
            catalog={data?.catalog}
            isLoading={isPending}
            onDownload={handleCatalogDownload}
          />

          <div className="flex min-w-0 flex-col gap-4">
            <ReportsCustomExport
              isLoading={isPending}
              filters={data?.exportFilters ?? []}
              builder={builder}
              onBuilderChange={(id, value) =>
                setBuilderOverride((prev) => ({ ...prev, [id]: value }))
              }
              standardColumns={data?.standardColumns ?? []}
              contactColumns={data?.contactColumns ?? []}
              selectedColumns={selectedColumns}
              onToggleColumn={toggleColumn}
              canExportContacts={data?.canExportContacts ?? false}
              format={format}
              onFormatChange={setFormat}
              schedules={data?.schedules ?? []}
              onGenerate={handleGenerate}
              onSchedule={handleSchedule}
            />

            <ReportsRecent
              items={displayRecent}
              isLoading={isPending}
              schedules={data?.schedules ?? []}
              onUpdateSchedule={(id, scheduleId) => {
                setRecentOverride(
                  recent.map((item) => {
                    if (item.id !== id) return item
                    if (item.titleKey.startsWith('scheduled:')) {
                      const [, datasetId = 'applications'] =
                        item.titleKey.split(':')
                      return {
                        ...item,
                        titleKey: `scheduled:${datasetId}:${scheduleId}`,
                        metaKey: 'dynamicScheduleMeta',
                        metaParams: {
                          dataset: t(
                            `reports.builder.options.dataSet.${datasetId}`,
                          ),
                          schedule: t(`reports.schedules.${scheduleId}`),
                        },
                      }
                    }
                    return {
                      ...item,
                      metaKey: 'dynamicScheduleMeta',
                      metaParams: {
                        ...item.metaParams,
                        schedule: t(`reports.schedules.${scheduleId}`),
                      },
                    }
                  }),
                )
              }}
              onRemoveSchedule={(id) => {
                setRecentOverride(recent.filter((item) => item.id !== id))
              }}
            />
          </div>
        </div>
      )}

      <ReportsExportReadyDialog
        open={exportOpen}
        request={exportRequest}
        canExportContacts={data?.canExportContacts ?? false}
        onOpenChange={setExportOpen}
        onDownloaded={handleDownloaded}
      />
    </div>
  )
}
