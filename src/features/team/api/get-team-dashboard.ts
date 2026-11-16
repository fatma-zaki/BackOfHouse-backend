/**
 * Local async adapter over Team mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { TEAM_MOCK_DASHBOARD } from '@/features/team/mocks/team-dashboard.mock'
import type { TeamDashboardData } from '@/features/team/types/team.types'

const MOCK_LATENCY_MS = 160

export async function getTeamDashboard(): Promise<TeamDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    admins: TEAM_MOCK_DASHBOARD.admins.map((row) => ({ ...row })),
    permissions: TEAM_MOCK_DASHBOARD.permissions.map((row) => ({
      ...row,
      access: { ...row.access },
    })),
  }
}
