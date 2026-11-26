/**
 * DEMO — My Work role homes. Not connected to a real queue / desk / tickets API.
 */

import type {
  AnalystHomeData,
  MyDeskData,
  MyQueueData,
  MyTicketsData,
} from '@/features/my-work/types/my-work.types'

export const MY_QUEUE_MOCK: MyQueueData = {
  kpis: [
    { id: 'waiting', labelKey: 'waiting', valueKey: 'waiting' },
    {
      id: 'dueToday',
      labelKey: 'dueToday',
      valueKey: 'dueToday',
      secondaryKey: 'oneOverdue',
      secondaryTone: 'danger',
    },
    {
      id: 'reviewedWeek',
      labelKey: 'reviewedWeek',
      valueKey: 'reviewedWeek',
      secondaryKey: 'plusSixVsLastWeek',
    },
    {
      id: 'medianTime',
      labelKey: 'medianTime',
      valueKey: 'medianTime',
      secondaryKey: 'targetUnder24h',
      secondaryTone: 'neutral',
    },
  ],
  upNext: [
    {
      id: '1',
      titleKey: 'stageManager',
      metaKey: 'stageManagerMeta',
      queueKey: 'listing',
      queueTone: 'info',
      slaKey: 'twoHOverdue',
      slaTone: 'destructive',
      to: 'listings',
    },
    {
      id: '2',
      titleKey: 'quickCash',
      metaKey: 'quickCashMeta',
      queueKey: 'report',
      queueTone: 'destructive',
      slaKey: 'oneHLeft',
      slaTone: 'warning',
      to: 'moderation',
    },
    {
      id: '3',
      titleKey: 'creativeExpo',
      metaKey: 'creativeExpoMeta',
      queueKey: 'verification',
      queueTone: 'info',
      slaKey: 'oneDayLeft',
      slaTone: 'success',
      to: 'verification',
    },
    {
      id: '4',
      titleKey: 'summerCoop',
      metaKey: 'summerCoopMeta',
      queueKey: 'listing',
      queueTone: 'info',
      slaKey: 'fourHLeft',
      slaTone: 'warning',
      to: 'listings',
    },
    {
      id: '5',
      titleKey: 'arabianVenues',
      metaKey: 'arabianVenuesMeta',
      queueKey: 'claim',
      queueTone: 'success',
      slaKey: 'twoDaysLeft',
      slaTone: 'success',
      to: 'claims',
    },
    {
      id: '6',
      titleKey: 'stageLighting',
      metaKey: 'stageLightingMeta',
      queueKey: 'supplierReq',
      queueTone: 'warning',
      slaKey: 'tenHLeft',
      slaTone: 'success',
      to: 'supplierRequests',
    },
  ],
  guidelines: [
    { id: 'company', titleKey: 'checkCompany', bodyKey: 'checkCompanyBody' },
    { id: 'fees', titleKey: 'noFees', bodyKey: 'noFeesBody' },
    { id: 'contact', titleKey: 'contactInApp', bodyKey: 'contactInAppBody' },
    { id: 'specific', titleKey: 'beSpecific', bodyKey: 'beSpecificBody' },
  ],
  recentDecisions: [
    {
      id: '1',
      titleKey: 'avTechnician',
      metaKey: 'avTechnicianMeta',
      outcomeKey: 'approved',
      outcomeTone: 'success',
    },
    {
      id: '2',
      titleKey: 'riyadhFront',
      metaKey: 'riyadhFrontMeta',
      outcomeKey: 'verified',
      outcomeTone: 'success',
    },
    {
      id: '3',
      titleKey: 'weekendStage',
      metaKey: 'weekendStageMeta',
      outcomeKey: 'changesRequested',
      outcomeTone: 'warning',
    },
    {
      id: '4',
      titleKey: 'promotersWanted',
      metaKey: 'promotersWantedMeta',
      outcomeKey: 'rejected',
      outcomeTone: 'destructive',
    },
  ],
}

