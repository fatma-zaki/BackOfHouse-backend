import type { StatusBadgeStatus } from '@/components/shared/status-badge'

export type MyWorkKpi = {
  id: string
  labelKey: string
  valueKey: string
  secondaryKey?: string
  secondaryTone?: 'danger' | 'neutral' | 'default'
}

export type MyWorkQueueTarget =
  | 'listings'
  | 'moderation'
  | 'verification'
  | 'claims'
  | 'supplierRequests'

export type MyWorkQueueEntry = {
  id: string
  titleKey: string
  metaKey: string
  queueKey: string
  queueTone: StatusBadgeStatus
  slaKey: string
  slaTone: StatusBadgeStatus
  to: MyWorkQueueTarget
}

export type MyWorkGuideline = {
  id: string
  titleKey: string
  bodyKey: string
}

export type MyWorkDecision = {
  id: string
  titleKey: string
  metaKey: string
  outcomeKey: string
  outcomeTone: StatusBadgeStatus
}

export type MyQueueData = {
  kpis: MyWorkKpi[]
  upNext: MyWorkQueueEntry[]
  guidelines: MyWorkGuideline[]
  recentDecisions: MyWorkDecision[]
}

export type MyWorkWeekItem = {
  labelKey: string
  tone: 'warning' | 'info'
  href: string
}

export type MyWorkWeekDay = {
  id: string
  dayKey: string
  today?: boolean
  items: MyWorkWeekItem[]
}

export type MyWorkDraft = {
  id: string
  titleKey: string
  categoryKey: string
  languagesKey: string
  readinessKey: string
  editedKey: string
  href: string
}

export type MyWorkMeter = {
  id: string
  labelKey: string
  value: number
}

export type MyDeskData = {
  kpis: MyWorkKpi[]
  week: MyWorkWeekDay[]
  drafts: MyWorkDraft[]
  mostRead: MyWorkMeter[]
}

export type MyWorkTicket = {
  id: string
  subjectKey: string
  fromKey: string
  topicKey: string
  topicTone: StatusBadgeStatus
  slaKey: string
  slaTone: StatusBadgeStatus
  queue: 'mine' | 'shared'
}

export type MyWorkCapability = {
  id: string
  textKey: string
  allowed: boolean
}

export type MyTicketsData = {
  kpis: MyWorkKpi[]
  tickets: MyWorkTicket[]
  capabilities: MyWorkCapability[]
  byTopic: MyWorkMeter[]
}

export type MyWorkSavedReport = {
  id: string
  titleKey: string
  descriptionKey: string
  scheduleKey: string
  lastRunKey: string
  formats: readonly string[]
}

export type MyWorkBarPoint = {
  id: string
  labelKey: string
  value: number
}

export type AnalystHomeData = {
  kpis: MyWorkKpi[]
  savedReports: MyWorkSavedReport[]
  applicationsPerWeek: MyWorkBarPoint[]
  dataAccess: MyWorkCapability[]
}

export const MY_WORK_QUEUE_PATH: Record<MyWorkQueueTarget, string> = {
  listings: '/admin/listings',
  moderation: '/admin/moderation',
  verification: '/admin/verification',
  claims: '/admin/claims-imports',
  supplierRequests: '/admin/supplier-requests',
}
