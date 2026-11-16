import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReportsFileTile } from '@/features/reports/components/reports-file-tile'
import { FORMAT_TO_TILE } from '@/features/reports/lib/format-map'
import { downloadCsv } from '@/features/reports/lib/download-csv'
import {
  sampleRowsForReport,
  stripContactColumns,
} from '@/features/reports/lib/sample-rows'
import type { ExportRequest } from '@/features/reports/types/reports.types'

type ReportsExportReadyDialogProps = {
  open: boolean
  request: ExportRequest | null
  canExportContacts: boolean
  onOpenChange: (open: boolean) => void
  onDownloaded: (request: ExportRequest) => void
}

export function ReportsExportReadyDialog({
  open,
  request,
  canExportContacts,
  onOpenChange,
  onDownloaded,
}: ReportsExportReadyDialogProps) {
  const { t } = useTranslation()

  if (!request) return null

  const tile = FORMAT_TO_TILE[request.format]

  const handleDownload = () => {
    let rows = sampleRowsForReport(request.sampleReportId)
    if (!canExportContacts) {
      rows = stripContactColumns(rows)
    }
    downloadCsv(
      `${request.sampleReportId}-sep-2026`,
      rows,
    )
    onDownloaded(request)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        closeLabel={t('reports.exportReady.close')}
      >
        <DialogHeader className="items-center text-center sm:items-center">
          <ReportsFileTile type={tile.type} tone={tile.tone} size="lg" />
          <DialogTitle className="mt-2">
            {t('reports.exportReady.title')}
          </DialogTitle>
          <DialogDescription>
            {t('reports.exportReady.subtitle', {
              title: t(request.titleKey),
              range: request.filtersLabel || t('reports.builder.options.dateRange.sep2026'),
              format: t(`reports.formatLabels.${request.format}`),
            })}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-2 rounded-xl border border-border/80 bg-muted/30 p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t('reports.exportReady.rows')}
            </dt>
            <dd className="font-bold tabular-nums text-foreground">
              {request.rows}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t('reports.exportReady.columns')}
            </dt>
            <dd className="max-w-[60%] text-end font-medium text-foreground">
              {request.columnsLabel}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t('reports.exportReady.filters')}
            </dt>
            <dd className="max-w-[60%] text-end font-medium text-foreground">
              {request.filtersLabel}
            </dd>
          </div>
        </dl>

        {!canExportContacts ? (
          <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {t('reports.exportReady.contactsOmitted')}
          </p>
        ) : null}

        {request.format !== 'CSV' ? (
          <p className="rounded-xl border border-info/20 bg-info/10 px-3 py-2 text-xs text-foreground">
            {t('reports.exportReady.sampleCsvNote')}
          </p>
        ) : null}

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('reports.exportReady.close')}
          </Button>
          <Button type="button" onClick={handleDownload}>
            {t('reports.exportReady.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
