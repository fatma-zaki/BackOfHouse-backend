import type { SettingsDashboardData } from '@/features/settings/types/settings.types'

/** DEMO mock — not production configuration. Mirrors BackOfHouse-web settings seed. */
export const SETTINGS_DASHBOARD_MOCK: SettingsDashboardData = {
  general: {
    name: 'Back of House',
    email: 'support@backofhouse.sa',
    timezone: 'riyadh',
  },
  pointsRules: [
    {
      id: 'register-event',
      activityKey: 'registerEvent',
      points: '0',
      limitKey: 'locked',
      locked: true,
      enabled: false,
    },
    {
      id: 'verified-attendance',
      activityKey: 'verifiedAttendance',
      points: '150',
      limitKey: 'perEvent',
      enabled: true,
    },
    {
      id: 'volunteer-shift',
      activityKey: 'volunteerShift',
      points: '200',
      limitKey: 'confirmedByCompany',
      enabled: true,
    },
    {
      id: 'complete-profile',
      activityKey: 'completeProfile',
      points: '100',
      limitKey: 'once',
      enabled: true,
    },
    {
      id: 'friend-joins',
      activityKey: 'friendJoins',
      points: '50',
      limitKey: 'maxTenPerMonth',
      enabled: true,
    },
  ],
  categoryGroups: [
    {
      id: 'listing-types',
      labelKey: 'listingTypes',
      items: ['job', 'coOp', 'project', 'volunteering', 'supplierRequest'],
    },
    {
      id: 'crafts',
      labelKey: 'crafts',
      items: ['stage', 'lighting', 'av', 'rigging', 'hospitality', 'production'],
    },
    {
      id: 'cities',
      labelKey: 'cities',
      items: ['riyadh', 'jeddah', 'dammam', 'alUla', 'abha'],
    },
  ],
  reviewSafety: [
    { id: 'review-new-listing', enabled: true },
    { id: 'hide-contact', enabled: true },
    { id: 'auto-flag-fees', enabled: true },
    { id: 'verified-skip-review', enabled: false },
  ],
  notifications: [
    { id: 'new-listing-submitted', enabled: true },
    { id: 'verification-request', enabled: true },
    { id: 'ticket-waiting', enabled: true },
    { id: 'weekly-summary', enabled: false },
  ],
  legalDocs: [
    { id: 'termsOfUse', updatedKey: 'updatedAug2026' },
    { id: 'privacyPolicy', updatedKey: 'updatedAug2026' },
    { id: 'communityGuidelines', updatedKey: 'updatedAug2026' },
  ],
  languages: {
    arabic: true,
    defaultLanguage: 'english',
  },
}
