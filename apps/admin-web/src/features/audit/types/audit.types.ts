export type AuditDateRange = {
  from: Date
  to: Date
}

export type AuditDateRangeKey = {
  from: string
  to: string
}

export type AuditTabId =
  | 'all'
  | 'decisions'
  | 'points'
  | 'exports'
  | 'access'

export const AUDIT_TAB_IDS: readonly AuditTabId[] = [
  'all',
  'decisions',
  'points',
  'exports',
  'access',
] as const

export type AuditActionId =
  | 'exportedData'
  | 'requestedChanges'
  | 'adjustedPoints'
  | 'approvedVerification'
  | 'suspendedAccount'
  | 'publishedStory'
  | 'changedRole'
  | 'signedIn'

export type AuditActionCategory =
  | 'decisions'
  | 'points'
  | 'exports'
  | 'access'
  | 'general'

export type AuditAvatarTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type AuditRow = {
  id: string
  whenKey: string
  adminKey: string
  initials: string
  avatarTone: AuditAvatarTone
  actionId: AuditActionId
  actionCategory: AuditActionCategory
  targetKey: string
  detailsKey?: string
}

export type AuditDashboardData = {
  range: AuditDateRangeKey
  entries: readonly AuditRow[]
  totalCount: number
}
