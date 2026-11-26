import { useQuery } from '@tanstack/react-query'
import {
  getSupplierRequestsDashboard,
  toSupplierRequestsDateRangeKey,
} from '@/features/supplier-requests/api/get-supplier-requests-dashboard'
import { supplierRequestsKeys } from '@/features/supplier-requests/query-keys'
import type { SupplierRequestsDateRange } from '@/features/supplier-requests/types/supplier-requests.types'

type UseSupplierRequestsDashboardParams = {
  range: SupplierRequestsDateRange
  enabled?: boolean
}

export function useSupplierRequestsDashboard({
  range,
  enabled = true,
}: UseSupplierRequestsDashboardParams) {
  const rangeKey = toSupplierRequestsDateRangeKey(range)

  return useQuery({
    queryKey: supplierRequestsKeys.dashboard(rangeKey),
    queryFn: () => getSupplierRequestsDashboard({ range }),
    enabled,
  })
}
