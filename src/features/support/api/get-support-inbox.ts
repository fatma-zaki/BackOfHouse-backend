/**
 * Local async adapter over Support inbox mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import {
  SUPPORT_MOCK_INBOX,
} from '@/features/support/mocks/support-inbox.mock'
import type { SupportInboxData } from '@/features/support/types/support.types'

const MOCK_LATENCY_MS = 140

export async function getSupportInbox(): Promise<SupportInboxData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    currentAgentId: SUPPORT_MOCK_INBOX.currentAgentId,
    assignees: SUPPORT_MOCK_INBOX.assignees.map((a) => ({ ...a })),
    quickReplies: SUPPORT_MOCK_INBOX.quickReplies.map((q) => ({ ...q })),
    tabCounts: { ...SUPPORT_MOCK_INBOX.tabCounts },
    tickets: SUPPORT_MOCK_INBOX.tickets.map((ticket) => ({
      ...ticket,
      messages: ticket.messages.map((m) => ({ ...m })),
      requester: { ...ticket.requester },
      related: ticket.related.map((r) => ({ ...r })),
    })),
  }
}
