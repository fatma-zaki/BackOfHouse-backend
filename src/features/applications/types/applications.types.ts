export type ApplicationsDateRange = {
  from: Date
  to: Date
}

export type ApplicationsDateRangeKey = {
  from: string
  to: string
}

export type ApplicationsTabId =
  | 'all'
  | 'applied'
  | 'inReview'
  | 'shortlisted'
  | 'decision'

export const APPLICATIONS_TAB_IDS: readonly ApplicationsTabId[] = [
  'all',
  'applied',
  'inReview',
  'shortlisted',
  'decision',
] as const

export type ApplicationStatusId =
  | 'applied'
  | 'inReview'
  | 'shortlisted'
  | 'selected'
  | 'notSelected'

export type ApplicationListingTypeId =
  | 'job'
  | 'coop'
  | 'volunteer'
  | 'project'
  | 'supplier'

export type ApplicationAvatarTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type ApplicationsKpiId =
  | 'applications'
  | 'inReview'
  | 'shortlisted'
  | 'selected'

export type ApplicationsKpiDelta =
  | {
      kind: 'percentVsMonth'
      value: number
      monthKey: string
      tone: 'up' | 'down' | 'neutral'
    }
  | {
      kind: 'percentOfApplications'
      value: number
      tone: 'neutral'
    }

export type ApplicationsKpiMetric = {
  id: ApplicationsKpiId
  value: string
  delta?: ApplicationsKpiDelta
}

export type ApplicationRow = {
  id: string
  applicantNameKey: string
  initials: string
  avatarTone: ApplicationAvatarTone
  cityId: string
  personaKey: string
  listingTitleKey: string
  companyKey: string
  listingTypeId: ApplicationListingTypeId
  appliedKey: string
  statusId: ApplicationStatusId
  timeInStageKey: string
}

export type ApplicationsDashboardData = {
  range: ApplicationsDateRangeKey
  kpis: readonly ApplicationsKpiMetric[]
  applications: readonly ApplicationRow[]
  totalCount: number
}
