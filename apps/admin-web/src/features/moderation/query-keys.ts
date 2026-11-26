export const moderationKeys = {
  all: ['moderation'] as const,
  dashboard: () => [...moderationKeys.all, 'dashboard'] as const,
}
