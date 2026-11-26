/**
 * Local async adapter over Users mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { USERS_MOCK_DASHBOARD } from '@/features/users/mocks/users-dashboard.mock'
import type { UsersDashboardData } from '@/features/users/types/users.types'

const MOCK_LATENCY_MS = 160

export async function getUsersDashboard(): Promise<UsersDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    tabCounts: { ...USERS_MOCK_DASHBOARD.tabCounts },
    users: USERS_MOCK_DASHBOARD.users.map((row) => ({ ...row })),
  }
}
