/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * Local Claims & imports scaffolding aligned to the product reference.
 * NOT production queue data and NOT backed by a real API.
 * ---------------------------------------------------------------------------
 */

import type { ClaimsImportsDashboardData } from '@/features/claims-imports/types/claims-imports.types'

export const CLAIMS_IMPORTS_MOCK_DASHBOARD: ClaimsImportsDashboardData = {
  claims: [
    {
      id: 'arabian-venues',
      tab: 'open',
      companyPageKey: 'arabianVenues',
      initials: 'AV',
      avatarTone: 'sky',
      importMonthKey: 'aug14',
      listingsCount: 0,
      claimantNameKey: 'mahaAlsubaie',
      claimantEmailKey: 'mahaAlsubaieEmail',
      evidenceId: 'domainMatches',
      submittedKey: 'sep27',
    },
    {
      id: 'jeddah-sound-hire',
      tab: 'open',
      companyPageKey: 'jeddahSoundHire',
      initials: 'JS',
      avatarTone: 'mint',
      importMonthKey: 'aug14',
      listingsCount: 2,
      claimantNameKey: 'omarAlharbi',
      claimantEmailKey: 'omarAlharbiEmail',
      evidenceId: 'needsDocuments',
      submittedKey: 'sep26',
    },
    {
      id: 'najd-productions',
      tab: 'decided',
      companyPageKey: 'najdProductions',
      initials: 'NP',
      avatarTone: 'amber',
      importMonthKey: 'jul22',
      listingsCount: 5,
      claimantNameKey: 'nouraAlqahtani',
      claimantEmailKey: 'nouraAlqahtaniEmail',
      evidenceId: 'approved',
      submittedKey: 'sep20',
    },
    {
      id: 'eventlink-ksa',
      tab: 'decided',
      companyPageKey: 'eventlinkKsa',
      initials: 'EL',
      avatarTone: 'violet',
      importMonthKey: 'aug2',
      listingsCount: 1,
      claimantNameKey: 'faisalAlotaibi',
      claimantEmailKey: 'faisalAlotaibiEmail',
      evidenceId: 'rejected',
      submittedKey: 'sep18',
    },
  ],
  recentImports: [
    {
      id: 'riyadh-tech-summit',
      fileNameKey: 'riyadhTechSummit',
      statusId: 'processing',
      progressPercent: 64,
      detailKey: 'riyadhTechSummitDetail',
    },
    {
      id: 'venues-directory-aug',
      fileNameKey: 'venuesDirectoryAug',
      statusId: 'doneWithErrors',
      progressPercent: 100,
      detailKey: 'venuesDirectoryAugDetail',
      showErrorReportLink: true,
    },
    {
      id: 'jeddah-design-week',
      fileNameKey: 'jeddahDesignWeek',
      statusId: 'done',
      progressPercent: 100,
      detailKey: 'jeddahDesignWeekDetail',
    },
  ],
}
