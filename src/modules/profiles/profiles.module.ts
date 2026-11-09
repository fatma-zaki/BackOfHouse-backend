import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity';
import { TaxonomyModule } from '../taxonomy';
import { ProfessionalsService } from './services/professionals.service';
import { ProfilesService } from './services/profiles.service';

/**
 * Profiles (nest-module-map.md): an individual's profile, projects, skills, contact
 * sharing and connections, and the professionals directory. Depends on identity and
 * taxonomy (skills) (module-dependency-map.md). The directory query joins `users`
 * read-only for name, status and profile status.
 */
@Module({
  imports: [IdentityModule, TaxonomyModule],
  providers: [ProfilesService, ProfessionalsService],
  exports: [ProfilesService, ProfessionalsService],
})
export class ProfilesModule {}
