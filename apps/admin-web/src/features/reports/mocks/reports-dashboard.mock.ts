/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * Local Reports & exports scaffolding. Values match the product reference for
 * visual development and are NOT production metrics or live export files.
 * ---------------------------------------------------------------------------
 */

import { REPORTS_DEFAULT_RANGE } from '@/features/reports/constants'
import type {
  ExportColumnId,
  ExportFilterField,
  RecentExportItem,
  ReportDefinition,
} from '@/features/reports/types/reports.types'

/** @deprecated Prefer REPORTS_DEFAULT_RANGE from constants. */
export const REPORTS_MOCK_DEFAULT_RANGE = REPORTS_DEFAULT_RANGE


export const REPORTS_MOCK_CATALOG: readonly ReportDefinition[] = [
  {
    id: 'usersMembers',
    module: 'people',
    rows: '18,420',
  },
  { id: 'companies', module: 'people', rows: '1,146' },
  { id: 'listings', module: 'marketplace', rows: '2,904' },
  { id: 'applications', module: 'marketplace', rows: '4,870' },
  { id: 'supplierRequests', module: 'marketplace', rows: '96' },
  { id: 'eventsAttendance', module: 'content', rows: '64' },
  { id: 'pointsLedger', module: 'content', rows: '52,310' },
  { id: 'verificationDecisions', module: 'people', rows: '388' },
  { id: 'moderationReports', module: 'trustSupport', rows: '142' },
  { id: 'supportTickets', module: 'trustSupport', rows: '611' },
  { id: 'auditLog', module: 'system', rows: '9,204' },
]

export const REPORTS_MOCK_EXPORT_FILTERS: readonly ExportFilterField[] = [
  {
    id: 'dataSet',
    defaultValue: 'applications',
    options: ['applications', 'usersMembers', 'companies', 'listings'],
  },
  {
    id: 'dateRange',
    defaultValue: 'sep2026',
    options: ['sep2026'],
  },
  {
    id: 'city',
    defaultValue: 'all',
    options: ['all', 'riyadh', 'jeddah', 'dammam', 'alula'],
  },
  {
    id: 'listingType',
    defaultValue: 'jobsCoop',
    options: ['jobsCoop'],
  },
]

export const REPORTS_MOCK_STANDARD_COLUMNS: readonly ExportColumnId[] = [
  'applicant',
  'listing',
  'company',
  'status',
  'appliedOn',
  'city',
]

export const REPORTS_MOCK_CONTACT_COLUMNS: readonly ExportColumnId[] = [
  'email',
  'phone',
]

export const REPORTS_MOCK_SCHEDULES = [
  'everyDay',
  'sundays',
  'firstOfMonth',
] as const

export const REPORTS_MOCK_RECENT: readonly RecentExportItem[] = [
  {
    id: 'r1',
    type: 'XLSX',
    tone: 'info',
    titleKey: 'applicationsSep',
    metaKey: 'youJustNow',
    metaParams: { rows: '4,870' },
    action: 'download',
    sampleReportId: 'applications',
  },
  {
    id: 'r2',
    type: 'PDF',
    tone: 'danger',
    titleKey: 'monthlyOverview',
    metaKey: 'everyFirst',
    action: 'edit',
  },
  {
    id: 'r3',
    type: 'CSV',
    tone: 'success',
    titleKey: 'pointsWeekly',
    metaKey: 'sundaysFinance',
    action: 'edit',
  },
  {
    id: 'r4',
    type: 'XLSX',
    tone: 'info',
    titleKey: 'usersDaily',
    metaKey: 'everyDayNora',
    action: 'edit',
  },
]

/** Demo treats the signed-in user as Super admin for contact columns. */
export const REPORTS_MOCK_CAN_EXPORT_CONTACTS = true
