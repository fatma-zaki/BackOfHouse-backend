import type { ReportsDateRangeKey } from '@/features/reports/types/reports.types'

export const reportsKeys = {
  all: ['reports'] as const,
  dashboard: (range: ReportsDateRangeKey) =>
    [...reportsKeys.all, 'dashboard', range.from, range.to] as const,
}
