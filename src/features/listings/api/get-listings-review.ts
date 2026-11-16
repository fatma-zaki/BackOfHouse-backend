/**
 * Local async adapter over Listings review mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { LISTINGS_MOCK_REVIEW_DATA } from '@/features/listings/mocks/listings-review.mock'
import type { ListingsReviewData } from '@/features/listings/types/listings.types'

const MOCK_LATENCY_MS = 160

export async function getListingsReview(): Promise<ListingsReviewData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    submissions: LISTINGS_MOCK_REVIEW_DATA.submissions.map((item) => ({
      ...item,
      facts: item.facts.map((f) => ({ ...f })),
      checks: item.checks.map((c) => ({ ...c })),
    })),
    tabCounts: { ...LISTINGS_MOCK_REVIEW_DATA.tabCounts },
    changeReasons: LISTINGS_MOCK_REVIEW_DATA.changeReasons,
    defaultChangeMessageKey: LISTINGS_MOCK_REVIEW_DATA.defaultChangeMessageKey,
  }
}
