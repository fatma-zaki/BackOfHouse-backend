/**
 * Local async adapter over Verification review mock data.
 * No REST endpoints and no Axios — swap this function body when a real API exists.
 */

import { VERIFICATION_MOCK_REVIEW_DATA } from '@/features/verification/mocks/verification-review.mock'
import type { VerificationReviewData } from '@/features/verification/types/verification.types'

const MOCK_LATENCY_MS = 160

export async function getVerificationReview(): Promise<VerificationReviewData> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })

  return {
    requests: VERIFICATION_MOCK_REVIEW_DATA.requests.map((item) => ({
      ...item,
      facts: item.facts.map((f) => ({ ...f })),
      checks: item.checks.map((c) => ({ ...c })),
      documents: item.documents.map((d) => ({ ...d })),
      requestedMeta: { ...item.requestedMeta },
    })),
    tabCounts: { ...VERIFICATION_MOCK_REVIEW_DATA.tabCounts },
  }
}
