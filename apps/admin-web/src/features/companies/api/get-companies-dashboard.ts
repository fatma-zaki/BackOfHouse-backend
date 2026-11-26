/**
 * Local async adapter over Companies mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { COMPANIES_MOCK_DASHBOARD } from '@/features/companies/mocks/companies-dashboard.mock'
import type { CompaniesDashboardData } from '@/features/companies/types/companies.types'

const MOCK_LATENCY_MS = 160

export async function getCompaniesDashboard(): Promise<CompaniesDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    kpis: COMPANIES_MOCK_DASHBOARD.kpis.map((kpi) => ({ ...kpi })),
    companies: COMPANIES_MOCK_DASHBOARD.companies.map((row) => ({ ...row })),
    totalCount: COMPANIES_MOCK_DASHBOARD.totalCount,
    pendingVerificationCount:
      COMPANIES_MOCK_DASHBOARD.pendingVerificationCount,
  }
}
