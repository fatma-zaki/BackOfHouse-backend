export const settingsKeys = {
  all: ['settings'] as const,
  dashboard: () => [...settingsKeys.all, 'dashboard'] as const,
}
