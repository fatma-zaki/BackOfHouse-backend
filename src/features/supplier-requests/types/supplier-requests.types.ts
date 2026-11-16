export type SupplierRequestsDateRange = {
  from: Date
  to: Date
}

export type SupplierRequestsDateRangeKey = {
  from: string
  to: string
}

export type SupplierRequestsTabId = 'open' | 'awarded' | 'closed'

export const SUPPLIER_REQUESTS_TAB_IDS: readonly SupplierRequestsTabId[] = [
  'open',
  'awarded',
  'closed',
] as const

export type SupplierRequestLifecycleTab = SupplierRequestsTabId

export type SupplierRequestRowStatusId =
  | 'open'
  | 'noResponses'
  | 'awarded'
  | 'closed'

export type SupplierRequestCategoryId =
  | 'stagingLighting'
  | 'catering'
  | 'brandActivation'
  | 'venueAv'
  | 'ledScreens'
  | 'security'
  | 'merchandise'
  | 'transport'

export type SupplierRequestCategoryTone =
  | 'amber'
  | 'violet'
  | 'info'
  | 'success'
  | 'warning'
  | 'neutral'

export type SupplierResponseStatusId =
  | 'shortlisted'
  | 'new'
  | 'declined'

export type SupplierResponseAvatarTone =
  | 'violet'
  | 'sky'
  | 'mint'
  | 'amber'
  | 'rose'
  | 'slate'

export type SupplierRequestsKpiId =
  | 'openRequests'
  | 'responsesThisMonth'
  | 'responsesPerRequest'
  | 'noResponseAfter5Days'

export type SupplierRequestsKpiFootnote =
  | {
      kind: 'percentVsMonth'
      value: number
      monthKey: string
      tone: 'up' | 'down' | 'neutral'
    }
  | {
      kind: 'callout'
      labelKey: string
      tone: 'warning' | 'neutral'
    }

export type SupplierRequestsKpiMetric = {
  id: SupplierRequestsKpiId
  value: string
  footnote?: SupplierRequestsKpiFootnote
}

export type SupplierRequestFact = {
  labelKey: string
  valueKey: string
}

export type SupplierRequestResponse = {
  id: string
  supplierNameKey: string
  initials: string
  avatarTone: SupplierResponseAvatarTone
  statusId: SupplierResponseStatusId
  verified?: boolean
  repliedKey: string
}

export type SupplierRequestRow = {
  id: string
  titleKey: string
  companyKey: string
  categoryId: SupplierRequestCategoryId
  categoryTone: SupplierRequestCategoryTone
  cityId: string
  lifecycleTab: SupplierRequestLifecycleTab
  closesKey: string
  postedKey: string
  responseCount: number
  /** Scale for the responses mini-bar (demo). */
  responseBarMax: number
  statusId: SupplierRequestRowStatusId
  facts: readonly SupplierRequestFact[]
  responses: readonly SupplierRequestResponse[]
}

export type SupplierRequestsDashboardData = {
  range: SupplierRequestsDateRangeKey
  kpis: readonly SupplierRequestsKpiMetric[]
  requests: readonly SupplierRequestRow[]
}
