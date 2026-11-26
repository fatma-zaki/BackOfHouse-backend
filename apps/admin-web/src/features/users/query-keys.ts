export const usersKeys = {
  all: ['users'] as const,
  dashboard: () => [...usersKeys.all, 'dashboard'] as const,
  detail: (userId: string) => [...usersKeys.all, 'detail', userId] as const,
}
