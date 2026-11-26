import { useQuery } from '@tanstack/react-query'
import { getSettingsDashboard } from '@/features/settings/api/get-settings-dashboard'
import { settingsKeys } from '@/features/settings/query-keys'

export function useSettingsDashboard(enabled = true) {
  return useQuery({
    queryKey: settingsKeys.dashboard(),
    queryFn: () => getSettingsDashboard(),
    enabled,
  })
}
