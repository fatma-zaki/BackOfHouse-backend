import type { ApplicationsDateRangeKey } from '@/features/applications/types/applications.types'

export const applicationsKeys = {
  all: ['applications'] as const,
  dashboard: (range: ApplicationsDateRangeKey) =>
    [...applicationsKeys.all, 'dashboard', range] as const,
}
