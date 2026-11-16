import type {
  ExportFormat,
  ExportFormatTab,
} from '@/features/reports/types/reports.types'

export const FORMAT_TAB_TO_FORMAT: Record<ExportFormatTab, ExportFormat> = {
  csv: 'CSV',
  xlsx: 'Excel',
  pdf: 'PDF',
}

export const FORMAT_TO_TILE: Record<
  ExportFormat,
  { type: 'CSV' | 'XLSX' | 'PDF'; tone: 'success' | 'info' | 'danger' }
> = {
  CSV: { type: 'CSV', tone: 'success' },
  Excel: { type: 'XLSX', tone: 'info' },
  PDF: { type: 'PDF', tone: 'danger' },
}

export const FORMAT_TABS: readonly ExportFormatTab[] = [
  'csv',
  'xlsx',
  'pdf',
] as const

/** Map catalog/data-set option ids that are also ReportIds. */
export function isReportId(
  value: string,
): value is
  | 'applications'
  | 'usersMembers'
  | 'companies'
  | 'listings' {
  return (
    value === 'applications' ||
    value === 'usersMembers' ||
    value === 'companies' ||
    value === 'listings'
  )
}
