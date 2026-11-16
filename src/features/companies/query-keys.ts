export const companiesKeys = {
  all: ['companies'] as const,
  dashboard: () => [...companiesKeys.all, 'dashboard'] as const,
}
