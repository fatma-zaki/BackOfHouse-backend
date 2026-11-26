/**
 * Feature-local Moderation queue contracts.
 * Not a backend DTO — replace when a real API contract exists.
 */

export type ModerationTabId = 'open' | 'autoFlagged' | 'resolved'

export type ModerationContentTypeId =
  | 'listing'
  | 'profile'
  | 'response'
  | 'company'

export type ModerationStatusId =
  | 'open'
  | 'autoFlagged'
  | 'resolvedWarned'
  | 'resolvedDismissed'
  | 'resolvedRemoved'
  | 'resolvedSuspended'

export type ModerationReportReason = {
  reasonKey: string
  count: number
}

export type ModerationReporterQuote = {
  quoteKey: string
  attributionKey: string
}

export type ModerationReport = {
  id: string
  titleKey: string
  subtitleKey: string
  contentTypeId: ModerationContentTypeId
  reportCount: number
  whenKey: string
  statusId: ModerationStatusId
  metaKey: string
  contentQuoteKey: string
  reportReasons: readonly ModerationReportReason[]
  reporterQuotes: readonly ModerationReporterQuote[]
  accountHistoryKey: string
}

export type ModerationDashboardData = {
  reports: readonly ModerationReport[]
  reasonFilterKeys: readonly string[]
}
