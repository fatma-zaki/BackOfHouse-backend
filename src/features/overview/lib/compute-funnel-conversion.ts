import type { OverviewFunnelStage } from '@/features/overview/types/overview.types'

/**
 * submitted ÷ listingViews × 100, rounded to 1 decimal.
 * Returns `null` when inputs are missing, non-finite, or listingViews ≤ 0.
 */
export function computeFunnelConversionRate(
  stages: readonly OverviewFunnelStage[],
): number | null {
  const listingViews = stages.find((stage) => stage.id === 'listingViews')?.value
  const submitted = stages.find((stage) => stage.id === 'submitted')?.value

  if (
    listingViews == null ||
    submitted == null ||
    !Number.isFinite(listingViews) ||
    !Number.isFinite(submitted) ||
    listingViews <= 0 ||
    submitted < 0
  ) {
    return null
  }

  return Math.round((submitted / listingViews) * 1000) / 10
}
