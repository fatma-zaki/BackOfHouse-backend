import { Module } from '@nestjs/common';
import { AccessModule } from '../../modules/access';
import { BackofficeModule } from '../../modules/backoffice';
import { IdentityModule } from '../../modules/identity';
import { VerificationModule } from '../../modules/verification';
import { NotificationsModule } from '../../modules/notifications';
import { SettingsModule } from '../../modules/settings';
import { TaxonomyModule } from '../../modules/taxonomy';
import { AdminTaxonomyController } from './settings/admin-taxonomy.controller';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminTeamController } from './team/admin-team.controller';
import { AdminMetaController } from './meta/admin-meta.controller';
import { AdminSettingsController } from './settings/admin-settings.controller';
import { AdminNotificationsController } from './notifications/admin-notifications.controller';
import { AdminNotesController } from './users/admin-notes.controller';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminVerificationController } from './verification/admin-verification.controller';

/**
 * Admin surface (ADR-031): the back-office API under /api/admin/v1. Staff sign in
 * with Google Workspace and an httpOnly session cookie (ADR-032, Phase 2). Business
 * rules live in src/modules. Feature modules are added as RouterModule children in
 * surfaces.module.ts.
 */
@Module({
  imports: [
    SettingsModule,
    AccessModule,
    TaxonomyModule,
    NotificationsModule,
    IdentityModule,
    VerificationModule,
    BackofficeModule,
  ],
  controllers: [
    AdminMetaController,
    AdminSettingsController,
    AdminAuthController,
    AdminTeamController,
    AdminTaxonomyController,
    AdminNotificationsController,
    AdminVerificationController,
    AdminUsersController,
    AdminNotesController,
  ],
})
export class AdminSurfaceModule {}
