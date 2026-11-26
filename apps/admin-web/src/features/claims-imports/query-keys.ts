export const claimsImportsKeys = {
  all: ['claimsImports'] as const,
  dashboard: () => [...claimsImportsKeys.all, 'dashboard'] as const,
}
