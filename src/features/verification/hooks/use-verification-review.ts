import { useQuery } from '@tanstack/react-query'
import { getVerificationReview } from '@/features/verification/api/get-verification-review'
import { verificationKeys } from '@/features/verification/query-keys'

export function useVerificationReview(enabled = true) {
  return useQuery({
    queryKey: verificationKeys.review(),
    queryFn: () => getVerificationReview(),
    enabled,
  })
}
