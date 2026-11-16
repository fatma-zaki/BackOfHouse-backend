/**
 * Local async adapter over Settings mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { SETTINGS_DASHBOARD_MOCK } from '@/features/settings/mocks/settings-dashboard.mock'
import type { SettingsDashboardData } from '@/features/settings/types/settings.types'

const MOCK_LATENCY_MS = 120

export async function getSettingsDashboard(): Promise<SettingsDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    general: { ...SETTINGS_DASHBOARD_MOCK.general },
    pointsRules: SETTINGS_DASHBOARD_MOCK.pointsRules.map((row) => ({ ...row })),
    categoryGroups: SETTINGS_DASHBOARD_MOCK.categoryGroups.map((group) => ({
      ...group,
      items: [...group.items],
    })),
    reviewSafety: SETTINGS_DASHBOARD_MOCK.reviewSafety.map((row) => ({
      ...row,
    })),
    notifications: SETTINGS_DASHBOARD_MOCK.notifications.map((row) => ({
      ...row,
    })),
    legalDocs: SETTINGS_DASHBOARD_MOCK.legalDocs.map((row) => ({ ...row })),
    languages: { ...SETTINGS_DASHBOARD_MOCK.languages },
  }
}
