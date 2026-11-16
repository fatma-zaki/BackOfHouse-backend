import { useQuery } from '@tanstack/react-query'
import {
  getAuditDashboard,
  toAuditDateRangeKey,
} from '@/features/audit/api/get-audit-dashboard'
import { auditKeys } from '@/features/audit/query-keys'
import type { AuditDateRange } from '@/features/audit/types/audit.types'

type UseAuditDashboardParams = {
  range: AuditDateRange
  enabled?: boolean
}

export function useAuditDashboard({
  range,
  enabled = true,
}: UseAuditDashboardParams) {
  const rangeKey = toAuditDateRangeKey(range)

  return useQuery({
    queryKey: auditKeys.dashboard(rangeKey),
    queryFn: () => getAuditDashboard({ range }),
    enabled,
  })
}
