export const listingsKeys = {
  all: ['listings'] as const,
  review: () => [...listingsKeys.all, 'review'] as const,
}
