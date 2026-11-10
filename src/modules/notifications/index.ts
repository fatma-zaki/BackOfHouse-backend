// Public API of the notifications module (nest-module-map.md §2.1 rule 1). A leaf
// consumer: only surfaces and the worker import it (module-dependency-map.md C-8).
// NotificationsService is internal; producers reach it through outbox events.
export { NotificationsModule } from './notifications.module';
export { DevicesService } from './services/devices.service';
export { PreferencesService, type PreferenceView } from './services/preferences.service';
export { DeliveryService, type DeliveryRun } from './services/delivery.service';
export { MemberFeedService, NOTIFICATION_SOURCE, type MemberNotificationView } from './services/member-feed.service';
export { StaffBellService, type StaffNotificationView } from './services/staff-bell.service';
export { STAFF_NOTIFICATION_CATALOG } from './domain/staff-catalog';
export { NOTIFICATION_CATALOG, type NotificationChannel } from './domain/catalog';
export { PUSH_SENDER, FakePushSender, type PushSender } from './infrastructure/push-sender';
export { EMAIL_SENDER, DevEmailSender, type EmailSender } from './infrastructure/email-sender';
