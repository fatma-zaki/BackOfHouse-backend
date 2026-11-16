import { useQuery } from '@tanstack/react-query'
import { getListingsReview } from '@/features/listings/api/get-listings-review'
import { listingsKeys } from '@/features/listings/query-keys'

export function useListingsReview(enabled = true) {
  return useQuery({
    queryKey: listingsKeys.review(),
    queryFn: () => getListingsReview(),
    enabled,
  })
}
