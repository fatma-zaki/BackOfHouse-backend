export type CompaniesTabId =
  | 'all'
  | 'verified'
  | 'pendingVerification'
  | 'notVerified'
  | 'suspended'

export const COMPANIES_TAB_IDS: readonly CompaniesTabId[] = [
  'all',
  'verified',
  'pendingVerification',
  'notVerified',
  'suspended',
] as const

export type CompanyVerificationStatusId =
  | 'verified'
  | 'pending'
  | 'notVerified'
  | 'suspended'

export type CompanyAvatarTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type CompaniesSortId = 'mostActive' | 'leastActive' | 'name'

export type CompaniesKpiId =
  | 'accounts'
  | 'verified'
  | 'postingThisMonth'
  | 'avgResponse'

export type CompaniesKpiDelta =
  | {
      kind: 'countThisMonth'
      value: number
      tone: 'up' | 'down' | 'neutral'
    }
  | {
      kind: 'percentOfAccounts'
      value: number
      tone: 'neutral'
    }
  | {
      kind: 'slowerThanMonth'
      monthKey: string
      tone: 'warning'
    }

export type CompaniesKpiMetric = {
  id: CompaniesKpiId
  value: string
  delta?: CompaniesKpiDelta
}

export type CompanyRow = {
  id: string
  companyKey: string
  initials: string
  avatarTone: CompanyAvatarTone
  industryKey: string
  cityId: string
  liveListings: number
  applicationsDisplay: string
  responseRatePercent: number
  verificationStatusId: CompanyVerificationStatusId
  showVerifiedBadge: boolean
}

export type CompaniesDashboardData = {
  kpis: readonly CompaniesKpiMetric[]
  companies: readonly CompanyRow[]
  totalCount: number
  pendingVerificationCount: number
}
