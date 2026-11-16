export const myWorkKeys = {
  all: ['my-work'] as const,
  myQueue: () => [...myWorkKeys.all, 'my-queue'] as const,
  myDesk: () => [...myWorkKeys.all, 'my-desk'] as const,
  myTickets: () => [...myWorkKeys.all, 'my-tickets'] as const,
  analystHome: () => [...myWorkKeys.all, 'analyst-home'] as const,
}
