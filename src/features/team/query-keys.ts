export const teamKeys = {
  all: ['team'] as const,
  dashboard: () => [...teamKeys.all, 'dashboard'] as const,
}
