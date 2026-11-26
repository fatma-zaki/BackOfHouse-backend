/**
 * Local async adapter over Moderation mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { MODERATION_MOCK_DASHBOARD } from '@/features/moderation/mocks/moderation.mock'
import type { ModerationDashboardData } from '@/features/moderation/types/moderation.types'

const MOCK_LATENCY_MS = 160

export async function getModerationDashboard(): Promise<ModerationDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    reports: MODERATION_MOCK_DASHBOARD.reports.map((item) => ({
      ...item,
      reportReasons: item.reportReasons.map((r) => ({ ...r })),
      reporterQuotes: item.reporterQuotes.map((q) => ({ ...q })),
    })),
    reasonFilterKeys: [...MODERATION_MOCK_DASHBOARD.reasonFilterKeys],
  }
}
