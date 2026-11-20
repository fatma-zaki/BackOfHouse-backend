import type { Locale } from '../../../common/i18n/locale';

/** contracts/admin `Notification.type`: the bell's grouping. */
export type StaffNotificationCategory =
  'APPLICATION' | 'EVENT' | 'POINTS' | 'NEWS' | 'REWARD' | 'OPPORTUNITY_REVIEW' | 'VERIFICATION' | 'SYSTEM';

export interface StaffCatalogEntry {
  type: string;
  category: StaffNotificationCategory;
  /** Staff whose role holds this permission receive it (docs/admin 06 "Notifications to admins"). */
  permission: string;
  templates: Record<Locale, { title: string; body: string }>;
}

/**
 * The admin bell catalog: new items in a role's queue, and later overdue items, exports
 * and imports. Templates use `{{name}}` placeholders; both languages use the same ones.
 */
export const STAFF_NOTIFICATION_CATALOG: readonly StaffCatalogEntry[] = [
  {
    // Fed by `verification.submitted` (an individual sent documents for review).
    type: 'staff.verification_submitted',
    category: 'VERIFICATION',
    permission: 'verification.view',
    templates: {
      en: { title: 'New verification request', body: 'An individual sent documents for verification review.' },
      ar: { title: 'طلب توثيق جديد', body: 'أرسل أحد الأفراد مستندات للمراجعة والتوثيق.' },
    },
  },
  {
    // Fed by `opportunity.submitted` (a new listing, or an update of a live one, waits for review).
    type: 'staff.opportunity_submitted',
    category: 'OPPORTUNITY_REVIEW',
    permission: 'opportunities.review',
    templates: {
      en: { title: 'New listing to review', body: 'A company sent a listing for review.' },
      ar: { title: 'إعلان جديد للمراجعة', body: 'أرسلت إحدى الشركات إعلانًا للمراجعة.' },
    },
  },
  {
    // Fed by `opportunity.review_overdue` (the opportunity.sla job, once per submission).
    type: 'staff.opportunity_overdue',
    category: 'OPPORTUNITY_REVIEW',
    permission: 'opportunities.review',
    templates: {
      en: { title: 'Listing review overdue', body: 'A listing has waited longer than the review deadline.' },
      ar: { title: 'تأخرت مراجعة إعلان', body: 'انتظر أحد الإعلانات أكثر من المهلة المحددة للمراجعة.' },
    },
  },
];

const BY_TYPE = new Map(STAFF_NOTIFICATION_CATALOG.map((entry) => [entry.type, entry]));

export function staffCatalogEntry(type: string): StaffCatalogEntry {
  const entry = BY_TYPE.get(type);
  if (!entry) throw new Error(`Unknown staff notification type "${type}"`);
  return entry;
}

export function isKnownStaffType(type: string): boolean {
  return BY_TYPE.has(type);
}
