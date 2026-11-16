export const verificationKeys = {
  all: ['verification'] as const,
  review: () => [...verificationKeys.all, 'review'] as const,
}
