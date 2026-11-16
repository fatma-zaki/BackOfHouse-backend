/**
 * Local async adapter over Broadcasts mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { BROADCASTS_MOCK_DASHBOARD } from '@/features/broadcasts/mocks/broadcasts.mock'
import type { BroadcastsDashboardData } from '@/features/broadcasts/types/broadcasts.types'

const MOCK_LATENCY_MS = 140

export async function getBroadcastsDashboard(): Promise<BroadcastsDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    audienceMatchCount: BROADCASTS_MOCK_DASHBOARD.audienceMatchCount,
    audienceRules: BROADCASTS_MOCK_DASHBOARD.audienceRules.map((rule) => ({
      ...rule,
    })),
    defaultChannels: { ...BROADCASTS_MOCK_DASHBOARD.defaultChannels },
    draftMessage: {
      en: { ...BROADCASTS_MOCK_DASHBOARD.draftMessage.en },
      ar: { ...BROADCASTS_MOCK_DASHBOARD.draftMessage.ar },
    },
    rows: BROADCASTS_MOCK_DASHBOARD.rows.map((row) => ({ ...row })),
  }
}
