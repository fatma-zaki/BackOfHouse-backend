/**
 * Local async adapter over Events mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { EVENTS_MOCK_DASHBOARD } from '@/features/events/mocks/events.mock'
import type { EventsDashboardData } from '@/features/events/types/events.types'

const MOCK_LATENCY_MS = 160

export async function getEventsDashboard(): Promise<EventsDashboardData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    kpis: EVENTS_MOCK_DASHBOARD.kpis.map((kpi) => ({ ...kpi })),
    events: EVENTS_MOCK_DASHBOARD.events.map((row) => ({ ...row })),
  }
}
