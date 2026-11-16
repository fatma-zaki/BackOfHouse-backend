export const supportKeys = {
  all: ['support'] as const,
  inbox: () => [...supportKeys.all, 'inbox'] as const,
}
