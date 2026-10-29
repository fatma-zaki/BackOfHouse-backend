import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { CLOCK, Clock } from '../../common/clock/clock';
import { AppConfig } from '../../config/app.config';
import { JobsModule } from '../../platform/jobs/jobs.module';
import { JobsService } from '../../platform/jobs/jobs.service';
import { SettingsModule } from '../settings';
import {
  GoogleStaffIdentityProvider,
  NotConfiguredStaffIdentityProvider,
  STAFF_IDENTITY_PROVIDER,
} from './infrastructure/staff-identity-provider';
import { StaffSessionsService } from './services/staff-sessions.service';
import { StaffSignInService } from './services/staff-sign-in.service';
import { TeamService } from './services/team.service';

/** Hourly at minute 40 (Asia/Riyadh). */
const ADMIN_AUTH_PURGE_CRON = '40 * * * *';

/**
 * Access, staff side (ADR-032): staff accounts, Google Workspace sign-in, admin
 * sessions, the team, and the permission matrix. Layer L1: depends on audit and
 * settings. The member side (Supabase Auth) arrives with identity.
 */
@Module({
  imports: [SettingsModule, JobsModule],
  providers: [
    StaffSessionsService,
    StaffSignInService,
    TeamService,
    {
      provide: STAFF_IDENTITY_PROVIDER,
      inject: [AppConfig, CLOCK],
      useFactory: (config: AppConfig, clock: Clock) => {
        const { oidc, workspaceDomain } = config.staffAuth;
        return oidc && workspaceDomain
          ? new GoogleStaffIdentityProvider({ ...oidc, workspaceDomain }, clock)
          : new NotConfiguredStaffIdentityProvider();
      },
    },
  ],
  exports: [StaffSessionsService, StaffSignInService, TeamService],
})
export class AccessModule implements OnModuleInit {
  private readonly logger = new Logger(AccessModule.name);

  constructor(
    private readonly jobs: JobsService,
    private readonly sessions: StaffSessionsService,
  ) {}

  onModuleInit(): void {
    this.jobs.defineCron('admin-auth.purge', ADMIN_AUTH_PURGE_CRON, async () => {
      const removed = await this.sessions.purge();
      this.logger.log(`Purged ${removed.states} expired sign-ins and ${removed.sessions} old sessions`);
    });
  }
}
