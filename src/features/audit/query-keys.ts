import type { AuditDateRangeKey } from '@/features/audit/types/audit.types'

export const auditKeys = {
  all: ['audit'] as const,
  dashboard: (range: AuditDateRangeKey) =>
    [...auditKeys.all, 'dashboard', range] as const,
}
