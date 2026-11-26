/**
 * ---------------------------------------------------------------------------
 * DEMO / ILLUSTRATIVE DATA ONLY
 * ---------------------------------------------------------------------------
 * Local Broadcasts admin scaffolding aligned to the product reference.
 * NOT production messaging data and NOT backed by a real API.
 * ---------------------------------------------------------------------------
 */

import type { BroadcastsDashboardData } from '@/features/broadcasts/types/broadcasts.types'

export const BROADCASTS_MOCK_DASHBOARD: BroadcastsDashboardData = {
  audienceMatchCount: 4_210,
  audienceRules: [
    {
      id: 'city-riyadh',
      fieldKey: 'city',
      operatorKey: 'is',
      valueKey: 'riyadh',
    },
    {
      id: 'account-individual',
      fieldKey: 'account',
      operatorKey: 'is',
      valueKey: 'individual',
    },
    {
      id: 'interests-stage-av-hospitality',
      fieldKey: 'interestedIn',
      operatorKey: 'anyOf',
      valueKey: 'stageAvHospitality',
    },
  ],
  defaultChannels: {
    push: true,
    email: true,
    inApp: false,
  },
  draftMessage: {
    en: {
      title: '1,200 crew roles just opened',
      body: 'Riyadh Season is hiring stage, AV and hospitality crews. Apply on Back of House before Oct 5.',
    },
    ar: {
      title: 'فُتحت 1,200 فرصة طاقم',
      body: 'موسم الرياض يوظّف طاقم المسرح والصوت والصورة والضيافة. قدّم عبر Back of House قبل 5 أكتوبر.',
    },
  },
  rows: [
    {
      id: 'crew-roles-opened',
      titleKey: 'crewRolesOpened',
      channelsMetaKey: 'pushEmailRiyadh',
      sentTo: 4_210,
      openedPercent: null,
      statusId: 'scheduled',
    },
    {
      id: 'jeddah-design-week',
      titleKey: 'jeddahDesignWeekLastCall',
      channelsMetaKey: 'pushJeddah',
      sentTo: 3_880,
      openedPercent: 42,
      statusId: 'sent',
    },
    {
      id: 'rewards-catalog',
      titleKey: 'rewardsCatalog',
      channelsMetaKey: 'inAppEveryone',
      sentTo: 18_020,
      openedPercent: 61,
      statusId: 'sent',
    },
    {
      id: 'verify-company',
      titleKey: 'verifyCompany',
      channelsMetaKey: 'emailUnverifiedCompanies',
      sentTo: 434,
      openedPercent: 38,
      statusId: 'sent',
    },
    {
      id: 'crew-meetup-dammam',
      titleKey: 'crewMeetupDammam',
      channelsMetaKey: 'pushDammam',
      sentTo: 2_380,
      openedPercent: 35,
      statusId: 'sent',
    },
    {
      id: 'profile-highlight',
      titleKey: 'profileHighlight',
      channelsMetaKey: 'emailPointsOver500',
      sentTo: null,
      openedPercent: null,
      statusId: 'draft',
    },
  ],
}
