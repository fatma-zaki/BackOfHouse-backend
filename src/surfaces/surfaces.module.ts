import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminSurfaceModule } from './admin/admin-surface.module';
import { AppSurfaceModule } from './app/app-surface.module';
import { ADMIN_SURFACE_PATH, APP_SURFACE_PATH } from './surface-paths';
import { SurfaceRouteCheck } from './surface-route-check';

/** Mounts the two surfaces (ADR-031) and fails boot on any route outside them. */
@Module({
  imports: [
    AppSurfaceModule,
    AdminSurfaceModule,
    RouterModule.register([
      { path: APP_SURFACE_PATH, module: AppSurfaceModule },
      { path: ADMIN_SURFACE_PATH, module: AdminSurfaceModule },
    ]),
  ],
  providers: [SurfaceRouteCheck],
})
export class SurfacesModule {}
