import { Module } from '@nestjs/common';
import { CompaniesModule } from '../../modules/companies';
import { ContentModule } from '../../modules/content';
import { IdentityModule } from '../../modules/identity';
import { NotificationsModule } from '../../modules/notifications';
import { EngagementModule } from '../../modules/engagement';
import { OpportunitiesModule } from '../../modules/opportunities';
import { VerificationModule } from '../../modules/verification';
import { ProfilesModule } from '../../modules/profiles';
import { SettingsModule } from '../../modules/settings';
import { TaxonomyModule } from '../../modules/taxonomy';
import { AppAuthController } from './auth/app-auth.controller';
import { AppUserAssembler } from './auth/app-user.assembler';
import { AppMetaController } from './meta/app-meta.controller';
import { AppCompanyController } from './directory/app-company.controller';
import { AppDiscoverController } from './directory/app-discover.controller';
import { AppMeController } from './me/app-me.controller';
import { AppNewsController } from './news/app-news.controller';
import {
  AppCompanyOpportunitiesController,
  AppOpportunitiesController,
} from './opportunities/app-opportunities.controller';
import {
  AppCompanyApplicantsController,
  AppMyApplicationsController,
} from './opportunities/app-applications.controller';
import { AppSuppliersController } from './opportunities/app-suppliers.controller';
import { AppPointsController } from './rewards/app-points.controller';

/**
 * App surface (ADR-031): the Flutter app's API under /api/app/v1. Controllers,
 * DTOs and mappers for members and Company Accounts live here; business rules
 * live in src/modules. Feature modules are added as RouterModule children in
 * surfaces.module.ts.
 */
@Module({
  imports: [
    SettingsModule,
    TaxonomyModule,
    IdentityModule,
    CompaniesModule,
    ProfilesModule,
    VerificationModule,
    NotificationsModule,
    ContentModule,
    OpportunitiesModule,
    EngagementModule,
  ],
  controllers: [
    AppMetaController,
    AppAuthController,
    AppDiscoverController,
    AppCompanyController,
    AppMeController,
    AppNewsController,
    AppOpportunitiesController,
    AppCompanyOpportunitiesController,
    AppMyApplicationsController,
    AppCompanyApplicantsController,
    AppSuppliersController,
    AppPointsController,
  ],
  providers: [AppUserAssembler],
})
export class AppSurfaceModule {}
