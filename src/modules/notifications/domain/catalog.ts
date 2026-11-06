import type { Locale } from '../../../common/i18n/locale';

/** Delivery channels besides the in-app row, which every notification gets. */
export const NOTIFICATION_CHANNELS = ['PUSH', 'EMAIL'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** contracts/app `NotificationCategory` and `NotificationTargetType`. */
export type NotificationCategory = 'OPPORTUNITIES' | 'EVENTS' | 'CREDENTIALS' | 'NEWS';
export type NotificationTargetType = 'OPPORTUNITY' | 'EVENT' | 'REWARD' | 'ARTICLE' | 'PROFILE';

export interface NotificationTemplates {
  title: string;
  body: string;
  emailSubject?: string;
  emailText?: string;
}

export interface CatalogEntry {
  type: string;
  category: NotificationCategory;
  channels: readonly NotificationChannel[];
  /** Security and transactional types: preferences cannot turn them off (database-entities.md §11). */
  mandatory: boolean;
  /** Push waits for the end of `push_quiet_hours`. Off only for alerts the member must see at once. */
  respectsQuietHours: boolean;
  /** Variables the handler must supply (besides `full_name`, which delivery adds). */
  variables: readonly string[];
  templates: Record<Locale, NotificationTemplates>;
}

/**
 * The notification catalog (RG-14): which types exist, on which channels, and their
 * bilingual text. Entries are added with the event that feeds them; templates use
 * `{{name}}` placeholders, and both languages must use the same ones (catalog.spec.ts).
 */
export const NOTIFICATION_CATALOG: readonly CatalogEntry[] = [
  {
    // Fed by `user.password.changed` (identity, password reset). Security alert.
    type: 'account.password_changed',
    category: 'CREDENTIALS',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: false,
    variables: [],
    templates: {
      en: {
        title: 'Your password was changed',
        body: "The password for your Back of House account was just changed. If this wasn't you, reset it now.",
        emailSubject: 'Your Back of House password was changed',
        emailText:
          'Hello {{full_name}},\n\n' +
          'The password for your Back of House account was just changed, and every signed-in device was signed out.\n\n' +
          "If this wasn't you, reset your password from the app right away and contact support.\n\n" +
          'The Back of House team',
      },
      ar: {
        title: 'تم تغيير كلمة المرور',
        body: 'تم تغيير كلمة مرور حسابك في Back of House الآن. إذا لم تكن أنت، أعد تعيينها فورًا.',
        emailSubject: 'تم تغيير كلمة مرور حسابك في Back of House',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'تم تغيير كلمة مرور حسابك في Back of House الآن، وتم تسجيل الخروج من كل الأجهزة.\n\n' +
          'إذا لم تكن أنت، أعد تعيين كلمة المرور من التطبيق فورًا وتواصل مع الدعم.\n\n' +
          'فريق Back of House',
      },
    },
  },
];

const BY_TYPE = new Map(NOTIFICATION_CATALOG.map((entry) => [entry.type, entry]));

export function catalogEntry(type: string): CatalogEntry {
  const entry = BY_TYPE.get(type);
  if (!entry) throw new Error(`Unknown notification type "${type}"`);
  return entry;
}

export function isKnownType(type: string): boolean {
  return BY_TYPE.has(type);
}