export const MY_DESK_MOCK: MyDeskData = {
  kpis: [
    { id: 'drafts', labelKey: 'drafts', valueKey: 'drafts' },
    { id: 'scheduled', labelKey: 'scheduled', valueKey: 'scheduled' },
    {
      id: 'publishedSep',
      labelKey: 'publishedSep',
      valueKey: 'publishedSep',
      secondaryKey: 'plusFourVsAug',
    },
    {
      id: 'avgReads',
      labelKey: 'avgReads',
      valueKey: 'avgReads',
      secondaryKey: 'plusEighteenVsAug',
    },
  ],
  week: [
    {
      id: 'sun',
      dayKey: 'sun28',
      today: true,
      items: [
        {
          labelKey: 'riyadhSeasonDraft',
          tone: 'warning',
          href: '/admin/news',
        },
      ],
    },
    { id: 'mon', dayKey: 'mon29', items: [] },
    { id: 'tue', dayKey: 'tue30', items: [] },
    {
      id: 'wed',
      dayKey: 'wed1',
      items: [
        {
          labelKey: 'safetyOfficers',
          tone: 'info',
          href: '/admin/news',
        },
      ],
    },
    {
      id: 'thu',
      dayKey: 'thu2',
      items: [
        {
          labelKey: 'crewOfMonth',
          tone: 'info',
          href: '/admin/news',
        },
      ],
    },
    { id: 'fri', dayKey: 'fri3', items: [] },
    { id: 'sat', dayKey: 'sat4', items: [] },
  ],
  drafts: [
    {
      id: 'season',
      titleKey: 'riyadhSeason',
      categoryKey: 'opportunities',
      languagesKey: 'enArReady',
      readinessKey: 'readyToSchedule',
      editedKey: 'twoMinAgo',
      href: '/admin/news',
    },
    {
      id: 'rigging',
      titleKey: 'riggingCrew',
      categoryKey: 'crewStories',
      languagesKey: 'enReadyArMissing',
      readinessKey: 'bothLanguagesNeeded',
      editedKey: 'yesterday',
      href: '/admin/news',
    },
    {
      id: 'women',
      titleKey: 'womenLeading',
      categoryKey: 'features',
      languagesKey: 'arReadyEnMissing',
      readinessKey: 'bothLanguagesNeeded',
      editedKey: 'sep24',
      href: '/admin/news',
    },
  ],
  mostRead: [
    { id: 'alula', labelKey: 'alula', value: 5120 },
    { id: 'jeddah', labelKey: 'jeddah', value: 3410 },
    { id: 'rigging', labelKey: 'fiveRigging', value: 2260 },
    { id: 'meetup', labelKey: 'crewMeetup', value: 1480 },
  ],
}

