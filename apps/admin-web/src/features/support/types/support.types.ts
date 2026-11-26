export type SupportTicketCategory =
  | 'points'
  | 'company'
  | 'verification'
  | 'account'

export type SupportCategoryTone = 'violet' | 'success' | 'warning' | 'info'

export type SupportTicketTab = 'open' | 'mine' | 'closed'

export type SupportSlaTone = 'danger' | 'warning' | 'muted'

export type SupportMessageKind = 'user' | 'agent' | 'system'

export type SupportTicketStatus = 'open' | 'closed'

export type SupportMessage = {
  id: string
  kind: SupportMessageKind
  bodyKey: string
  /** Local/demo agent replies that are not i18n keys. */
  bodyText?: string
  authorKey?: string
  timeKey?: string
}

export type SupportRelatedKind = 'event' | 'ticket'

export type SupportRelatedItem = {
  id: string
  kind: SupportRelatedKind
  titleKey: string
  detailKey: string
}

export type SupportRequester = {
  nameKey: string
  initials: string
  profileTypeKey: string
  locationKey: string
  points: number
  eventsAttended: number
  pastTickets: number
}

export type SupportAssignee = {
  id: string
  nameKey: string
}

export type SupportQuickReply = {
  id: string
  labelKey: string
  bodyKey: string
}

export type SupportTicket = {
  id: string
  number: string
  status: SupportTicketStatus
  assigneeId: string | null
  senderNameKey: string
  subjectKey: string
  category: SupportTicketCategory
  ageKey: string
  slaLabelKey?: string
  slaTone?: SupportSlaTone
  openedAgoKey: string
  messages: readonly SupportMessage[]
  requester: SupportRequester
  related: readonly SupportRelatedItem[]
}

export type SupportInboxData = {
  currentAgentId: string
  assignees: readonly SupportAssignee[]
  quickReplies: readonly SupportQuickReply[]
  tabCounts: Record<SupportTicketTab, number>
  tickets: readonly SupportTicket[]
}
