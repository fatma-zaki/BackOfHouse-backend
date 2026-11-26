import type {
  SupportTicket,
  SupportTicketTab,
} from '@/features/support/types/support.types'

export function matchesSupportTab(
  ticket: SupportTicket,
  tab: SupportTicketTab,
  currentAgentId: string,
): boolean {
  switch (tab) {
    case 'open':
      return ticket.status === 'open'
    case 'mine':
      return (
        ticket.status === 'open' && ticket.assigneeId === currentAgentId
      )
    case 'closed':
      return ticket.status === 'closed'
  }
}

export function filterSupportTickets(
  tickets: readonly SupportTicket[],
  tab: SupportTicketTab,
  currentAgentId: string,
): SupportTicket[] {
  return tickets.filter((ticket) =>
    matchesSupportTab(ticket, tab, currentAgentId),
  )
}

/** Tab badge counts derived from the current (possibly locally patched) tickets. */
export function countSupportByTab(
  tickets: readonly SupportTicket[],
  currentAgentId: string,
): Record<SupportTicketTab, number> {
  return {
    open: filterSupportTickets(tickets, 'open', currentAgentId).length,
    mine: filterSupportTickets(tickets, 'mine', currentAgentId).length,
    closed: filterSupportTickets(tickets, 'closed', currentAgentId).length,
  }
}
