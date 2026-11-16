/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * This module powers local Overview scaffolding. Values are aligned to the
 * product reference screenshot for visual development and are NOT production
 * metrics, NOT backed by a real API, and MUST NOT be treated as live data.
 * ---------------------------------------------------------------------------
 */

import { OVERVIEW_DEFAULT_RANGE } from '@/features/overview/constants'
import type {
  OverviewActivityItem,
  OverviewAttentionItem,
  OverviewFunnel,
  OverviewKpiMetric,
  OverviewSignupPoint,
} from '@/features/overview/types/overview.types'

/** @deprecated Prefer OVERVIEW_DEFAULT_RANGE from constants. */
export const OVERVIEW_MOCK_DEFAULT_RANGE = OVERVIEW_DEFAULT_RANGE


/**
 * Daily new sign-ups for September 2026 (illustrative).
 * Peak 66 on 2026-09-27; series sums to 1,200 for the full mock month.
 */
export const OVERVIEW_MOCK_SIGNUP_POINTS: readonly OverviewSignupPoint[] = [
  { date: '2026-09-01', count: 28 },
  { date: '2026-09-02', count: 32 },
  { date: '2026-09-03', count: 30 },
  { date: '2026-09-04', count: 41 },
  { date: '2026-09-05', count: 36 },
  { date: '2026-09-06', count: 45 },
  { date: '2026-09-07', count: 39 },
  { date: '2026-09-08', count: 43 },
  { date: '2026-09-09', count: 37 },
  { date: '2026-09-10', count: 48 },
  { date: '2026-09-11', count: 40 },
  { date: '2026-09-12', count: 35 },
  { date: '2026-09-13', count: 51 },
  { date: '2026-09-14', count: 44 },
  { date: '2026-09-15', count: 38 },
  { date: '2026-09-16', count: 46 },
  { date: '2026-09-17', count: 42 },
  { date: '2026-09-18', count: 50 },
  { date: '2026-09-19', count: 36 },
  { date: '2026-09-20', count: 54 },
  { date: '2026-09-21', count: 45 },
  { date: '2026-09-22', count: 40 },
  { date: '2026-09-23', count: 47 },
  { date: '2026-09-24', count: 52 },
  { date: '2026-09-25', count: 39 },
  { date: '2026-09-26', count: 56 },
  { date: '2026-09-27', count: 66 },
  { date: '2026-09-28', count: 40 },
]

/** Snapshot KPIs from the reference — not range-filterable with this mock. */
export const OVERVIEW_MOCK_KPIS: readonly OverviewKpiMetric[] = [
  {
    id: 'totalUsers',
    value: 18_420,
    secondary: { kind: 'percentVsPreviousMonth', value: 8.2 },
  },
  {
    id: 'companies',
    value: 1_146,
    secondary: { kind: 'verifiedCount', value: 214 },
  },
  {
    id: 'liveListings',
    value: 342,
    secondary: { kind: 'deltaThisMonth', value: 21 },
  },
  {
    id: 'applications',
    value: 4_870,
    secondary: { kind: 'percentVsPreviousMonth', value: 12 },
  },
  {
    id: 'supplierRequests',
    value: 96,
    secondary: { kind: 'deltaThisMonth', value: 9 },
  },
]

/**
 * Attention queue snapshot from the reference.
 * Counts are static demo values (not filtered by date range).
 */
export const OVERVIEW_MOCK_ATTENTION: readonly OverviewAttentionItem[] = [
  {
    id: 'listingsAwaitingReview',
    count: 7,
    tone: 'warning',
    detail: { oldestWaitingHours: 26, slaHours: 24 },
    href: '/admin/listings',
  },
  {
    id: 'verificationRequests',
    count: 5,
    tone: 'info',
    detail: { individuals: 3, companies: 2 },
    href: '/admin/verification',
  },
  {
    id: 'reportedContent',
    count: 3,
    tone: 'destructive',
    detail: { highPriority: 1 },
    href: '/admin/moderation',
  },
  {
    id: 'openSupportTickets',
    count: 11,
    tone: 'neutral',
    detail: { unassigned: 4 },
    href: '/admin/support',
  },
]

/**
 * Opportunity funnel stages for a fixed “last 28 days” snapshot.
 * Conversion rate is derived in the adapter (not hardcoded here).
 * Not recomputed from the selected picker range in this mock.
 */
export const OVERVIEW_MOCK_FUNNEL_STAGES: OverviewFunnel['stages'] = [
  { id: 'listingViews', value: 48_200 },
  { id: 'applicationsStarted', value: 6_910 },
  { id: 'submitted', value: 4_870 },
  { id: 'shortlisted', value: 1_120 },
  { id: 'selected', value: 238 },
]

/**
 * Fixed “now” for relative activity timestamps in the Overview reference
 * (12m / 2h / 3h / 6h). Illustrative only — not live server time.
 */
export const OVERVIEW_MOCK_ACTIVITY_NOW = new Date('2026-09-28T11:00:00.000Z')

/**
 * Recent activity rows (illustrative).
 * `occurredAt` timestamps fall within Sep 2026 so the default range includes them.
 */
export const OVERVIEW_MOCK_ACTIVITY: readonly OverviewActivityItem[] = [
  {
    id: 'act-1',
    tone: 'primary',
    occurredAt: '2026-09-28T10:48:00.000Z',
    message: {
      actorKey: 'saudiEventsGroup',
      targetKey: 'stageManager',
    },
  },
  {
    id: 'act-2',
    tone: 'success',
    occurredAt: '2026-09-28T09:00:00.000Z',
    message: {
      actorKey: 'fatmaZaki',
      targetKey: 'eventProducer',
    },
  },
  {
    id: 'act-3',
    tone: 'info',
    occurredAt: '2026-09-28T08:00:00.000Z',
    message: {
      actorKey: 'riyadhFrontEvents',
      targetKey: 'stageAndLighting',
    },
  },
  {
    id: 'act-4',
    tone: 'destructive',
    occurredAt: '2026-09-28T05:00:00.000Z',
    message: {
      actorKey: 'listing',
      targetKey: 'quickCashPromoters',
    },
  },
]
