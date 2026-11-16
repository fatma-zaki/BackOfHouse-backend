export const eventsKeys = {
  all: ['events'] as const,
  dashboard: () => [...eventsKeys.all, 'dashboard'] as const,
}
