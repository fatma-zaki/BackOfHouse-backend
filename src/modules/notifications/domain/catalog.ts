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
  {
    // Fed by `verification.approved` (a reviewer approved the member's documents).
    type: 'verification.approved',
    category: 'CREDENTIALS',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: true,
    variables: [],
    templates: {
      en: {
        title: 'You are verified',
        body: 'Your documents were approved. Your profile now shows the verified badge.',
        emailSubject: 'Your Back of House profile is verified',
        emailText:
          'Hello {{full_name}},\n\n' +
          'Your verification documents were approved, and your profile now shows the verified badge.\n\n' +
          'The Back of House team',
      },
      ar: {
        title: 'تم توثيق حسابك',
        body: 'تمت الموافقة على مستنداتك، ويظهر الآن شعار التوثيق في ملفك.',
        emailSubject: 'تم توثيق ملفك في Back of House',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'تمت الموافقة على مستندات التوثيق، ويظهر الآن شعار التوثيق في ملفك.\n\n' +
          'فريق Back of House',
      },
    },
  },
  {
    // Fed by `verification.info_requested`; `message` is the reviewer's request to the member.
    type: 'verification.info_requested',
    category: 'CREDENTIALS',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['message'],
    templates: {
      en: {
        title: 'More information needed',
        body: 'Your verification needs more information: {{message}}',
        emailSubject: 'Your Back of House verification needs more information',
        emailText:
          'Hello {{full_name}},\n\n' +
          'The reviewer needs more information to verify you:\n\n{{message}}\n\n' +
          'Upload the documents again from the app and send the request.\n\n' +
          'The Back of House team',
      },
      ar: {
        title: 'مطلوب معلومات إضافية',
        body: 'يحتاج طلب التوثيق إلى معلومات إضافية: {{message}}',
        emailSubject: 'طلب التوثيق في Back of House يحتاج إلى معلومات إضافية',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'يحتاج المراجع إلى معلومات إضافية لتوثيق حسابك:\n\n{{message}}\n\n' +
          'ارفع المستندات من التطبيق مرة أخرى وأرسل الطلب.\n\n' +
          'فريق Back of House',
      },
    },
  },
  {
    // Fed by `verification.rejected`; `message` is the reviewer's reason.
    type: 'verification.rejected',
    category: 'CREDENTIALS',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['message'],
    templates: {
      en: {
        title: 'Verification not approved',
        body: 'Your verification was not approved: {{message}}',
        emailSubject: 'Your Back of House verification was not approved',
        emailText:
          'Hello {{full_name}},\n\n' +
          'Your verification was not approved:\n\n{{message}}\n\n' +
          'You can upload new documents from the app and send the request again.\n\n' +
          'The Back of House team',
      },
      ar: {
        title: 'لم تتم الموافقة على التوثيق',
        body: 'لم تتم الموافقة على طلب التوثيق: {{message}}',
        emailSubject: 'لم تتم الموافقة على طلب التوثيق في Back of House',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'لم تتم الموافقة على طلب التوثيق:\n\n{{message}}\n\n' +
          'يمكنك رفع مستندات جديدة من التطبيق وإرسال الطلب مرة أخرى.\n\n' +
          'فريق Back of House',
      },
    },
  },
  {
    // Fed by `moderation.case.resolved` with WARNED; `message` is the staff member's.
    type: 'moderation.warning',
    category: 'CREDENTIALS',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['message'],
    templates: {
      en: {
        title: 'A warning about your account',
        body: '{{message}}',
        emailSubject: 'A warning about your Back of House account',
        emailText:
          'Hello {{full_name}},\n\n' +
          'Our team reviewed a report about your account and is sending this warning:\n\n{{message}}\n\n' +
          'Please keep to the community rules. Repeated reports can lead to suspension.\n\n' +
          'The Back of House team',
      },
      ar: {
        title: 'تنبيه بخصوص حسابك',
        body: '{{message}}',
        emailSubject: 'تنبيه بخصوص حسابك في Back of House',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'راجع فريقنا بلاغًا عن حسابك ويرسل لك هذا التنبيه:\n\n{{message}}\n\n' +
          'يرجى الالتزام بقواعد المجتمع، فتكرار البلاغات قد يؤدي إلى إيقاف الحساب.\n\n' +
          'فريق Back of House',
      },
    },
  },
  {
    // Fed by `moderation.case.resolved` with CONTENT_REMOVED; `message` may be empty.
    type: 'moderation.content_removed',
    category: 'CREDENTIALS',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['message'],
    templates: {
      en: {
        title: 'Content removed',
        body: 'We removed one of your projects or listings after a review. {{message}}',
        emailSubject: 'We removed content from your Back of House profile',
        emailText:
          'Hello {{full_name}},\n\n' +
          'After reviewing a report, our team removed one of your projects.\n\n{{message}}\n\n' +
          'The Back of House team',
      },
      ar: {
        title: 'تمت إزالة محتوى',
        body: 'أزلنا أحد مشاريعك أو إعلاناتك بعد المراجعة. {{message}}',
        emailSubject: 'أزلنا محتوى من ملفك في Back of House',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'بعد مراجعة بلاغ، أزال فريقنا أحد مشاريعك.\n\n{{message}}\n\n' +
          'فريق Back of House',
      },
    },
  },
  {
    // Fed by `opportunity.published` (a reviewer approved a listing or its update). To the Company Account.
    type: 'opportunity.approved',
    category: 'OPPORTUNITIES',
    channels: ['PUSH'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['title'],
    templates: {
      en: { title: 'Your listing is live', body: '{{title}} was approved and is now live in the app.' },
      ar: { title: 'إعلانك منشور الآن', body: 'تمت الموافقة على {{title}} وأصبح منشورًا في التطبيق.' },
    },
  },
  {
    // Fed by `opportunity.changes_requested`; `message` is from Back of House, never the reviewer's name.
    type: 'opportunity.changes_requested',
    category: 'OPPORTUNITIES',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['title', 'message'],
    templates: {
      en: {
        title: 'Changes needed on {{title}}',
        body: 'Back of House asked for changes: {{message}}',
        emailSubject: 'Changes needed on your listing {{title}}',
        emailText:
          'Hello {{full_name}},\n\n' +
          'Back of House reviewed your listing {{title}} and asked for changes:\n\n{{message}}\n\n' +
          'Edit the listing in the app and send it for review again.\n\n' +
          'The Back of House team',
      },
      ar: {
        title: 'مطلوب تعديلات على {{title}}',
        body: 'طلب فريق Back of House تعديلات: {{message}}',
        emailSubject: 'مطلوب تعديلات على إعلانك {{title}}',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'راجع فريق Back of House إعلانك {{title}} وطلب التعديلات التالية:\n\n{{message}}\n\n' +
          'عدّل الإعلان من التطبيق وأرسله للمراجعة مرة أخرى.\n\n' +
          'فريق Back of House',
      },
    },
  },
  {
    // Fed by `opportunity.rejected` (a listing, or an update of a live one, was not approved).
    type: 'opportunity.rejected',
    category: 'OPPORTUNITIES',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['title', 'message'],
    templates: {
      en: {
        title: '{{title}} was not approved',
        body: '{{message}}',
        emailSubject: 'Your listing {{title}} was not approved',
        emailText:
          'Hello {{full_name}},\n\n' +
          'Back of House reviewed {{title}} and did not approve it:\n\n{{message}}\n\n' +
          'The Back of House team',
      },
      ar: {
        title: 'لم تتم الموافقة على {{title}}',
        body: '{{message}}',
        emailSubject: 'لم تتم الموافقة على إعلانك {{title}}',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'راجع فريق Back of House {{title}} ولم تتم الموافقة عليه:\n\n{{message}}\n\n' +
          'فريق Back of House',
      },
    },
  },
  {
    // Fed by `opportunity.closed` with closed_by STAFF (taken down by Back of House).
    type: 'opportunity.closed_by_staff',
    category: 'OPPORTUNITIES',
    channels: ['PUSH', 'EMAIL'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['title', 'message'],
    templates: {
      en: {
        title: '{{title}} was closed',
        body: 'Back of House closed your listing: {{message}}',
        emailSubject: 'Your listing {{title}} was closed',
        emailText:
          'Hello {{full_name}},\n\n' +
          'Back of House closed your listing {{title}}:\n\n{{message}}\n\n' +
          'The Back of House team',
      },
      ar: {
        title: 'تم إغلاق {{title}}',
        body: 'أغلق فريق Back of House إعلانك: {{message}}',
        emailSubject: 'تم إغلاق إعلانك {{title}}',
        emailText:
          'مرحبًا {{full_name}}،\n\n' +
          'أغلق فريق Back of House إعلانك {{title}}:\n\n{{message}}\n\n' +
          'فريق Back of House',
      },
    },
  },
  {
    // Fed by `opportunity.closed` with closed_by SYSTEM (the closing time passed).
    type: 'opportunity.expired',
    category: 'OPPORTUNITIES',
    channels: ['PUSH'],
    mandatory: false,
    respectsQuietHours: true,
    variables: ['title'],
    templates: {
      en: {
        title: '{{title}} has closed',
        body: 'Your listing reached its closing date and no longer takes applications.',
      },
      ar: { title: 'انتهى {{title}}', body: 'وصل إعلانك إلى تاريخ الإغلاق ولم يعد يستقبل طلبات.' },
    },
  },
  {
    // Fed by `opportunity.followers_alerted`: a company the member follows published a new
    // individual-facing listing (BQ-92 b). Optional: members can turn it off.
    type: 'opportunity.new_from_followed',
    category: 'OPPORTUNITIES',
    channels: ['PUSH'],
    mandatory: false,
    respectsQuietHours: true,
    variables: ['company_name', 'title'],
    templates: {
      en: { title: 'New from {{company_name}}', body: '{{company_name}} posted {{title}}.' },
      ar: { title: 'جديد من {{company_name}}', body: 'نشرت {{company_name}} فرصة جديدة: {{title}}.' },
    },
  },
  {
    // Fed by `supplier_response.submitted`: the buyer's Company Account hears of each response.
    type: 'supplier.response_received',
    category: 'OPPORTUNITIES',
    channels: ['PUSH'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['request_title', 'responder_name'],
    templates: {
      en: {
        title: 'New response to {{request_title}}',
        body: '{{responder_name}} responded to your supplier request.',
      },
      ar: { title: 'رد جديد على {{request_title}}', body: 'ردت {{responder_name}} على طلب التوريد الخاص بك.' },
    },
  },
  {
    // Fed by `supplier_response.status_changed`: the responder hears of every buyer move.
    type: 'supplier.response_status_changed',
    category: 'OPPORTUNITIES',
    channels: ['PUSH'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['request_title', 'buyer_name', 'status'],
    templates: {
      en: {
        title: 'Update on your response',
        body: '{{buyer_name}} updated your response to {{request_title}}: {{status}}.',
      },
      ar: {
        title: 'تحديث على ردك',
        body: 'حدّثت {{buyer_name}} حالة ردك على {{request_title}}: {{status}}.',
      },
    },
  },
  {
    // Fed by `application.status_changed`: every official status change, SUBMITTED and
    // WITHDRAWN included (docs/app/README.md section 4). The app words these itself from
    // `application_update`; this text is the push and the fallback.
    type: 'application.status_changed',
    category: 'OPPORTUNITIES',
    channels: ['PUSH'],
    mandatory: true,
    respectsQuietHours: true,
    variables: ['opportunity_title', 'status', 'application_id'],
    templates: {
      en: {
        title: 'Application update',
        body: 'There is an update on your application to {{opportunity_title}}.',
      },
      ar: {
        title: 'تحديث على طلبك',
        body: 'يوجد تحديث على طلبك للتقديم على {{opportunity_title}}.',
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
