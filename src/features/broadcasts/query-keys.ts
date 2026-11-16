export const broadcastsKeys = {
  all: ['broadcasts'] as const,
  dashboard: () => [...broadcastsKeys.all, 'dashboard'] as const,
}
