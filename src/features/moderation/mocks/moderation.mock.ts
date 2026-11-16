/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * Local Moderation queue scaffolding aligned to the product reference.
 * NOT production queue data and NOT backed by a real API.
 * ---------------------------------------------------------------------------
 */

import type {
  ModerationDashboardData,
  ModerationReport,
} from '@/features/moderation/types/moderation.types'

export const MODERATION_MOCK_REPORTS: readonly ModerationReport[] = [
  {
    id: 'quick-cash-promoters',
    titleKey: 'quickCashPromoters',
    subtitleKey: 'asksApplicantsFee',
    contentTypeId: 'listing',
    reportCount: 5,
    whenKey: 'h1',
    statusId: 'open',
    metaKey: 'unverifiedSep28',
    contentQuoteKey: 'quickCashPromotersQuote',
    reportReasons: [
      { reasonKey: 'scamOrFee', count: 4 },
      { reasonKey: 'misleadingPay', count: 3 },
      { reasonKey: 'offPlatformContact', count: 2 },
    ],
    reporterQuotes: [
      { quoteKey: 'reporter1', attributionKey: 'applicantJeddah' },
      { quoteKey: 'reporter2', attributionKey: 'applicantRiyadh' },
    ],
    accountHistoryKey: 'quickCashAccountHistory',
  },
  {
    id: 'majed-b-profile-photo',
    titleKey: 'majedBProfilePhoto',
    subtitleKey: 'inappropriateImage',
    contentTypeId: 'profile',
    reportCount: 2,
    whenKey: 'h5',
    statusId: 'open',
    metaKey: 'profilePhotoMeta',
    contentQuoteKey: 'majedBQuote',
    reportReasons: [{ reasonKey: 'inappropriateImage', count: 2 }],
    reporterQuotes: [
      { quoteKey: 'majedReporter1', attributionKey: 'memberRiyadh' },
    ],
    accountHistoryKey: 'majedAccountHistory',
  },
  {
    id: 'arabian-lights-quote',
    titleKey: 'arabianLightsQuote',
    subtitleKey: 'contactInResponse',
    contentTypeId: 'response',
    reportCount: 1,
    whenKey: 'h9',
    statusId: 'autoFlagged',
    metaKey: 'responseMeta',
    contentQuoteKey: 'arabianLightsQuoteBody',
    reportReasons: [{ reasonKey: 'offPlatformContact', count: 1 }],
    reporterQuotes: [],
    accountHistoryKey: 'arabianLightsAccountHistory',
  },
  {
    id: 'quick-crew-ksa',
    titleKey: 'quickCrewKsa',
    subtitleKey: 'companyDidntPay',
    contentTypeId: 'company',
    reportCount: 7,
    whenKey: 'd1',
    statusId: 'open',
    metaKey: 'companyReportMeta',
    contentQuoteKey: 'quickCrewKsaQuote',
    reportReasons: [
      { reasonKey: 'unpaidWork', count: 5 },
      { reasonKey: 'misleadingPay', count: 2 },
    ],
    reporterQuotes: [
      { quoteKey: 'crewReporter1', attributionKey: 'crewMemberJeddah' },
    ],
    accountHistoryKey: 'quickCrewAccountHistory',
  },
  {
    id: 'stage-hand-weekend',
    titleKey: 'stageHandWeekend',
    subtitleKey: 'phoneInDescription',
    contentTypeId: 'listing',
    reportCount: 0,
    whenKey: 'd1b',
    statusId: 'autoFlagged',
    metaKey: 'autoFlaggedListingMeta',
    contentQuoteKey: 'stageHandWeekendQuote',
    reportReasons: [{ reasonKey: 'offPlatformContact', count: 1 }],
    reporterQuotes: [],
    accountHistoryKey: 'stageHandAccountHistory',
  },
  {
    id: 'omar-g-message',
    titleKey: 'omarGMessage',
    subtitleKey: 'harassment',
    contentTypeId: 'profile',
    reportCount: 1,
    whenKey: 'd3',
    statusId: 'resolvedWarned',
    metaKey: 'messageMeta',
    contentQuoteKey: 'omarGQuote',
    reportReasons: [{ reasonKey: 'harassment', count: 1 }],
    reporterQuotes: [
      { quoteKey: 'omarReporter1', attributionKey: 'memberDammam' },
    ],
    accountHistoryKey: 'omarAccountHistory',
  },
]

export const MODERATION_MOCK_DASHBOARD: ModerationDashboardData = {
  reports: MODERATION_MOCK_REPORTS,
  reasonFilterKeys: [
    'scamOrFee',
    'misleadingPay',
    'offPlatformContact',
    'inappropriateImage',
    'unpaidWork',
    'harassment',
  ],
}
