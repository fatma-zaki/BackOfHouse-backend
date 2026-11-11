import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies';
import { IdentityModule } from '../identity';
import { ProfilesModule } from '../profiles';
import { ModerationService } from './services/moderation.service';

/**
 * Moderation (nest-module-map.md §4.11). Depends on identity, companies and profiles to
 * describe targets and suspend accounts; owning modules carry out content removal on
 * `moderation.case.resolved`.
 */
@Module({
  imports: [IdentityModule, CompaniesModule, ProfilesModule],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
