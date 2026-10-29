import { Module } from '@nestjs/common';
import { AccessModule } from '../../modules/access';
import { SettingsModule } from '../../modules/settings';
import { TaxonomyModule } from '../../modules/taxonomy';
import { AdminTaxonomyController } from './settings/admin-taxonomy.controller';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminTeamController } from './team/admin-team.controller';
import { AdminMetaController } from './meta/admin-meta.controller';
import { AdminSettingsController } from './settings/admin-settings.controller';

/**
 * Admin surface (ADR-031): the back-office API under /api/admin/v1. Staff sign in
 * with Google Workspace and an httpOnly session cookie (ADR-032, Phase 2). Business
 * rules live in src/modules. Feature modules are added as RouterModule children in
 * surfaces.module.ts.
 */
@Module({
  imports: [SettingsModule, AccessModule, TaxonomyModule],
  controllers: [
    AdminMetaController,
    AdminSettingsController,
    AdminAuthController,
    AdminTeamController,
    AdminTaxonomyController,
  ],
})
export class AdminSurfaceModule {}
