/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * This module powers local Analytics scaffolding. Values are aligned to the
 * product reference for visual development and are NOT production metrics,
 * NOT backed by a real API, and MUST NOT be treated as live data.
 * ---------------------------------------------------------------------------
 */

import { ANALYTICS_DEFAULT_RANGE } from '@/features/analytics/constants'
import type {
  AnalyticsKpiMetric,
  AnalyticsMeterItem,
  AnalyticsTopListing,
  AnalyticsWeeklyPoint,
} from '@/features/analytics/types/analytics.types'

/** @deprecated Prefer ANALYTICS_DEFAULT_RANGE from constants. */
export const ANALYTICS_MOCK_DEFAULT_RANGE = ANALYTICS_DEFAULT_RANGE


export const ANALYTICS_MOCK_KPIS: readonly AnalyticsKpiMetric[] = [
  {
    id: 'activeUsers',
    value: '9,812',
    delta: { kind: 'percentVsMonth', value: 12, monthKey: 'aug', tone: 'up' },
  },
  {
    id: 'applicationsPerListing',
    value: '14.2',
    delta: { kind: 'pointsVsMonth', value: 1.8, monthKey: 'aug', tone: 'up' },
  },
  {
    id: 'eventAttendance',
    value: '71%',
    delta: { kind: 'ptsVsMonth', value: -3, monthKey: 'aug', tone: 'warning' },
  },
  {
    id: 'medianReviewTime',
    value: '9.4 h',
    delta: { kind: 'targetUnderHours', hours: 24, tone: 'neutral' },
  },
]

export const ANALYTICS_MOCK_REWARD_KPIS: readonly AnalyticsKpiMetric[] = [
  {
    id: 'pointsAwarded',
    value: '128,400',
  },
  {
    id: 'pointsRedeemed',
    value: '41,200',
  },
  {
    id: 'redemptions',
    value: '164',
    delta: { kind: 'percentVsMonth', value: 22, monthKey: 'aug', tone: 'up' },
  },
  {
    id: 'waitingFulfillment',
    value: '6',
    delta: { kind: 'oldestDays', days: 2, tone: 'warning' },
  },
]

/** 12-week weekly active users series from the reference analytics page. */
export const ANALYTICS_MOCK_WEEKLY_ACTIVE: readonly AnalyticsWeeklyPoint[] = [
  6940, 7120, 7310, 7280, 7650, 7900, 8120, 8410, 9660, 9980, 9540, 9812,
].map((value, index) => ({ week: index + 1, value }))

export const ANALYTICS_MOCK_MEMBERS_BY_CITY: readonly AnalyticsMeterItem[] = [
  { id: 'riyadh', value: 8640 },
  { id: 'jeddah', value: 4210 },
  { id: 'dammam', value: 2380 },
  { id: 'alula', value: 1190 },
  { id: 'other', value: 2000 },
]

export const ANALYTICS_MOCK_APPLICATIONS_BY_TYPE: readonly AnalyticsMeterItem[] =
  [
    { id: 'jobs', value: 2310 },
    { id: 'coop', value: 1140 },
    { id: 'volunteering', value: 820 },
    { id: 'projects', value: 600 },
  ]

export const ANALYTICS_MOCK_TOP_LISTINGS: readonly AnalyticsTopListing[] = [
  {
    id: 'eventCoordinator',
    views: '4,820',
    applications: '312',
    conversion: 6.5,
  },
  {
    id: 'summerCoop',
    views: '3,910',
    applications: '268',
    conversion: 6.9,
  },
  {
    id: 'expoCrew',
    views: '3,140',
    applications: '241',
    conversion: 7.7,
  },
]

/** Past-event verified attendance % from the reference events demo. */
export const ANALYTICS_MOCK_EVENT_ATTENDANCE: readonly AnalyticsMeterItem[] = [
  { id: 'riyadhTechSummit', value: 71, display: '71%' },
  { id: 'jeddahDesignWeek', value: 75, display: '75%' },
  { id: 'crewMeetupRigging', value: 82, display: '82%' },
  { id: 'alulaNightConcert', value: 64, display: '64%' },
  { id: 'expoBuildWeekend', value: 69, display: '69%' },
  { id: 'womenInEventsForum', value: 78, display: '78%' },
]

export const ANALYTICS_MOCK_REDEMPTIONS_BY_REWARD: readonly AnalyticsMeterItem[] =
  [
    { id: 'profileHighlight', value: 58 },
    { id: 'vipPass', value: 28 },
    { id: 'riggingCourse', value: 20 },
    { id: 'crewJacket', value: 100 },
    { id: 'coffeeOnUs', value: 160 },
  ]
