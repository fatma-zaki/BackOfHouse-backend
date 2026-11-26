export type ClaimsTabId = 'open' | 'decided'

export const CLAIMS_TAB_IDS: readonly ClaimsTabId[] = ['open', 'decided'] as const

export type ClaimEvidenceId =
  | 'domainMatches'
  | 'needsDocuments'
  | 'approved'
  | 'rejected'

export type ClaimAvatarTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type ClaimRow = {
  id: string
  tab: ClaimsTabId
  companyPageKey: string
  initials: string
  avatarTone: ClaimAvatarTone
  importMonthKey: string
  listingsCount: number
  claimantNameKey: string
  claimantEmailKey: string
  evidenceId: ClaimEvidenceId
  submittedKey: string
}

export type ImportStatusId = 'processing' | 'doneWithErrors' | 'done'

export type ImportTemplateId = 'companies' | 'events' | 'users' | 'attendance'

export const IMPORT_TEMPLATE_IDS: readonly ImportTemplateId[] = [
  'companies',
  'events',
  'users',
  'attendance',
] as const

export type RecentImportRow = {
  id: string
  fileNameKey: string
  statusId: ImportStatusId
  progressPercent: number
  detailKey: string
  showErrorReportLink?: boolean
}

export type ClaimsImportsDashboardData = {
  claims: readonly ClaimRow[]
  recentImports: readonly RecentImportRow[]
}
