import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity';
import { ProfessionalsService } from './services/professionals.service';
import { ProfilesService } from './services/profiles.service';

/**
 * Profiles (nest-module-map.md): an individual's profile, contact sharing and connections,
 * and the professionals directory. Depends on identity (module-dependency-map.md). The
 * directory query joins `users` read-only for name, status and profile status.
 */
@Module({
  imports: [IdentityModule],
  providers: [ProfilesService, ProfessionalsService],
  exports: [ProfilesService, ProfessionalsService],
})
export class ProfilesModule {}
