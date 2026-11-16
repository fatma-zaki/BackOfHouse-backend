/**
 * Feature-local Overview dashboard contracts.
 * Not a backend DTO — replace when a real API contract exists.
 */

/** Inclusive calendar date range used for Overview queries (local UI state). */
export type OverviewDateRange = {
  from: Date
  to: Date
}

/** Stable YYYY-MM-DD keys for query caches and mock filtering. */
export type OverviewDateRangeKey = {
  from: string
  to: string
}

export type OverviewKpiId =
  | 'totalUsers'
  | 'companies'
  | 'liveListings'
  | 'applications'
  | 'supplierRequests'

export type OverviewKpiSecondary =
  | { kind: 'percentVsPreviousMonth'; value: number }
  | { kind: 'verifiedCount'; value: number }
  | { kind: 'deltaThisMonth'; value: number }

export type OverviewKpiMetric = {
  id: OverviewKpiId
  value: number
  secondary: OverviewKpiSecondary
}

export type OverviewSignupPoint = {
  /** Calendar date (YYYY-MM-DD). */
  date: string
  count: number
}

export type OverviewSignupsSeries = {
  points: OverviewSignupPoint[]
  /** Sum of `points` counts for the active filtered range. */
  totalInRange: number
  peak: OverviewSignupPoint | null
}

export type OverviewAttentionId =
  | 'listingsAwaitingReview'
  | 'verificationRequests'
  | 'reportedContent'
  | 'openSupportTickets'

export type OverviewAttentionTone =
  | 'warning'
  | 'info'
  | 'destructive'
  | 'neutral'

export type OverviewAttentionItem = {
  id: OverviewAttentionId
  count: number
  tone: OverviewAttentionTone
  /** Demo detail fields for a later UI checkpoint — not i18n keys. */
  detail: Record<string, number | string>
  href: string
}

export type OverviewFunnelStageId =
  | 'listingViews'
  | 'applicationsStarted'
  | 'submitted'
  | 'shortlisted'
  | 'selected'

export type OverviewFunnelStage = {
  id: OverviewFunnelStageId
  value: number
}

export type OverviewFunnel = {
  /**
   * Derived in the feature adapter: submitted ÷ listingViews × 100.
   * `null` when the rate cannot be computed safely.
   */
  conversionRatePercent: number | null
  stages: OverviewFunnelStage[]
}

export type OverviewActivityTone =
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'destructive'

/** i18n keys under `overview.activity.entities.*` (demo display names). */
export type OverviewActivityEntityKey =
  | 'saudiEventsGroup'
  | 'fatmaZaki'
  | 'riyadhFrontEvents'
  | 'listing'
  | 'stageManager'
  | 'eventProducer'
  | 'stageAndLighting'
  | 'quickCashPromoters'

export type OverviewActivityItem = {
  id: string
  tone: OverviewActivityTone
  /** ISO-8601 timestamp. */
  occurredAt: string
  /**
   * Demo entity key fragments. Visible copy uses i18n
   * (`overview.activity.items.*` + `overview.activity.entities.*`).
   */
  message: {
    actorKey: OverviewActivityEntityKey
    targetKey?: OverviewActivityEntityKey
  }
}

export type OverviewDashboardData = {
  range: OverviewDateRangeKey
  kpis: OverviewKpiMetric[]
  signups: OverviewSignupsSeries
  attention: OverviewAttentionItem[]
  funnel: OverviewFunnel
  activity: OverviewActivityItem[]
  /**
   * ISO-8601 reference instant for relative activity timestamps.
   * Provided by the adapter (mock clock today; real server time later).
   */
  activityAsOf: string
}

export type GetOverviewDashboardParams = {
  range: OverviewDateRange
}
