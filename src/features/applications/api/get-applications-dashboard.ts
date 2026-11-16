/**
 * Local async adapter over Applications mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { APPLICATIONS_MOCK_DASHBOARD } from '@/features/applications/mocks/applications-dashboard.mock'
import type {
  ApplicationsDashboardData,
  ApplicationsDateRangeKey,
} from '@/features/applications/types/applications.types'

const MOCK_LATENCY_MS = 160

export function toApplicationsDateRangeKey(range: {
  from: Date
  to: Date
}): ApplicationsDateRangeKey {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  }
}

export async function getApplicationsDashboard(params: {
  range: { from: Date; to: Date }
}): Promise<ApplicationsDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  const rangeKey = toApplicationsDateRangeKey(params.range)

  return {
    range: rangeKey,
    kpis: APPLICATIONS_MOCK_DASHBOARD.kpis.map((kpi) => ({ ...kpi })),
    applications: APPLICATIONS_MOCK_DASHBOARD.applications.map((row) => ({
      ...row,
    })),
    totalCount: APPLICATIONS_MOCK_DASHBOARD.totalCount,
  }
}
