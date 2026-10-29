import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { CLOCK, Clock } from '../../common/clock/clock';
import { AppConfig } from '../../config/app.config';
import { JobsModule } from '../../platform/jobs/jobs.module';
import { JobsService } from '../../platform/jobs/jobs.service';
import { InMemoryMemberAuthProvider } from './infrastructure/in-memory-member-auth.provider';
import { MEMBER_AUTH_PROVIDER, MemberAuthProvider } from './infrastructure/member-auth-provider';
import { DevSmsSender, NotConfiguredSmsSender, SMS_SENDER, SmsSender } from './infrastructure/sms-sender';
import { SupabaseMemberAuthProvider } from './infrastructure/supabase-member-auth.provider';
import { ActivityService } from './services/activity.service';
import { MemberAuthService } from './services/member-auth.service';
import { MembersService } from './services/members.service';
import { PhoneSignInService } from './services/phone-sign-in.service';

/** Hourly at minute 45 (Asia/Riyadh). */
const IDENTITY_PURGE_CRON = '45 * * * *';

/**
 * Identity, member side (ADR-003 amended): members and Company Accounts, sign-in by
 * email + password or phone code (BQ-78), sessions, and activity tracking. Layer L0
 * apart from audit. Supabase Auth when configured; in local and test without it,
 * credentials live in memory (the env schema requires Supabase in staging and
 * production). SMS goes through SMS_SENDER until TQ-04 picks a provider.
 */
@Module({
  imports: [JobsModule],
  providers: [
    MemberAuthService,
    PhoneSignInService,
    MembersService,
    ActivityService,
    {
      provide: MEMBER_AUTH_PROVIDER,
      inject: [AppConfig, CLOCK],
      useFactory: (config: AppConfig, clock: Clock): MemberAuthProvider => {
        const { url, secretKey, jwtIssuer, jwksUrl } = config.supabase;
        if (url && secretKey) {
          return new SupabaseMemberAuthProvider(
            { url, secretKey, issuer: jwtIssuer, jwksUrl, passwordResetUrl: config.memberAuth.passwordResetUrl },
            clock,
          );
        }
        if (config.app.appEnv === 'local' || config.app.appEnv === 'test') {
          return new InMemoryMemberAuthProvider(clock);
        }
        throw new Error('Member sign-in requires SUPABASE_URL and SUPABASE_SECRET_KEY outside local and test');
      },
    },
    {
      provide: SMS_SENDER,
      inject: [AppConfig],
      useFactory: (config: AppConfig): SmsSender =>
        config.app.appEnv === 'local' || config.app.appEnv === 'test'
          ? new DevSmsSender(config.app.appEnv === 'local')
          : new NotConfiguredSmsSender(),
    },
  ],
  exports: [MemberAuthService, PhoneSignInService, MembersService, ActivityService],
})
export class IdentityModule implements OnModuleInit {
  private readonly logger = new Logger(IdentityModule.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly members: MembersService,
  ) {}

  onModuleInit(): void {
    this.jobs.defineCron('identity.purge', IDENTITY_PURGE_CRON, async () => {
      const removed = await this.members.purge();
      this.logger.log(`Purged ${removed.codes} old sign-in codes and ${removed.sessions} expired revocations`);
    });
  }
}
