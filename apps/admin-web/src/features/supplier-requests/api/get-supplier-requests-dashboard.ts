/**
 * Local async adapter over Supplier requests mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { SUPPLIER_REQUESTS_MOCK_DASHBOARD } from '@/features/supplier-requests/mocks/supplier-requests.mock'
import type {
  SupplierRequestsDashboardData,
  SupplierRequestsDateRangeKey,
} from '@/features/supplier-requests/types/supplier-requests.types'

const MOCK_LATENCY_MS = 160

export function toSupplierRequestsDateRangeKey(range: {
  from: Date
  to: Date
}): SupplierRequestsDateRangeKey {
  return {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  }
}

export async function getSupplierRequestsDashboard(params: {
  range: { from: Date; to: Date }
}): Promise<SupplierRequestsDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  const rangeKey = toSupplierRequestsDateRangeKey(params.range)

  return {
    range: rangeKey,
    kpis: SUPPLIER_REQUESTS_MOCK_DASHBOARD.kpis.map((kpi) => ({ ...kpi })),
    requests: SUPPLIER_REQUESTS_MOCK_DASHBOARD.requests.map((row) => ({
      ...row,
      facts: row.facts.map((fact) => ({ ...fact })),
      responses: row.responses.map((response) => ({ ...response })),
    })),
  }
}
