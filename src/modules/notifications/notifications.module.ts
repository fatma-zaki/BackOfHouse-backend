import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { CLOCK, Clock } from '../../common/clock/clock';
import { AppConfig } from '../../config/app.config';
import { JobsModule } from '../../platform/jobs/jobs.module';
import { JobsService } from '../../platform/jobs/jobs.service';
import { IdentityModule } from '../identity';
import { SettingsModule } from '../settings';
import { AccountEventsHandler } from './handlers/account-events.handler';
import { DevEmailSender, EMAIL_SENDER, EmailSender, NotConfiguredEmailSender } from './infrastructure/email-sender';
import { FcmPushSender } from './infrastructure/fcm-push-sender';
import { FakePushSender, NotConfiguredPushSender, PUSH_SENDER, PushSender } from './infrastructure/push-sender';
import { DeliveryService } from './services/delivery.service';
import { DevicesService } from './services/devices.service';
import { NotificationsService } from './services/notifications.service';
import { PreferencesService } from './services/preferences.service';

/** Every minute: due pushes after quiet hours, and retries. */
const DELIVER_CRON = '* * * * *';

const isLocalOrTest = (config: AppConfig) => config.app.appEnv === 'local' || config.app.appEnv === 'test';

/**
 * Notification delivery (nest-module-map.md §4.12). A leaf consumer: it listens to
 * outbox events and no business module imports it (module-dependency-map.md C-8).
 * Push goes through FCM when its service account is set; email through EMAIL_SENDER
 * until TQ-17 picks a provider. Local and test use in-memory senders; elsewhere an
 * unconfigured channel is SKIPPED with an alert log.
 */
@Module({
  imports: [JobsModule, IdentityModule, SettingsModule],
  providers: [
    NotificationsService,
    DeliveryService,
    DevicesService,
    PreferencesService,
    AccountEventsHandler,
    {
      provide: PUSH_SENDER,
      inject: [AppConfig, CLOCK],
      useFactory: (config: AppConfig, clock: Clock): PushSender => {
        if (config.notifications.fcm) return new FcmPushSender(config.notifications.fcm, clock);
        return isLocalOrTest(config)
          ? new FakePushSender(config.app.appEnv === 'local')
          : new NotConfiguredPushSender();
      },
    },
    {
      provide: EMAIL_SENDER,
      inject: [AppConfig],
      useFactory: (config: AppConfig): EmailSender =>
        isLocalOrTest(config) ? new DevEmailSender(config.app.appEnv === 'local') : new NotConfiguredEmailSender(),
    },
  ],
  exports: [DevicesService, PreferencesService, DeliveryService],
})
export class NotificationsModule implements OnModuleInit {
  private readonly logger = new Logger(NotificationsModule.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly delivery: DeliveryService,
  ) {}

  onModuleInit(): void {
    this.jobs.defineCron('notifications.deliver', DELIVER_CRON, async () => {
      const run = await this.delivery.deliverDue();
      if (run.claimed > 0) this.logger.log(run, 'Delivered due notifications');
    });
  }
}
