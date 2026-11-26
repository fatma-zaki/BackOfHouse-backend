import { useQuery } from '@tanstack/react-query'
import { getCompaniesDashboard } from '@/features/companies/api/get-companies-dashboard'
import { companiesKeys } from '@/features/companies/query-keys'

type UseCompaniesDashboardParams = {
  enabled?: boolean
}

export function useCompaniesDashboard({
  enabled = true,
}: UseCompaniesDashboardParams = {}) {
  return useQuery({
    queryKey: companiesKeys.dashboard(),
    queryFn: () => getCompaniesDashboard(),
    enabled,
  })
}
