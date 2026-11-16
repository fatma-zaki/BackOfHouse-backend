export type BroadcastChannelId = 'push' | 'email' | 'inApp'

export type BroadcastStatusId = 'scheduled' | 'sent' | 'draft'

export type BroadcastEditorLocale = 'en' | 'ar'

export type AudienceRule = {
  id: string
  fieldKey: string
  operatorKey: string
  valueKey: string
}

export type BroadcastMessageContent = {
  en: { title: string; body: string }
  ar: { title: string; body: string }
}

export type BroadcastRow = {
  id: string
  titleKey: string
  channelsMetaKey: string
  sentTo: number | null
  openedPercent: number | null
  statusId: BroadcastStatusId
}

export type BroadcastsDashboardData = {
  audienceMatchCount: number
  audienceRules: readonly AudienceRule[]
  defaultChannels: Record<BroadcastChannelId, boolean>
  draftMessage: BroadcastMessageContent
  rows: readonly BroadcastRow[]
}
