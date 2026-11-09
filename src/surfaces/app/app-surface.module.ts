import { Module } from '@nestjs/common';
import { CompaniesModule } from '../../modules/companies';
import { IdentityModule } from '../../modules/identity';
import { ProfilesModule } from '../../modules/profiles';
import { SettingsModule } from '../../modules/settings';
import { TaxonomyModule } from '../../modules/taxonomy';
import { AppAuthController } from './auth/app-auth.controller';
import { AppUserAssembler } from './auth/app-user.assembler';
import { AppMetaController } from './meta/app-meta.controller';
import { AppCompanyController } from './directory/app-company.controller';
import { AppDiscoverController } from './directory/app-discover.controller';

/**
 * App surface (ADR-031): the Flutter app's API under /api/app/v1. Controllers,
 * DTOs and mappers for members and Company Accounts live here; business rules
 * live in src/modules. Feature modules are added as RouterModule children in
 * surfaces.module.ts.
 */
@Module({
  imports: [SettingsModule, TaxonomyModule, IdentityModule, CompaniesModule, ProfilesModule],
  controllers: [AppMetaController, AppAuthController, AppDiscoverController, AppCompanyController],
  providers: [AppUserAssembler],
})
export class AppSurfaceModule {}
