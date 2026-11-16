import { useQuery } from '@tanstack/react-query'
import { getClaimsImportsDashboard } from '@/features/claims-imports/api/get-claims-imports-dashboard'
import { claimsImportsKeys } from '@/features/claims-imports/query-keys'

type UseClaimsImportsDashboardParams = {
  enabled?: boolean
}

export function useClaimsImportsDashboard({
  enabled = true,
}: UseClaimsImportsDashboardParams = {}) {
  return useQuery({
    queryKey: claimsImportsKeys.dashboard(),
    queryFn: () => getClaimsImportsDashboard(),
    enabled,
  })
}
