export type EventsTabId = 'past' | 'upcoming' | 'drafts'

export const EVENTS_TAB_IDS: readonly EventsTabId[] = [
  'past',
  'upcoming',
  'drafts',
] as const

export type EventPointsStatusId =
  | 'awaitingCheckIns'
  | 'pointsAwarded'
  | 'partlyAwarded'

export type EventThumbGradient =
  | 'violet'
  | 'sky'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'slate'

export type EventsKpiId =
  | 'upcomingEvents'
  | 'registrationsSep'
  | 'attendanceVerified'
  | 'pointsAwardedSep'

export type EventsKpiFootnote =
  | {
      kind: 'percentVsMonth'
      value: number
      monthKey: string
      tone: 'up' | 'down' | 'neutral'
    }

export type EventsKpiMetric = {
  id: EventsKpiId
  value: string
  footnote?: EventsKpiFootnote
}

export type EventRow = {
  id: string
  titleKey: string
  venueKey: string
  cityId: string
  datesKey: string
  detailMetaKey: string
  lifecycleTab: EventsTabId
  registered: number
  verifiedAttendance: number
  checkInPercent: number
  pointsStatusId: EventPointsStatusId
  thumbGradient: EventThumbGradient
  coverGradient: EventThumbGradient
  checkInMethodKey: string
  unmatchedScans: number
  pointsPerAttendee: number
}

export type EventsDashboardData = {
  kpis: readonly EventsKpiMetric[]
  events: readonly EventRow[]
}
