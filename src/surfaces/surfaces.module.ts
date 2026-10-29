import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminSurfaceModule } from './admin/admin-surface.module';
import { AppSurfaceModule } from './app/app-surface.module';
import { ADMIN_SURFACE_PATH, APP_SURFACE_PATH } from './surface-paths';
import { SurfaceRouteCheck } from './surface-route-check';
import { ADMIN_ACTOR_RESOLVER, APP_ACTOR_RESOLVER } from './actor-resolver';
import { AccessModule } from '../modules/access';
import { CompaniesModule } from '../modules/companies';
import { IdentityModule } from '../modules/identity';
import { MemberTokenResolver } from './app/auth/member-token.resolver';
import { StaffSessionResolver } from './admin/auth/staff-session.resolver';

/**
 * Mounts the two surfaces (ADR-031), fails boot on any route outside them, and
 * provides each surface's actor resolver for SurfaceAuthGuard.
 */
@Module({
  imports: [
    AppSurfaceModule,
    AdminSurfaceModule,
    AccessModule,
    IdentityModule,
    CompaniesModule,
    RouterModule.register([
      { path: APP_SURFACE_PATH, module: AppSurfaceModule },
      { path: ADMIN_SURFACE_PATH, module: AdminSurfaceModule },
    ]),
  ],
  providers: [
    SurfaceRouteCheck,
    // App: member access token (ADR-003 amended). Admin: staff session cookie (ADR-032).
    { provide: APP_ACTOR_RESOLVER, useClass: MemberTokenResolver },
    { provide: ADMIN_ACTOR_RESOLVER, useClass: StaffSessionResolver },
  ],
  exports: [APP_ACTOR_RESOLVER, ADMIN_ACTOR_RESOLVER],
})
export class SurfacesModule {}