export const MY_TICKETS_MOCK: MyTicketsData = {
  kpis: [
    { id: 'assigned', labelKey: 'assigned', valueKey: 'assigned' },
    { id: 'shared', labelKey: 'shared', valueKey: 'shared' },
    {
      id: 'closeDeadline',
      labelKey: 'closeDeadline',
      valueKey: 'closeDeadline',
      secondaryKey: 'oneOverdue',
      secondaryTone: 'danger',
    },
    {
      id: 'firstReply',
      labelKey: 'firstReply',
      valueKey: 'firstReply',
      secondaryKey: 'targetFourH',
    },
  ],
  tickets: [
    {
      id: '4830',
      subjectKey: 'secondRecruiter',
      fromKey: 'saudiEvents',
      topicKey: 'company',
      topicTone: 'success',
      slaKey: 'overdue20',
      slaTone: 'destructive',
      queue: 'mine',
    },
    {
      id: '4821',
      subjectKey: 'pointsMissing',
      fromKey: 'faisal',
      topicKey: 'points',
      topicTone: 'info',
      slaKey: 'oneHLeft',
      slaTone: 'warning',
      queue: 'mine',
    },
    {
      id: '4826',
      subjectKey: 'studentId',
      fromKey: 'noura',
      topicKey: 'verification',
      topicTone: 'warning',
      slaKey: 'threeHLeft',
      slaTone: 'success',
      queue: 'shared',
    },
    {
      id: '4802',
      subjectKey: 'redeemedCode',
      fromKey: 'lama',
      topicKey: 'points',
      topicTone: 'info',
      slaKey: 'waitingMember',
      slaTone: 'neutral',
      queue: 'mine',
    },
  ],
  capabilities: [
    { id: 'reply', textKey: 'reply', allowed: true },
    { id: 'points', textKey: 'adjustPoints', allowed: true },
    { id: 'resend', textKey: 'resendEmails', allowed: true },
    { id: 'suspend', textKey: 'suspend', allowed: false },
    { id: 'export', textKey: 'exportPii', allowed: false },
  ],
  byTopic: [
    { id: 'points', labelKey: 'points', value: 38 },
    { id: 'account', labelKey: 'account', value: 21 },
    { id: 'verification', labelKey: 'verification', value: 14 },
    { id: 'company', labelKey: 'company', value: 11 },
    { id: 'other', labelKey: 'other', value: 6 },
  ],
}

const weekly = [620, 710, 690, 820, 870, 940, 1010, 1120, 1260, 1420]

export const ANALYST_HOME_MOCK: AnalystHomeData = {
  kpis: [
    {
      id: 'activeUsers',
      labelKey: 'activeUsers',
      valueKey: 'activeUsers',
      secondaryKey: 'plusTwelve',
    },
    {
      id: 'applicationsSep',
      labelKey: 'applicationsSep',
      valueKey: 'applicationsSep',
      secondaryKey: 'plusEighteen',
    },
    {
      id: 'attendance',
      labelKey: 'attendance',
      valueKey: 'attendance',
      secondaryKey: 'minusThreePts',
      secondaryTone: 'danger',
    },
    {
      id: 'pointsRedeemed',
      labelKey: 'pointsRedeemed',
      valueKey: 'pointsRedeemed',
    },
  ],
  savedReports: [
    {
      id: 'monthly',
      titleKey: 'monthlyOverview',
      descriptionKey: 'leadership',
      scheduleKey: 'firstOfMonth',
      lastRunKey: 'sep1',
      formats: ['PDF', 'Excel'],
    },
    {
      id: 'funnel',
      titleKey: 'applicationsFunnel',
      descriptionKey: 'byTypeCity',
      scheduleKey: 'weeklySun',
      lastRunKey: 'today',
      formats: ['CSV', 'Excel'],
    },
    {
      id: 'attendance',
      titleKey: 'eventAttendance',
      descriptionKey: 'registeredVsVerified',
      scheduleKey: 'afterEachEvent',
      lastRunKey: 'sep27',
      formats: ['CSV', 'PDF'],
    },
    {
      id: 'points',
      titleKey: 'pointsEconomy',
      descriptionKey: 'earnedRedeemed',
      scheduleKey: 'monthly',
      lastRunKey: 'sep1',
      formats: ['Excel'],
    },
    {
      id: 'response',
      titleKey: 'companyResponse',
      descriptionKey: 'timeToFirstReply',
      scheduleKey: 'notScheduled',
      lastRunKey: 'sep14',
      formats: ['CSV'],
    },
  ],
  applicationsPerWeek: weekly.map((value, index) => ({
    id: `w${index + 1}`,
    labelKey: `w${index + 1}`,
    value,
  })),
  dataAccess: [
    { id: 'dashboards', textKey: 'allDashboards', allowed: true },
    { id: 'exports', textKey: 'exportsNoContact', allowed: true },
    { id: 'pii', textKey: 'piiWithSuperAdmin', allowed: false },
  ],
}
