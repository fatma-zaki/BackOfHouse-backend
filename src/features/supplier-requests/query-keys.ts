import type { SupplierRequestsDateRangeKey } from '@/features/supplier-requests/types/supplier-requests.types'

export const supplierRequestsKeys = {
  all: ['supplierRequests'] as const,
  dashboard: (range: SupplierRequestsDateRangeKey) =>
    [...supplierRequestsKeys.all, 'dashboard', range] as const,
}
