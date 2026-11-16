export const newsKeys = {
  all: ['news'] as const,
  stories: () => [...newsKeys.all, 'stories'] as const,
}
