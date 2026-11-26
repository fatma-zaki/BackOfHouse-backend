/**
 * Feature-local Reports & exports contracts.
 * Not a backend DTO — replace when a real API contract exists.
 */

export type ReportsDateRange = {
  from: Date
  to: Date
}

export type ReportsDateRangeKey = {
  from: string
  to: string
}

export type ReportModuleId =
  | 'people'
  | 'marketplace'
  | 'content'
  | 'trustSupport'
  | 'system'

export type ReportId =
  | 'usersMembers'
  | 'companies'
  | 'listings'
  | 'applications'
  | 'supplierRequests'
  | 'eventsAttendance'
  | 'pointsLedger'
  | 'verificationDecisions'
  | 'moderationReports'
  | 'supportTickets'
  | 'auditLog'

export type ReportDefinition = {
  id: ReportId
  module: ReportModuleId
  rows: string
}

export type ExportFormat = 'CSV' | 'Excel' | 'PDF'

export type ExportFormatTab = 'csv' | 'xlsx' | 'pdf'

export type ExportColumnId =
  | 'applicant'
  | 'listing'
  | 'company'
  | 'status'
  | 'appliedOn'
  | 'city'
  | 'email'
  | 'phone'

export type ExportFilterFieldId =
  | 'dataSet'
  | 'dateRange'
  | 'city'
  | 'listingType'

export type ExportFilterField = {
  id: ExportFilterFieldId
  options: readonly string[]
  defaultValue: string
}

export type RecentExportTone = 'info' | 'danger' | 'success'

export type RecentExportAction = 'download' | 'edit'

export type RecentExportItem = {
  id: string
  type: 'CSV' | 'XLSX' | 'PDF'
  tone: RecentExportTone
  titleKey: string
  metaKey: string
  metaParams?: Record<string, string | number>
  action: RecentExportAction
  /** Dataset id used for sample CSV when action is download. */
  sampleReportId?: ReportId
}

export type ExportRequest = {
  titleKey: string
  format: ExportFormat
  rows: string
  columnsLabel: string
  filtersLabel: string
  sampleReportId: ReportId
}

export type ReportsDashboardData = {
  range: ReportsDateRangeKey
  catalog: ReportDefinition[]
  recent: RecentExportItem[]
  exportFilters: ExportFilterField[]
  standardColumns: ExportColumnId[]
  contactColumns: ExportColumnId[]
  schedules: readonly string[]
  /** Demo: Super-admin can include email/phone columns. */
  canExportContacts: boolean
}

export type GetReportsDashboardParams = {
  range: ReportsDateRange
}
