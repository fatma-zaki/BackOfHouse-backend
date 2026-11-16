/**
 * Local async adapter over Reports mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { format } from 'date-fns'
import {
  REPORTS_MOCK_CAN_EXPORT_CONTACTS,
  REPORTS_MOCK_CATALOG,
  REPORTS_MOCK_CONTACT_COLUMNS,
  REPORTS_MOCK_EXPORT_FILTERS,
  REPORTS_MOCK_RECENT,
  REPORTS_MOCK_SCHEDULES,
  REPORTS_MOCK_STANDARD_COLUMNS,
} from '@/features/reports/mocks/reports-dashboard.mock'
import type {
  GetReportsDashboardParams,
  ReportsDashboardData,
  ReportsDateRangeKey,
} from '@/features/reports/types/reports.types'

const MOCK_LATENCY_MS = 160

export function toReportsDateRangeKey(range: {
  from: Date
  to: Date
}): ReportsDateRangeKey {
  return {
    from: format(range.from, 'yyyy-MM-dd'),
    to: format(range.to, 'yyyy-MM-dd'),
  }
}

/**
 * Returns a static Reports snapshot.
 * Limitation: catalog row counts and recent items are NOT recomputed for `range`.
 */
export async function getReportsDashboard(
  params: GetReportsDashboardParams,
): Promise<ReportsDashboardData> {
  const rangeKey = toReportsDateRangeKey(params.range)

  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    range: rangeKey,
    catalog: REPORTS_MOCK_CATALOG.map((item) => ({ ...item })),
    recent: REPORTS_MOCK_RECENT.map((item) => ({
      ...item,
      metaParams: item.metaParams ? { ...item.metaParams } : undefined,
    })),
    exportFilters: REPORTS_MOCK_EXPORT_FILTERS.map((field) => ({
      ...field,
      options: [...field.options],
    })),
    standardColumns: [...REPORTS_MOCK_STANDARD_COLUMNS],
    contactColumns: [...REPORTS_MOCK_CONTACT_COLUMNS],
    schedules: REPORTS_MOCK_SCHEDULES,
    canExportContacts: REPORTS_MOCK_CAN_EXPORT_CONTACTS,
  }
}
