/**
 * Local async adapter over Claims & imports mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { CLAIMS_IMPORTS_MOCK_DASHBOARD } from '@/features/claims-imports/mocks/claims-imports.mock'
import type { ClaimsImportsDashboardData } from '@/features/claims-imports/types/claims-imports.types'

const MOCK_LATENCY_MS = 160

export async function getClaimsImportsDashboard(): Promise<ClaimsImportsDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    claims: CLAIMS_IMPORTS_MOCK_DASHBOARD.claims.map((row) => ({ ...row })),
    recentImports: CLAIMS_IMPORTS_MOCK_DASHBOARD.recentImports.map((row) => ({
      ...row,
    })),
  }
}
