/**
 * The two API surfaces (ADR-031). Every route lives under one of them; the only
 * exceptions are the shared health probes and the non-production Swagger pages.
 *
 *   app   → /api/app/v1/*    Flutter app (members, Company Accounts)
 *   admin → /api/admin/v1/*  admin back-office (staff)
 */
export const GLOBAL_PREFIX = 'api';
export const APP_SURFACE_PATH = 'app/v1';
export const ADMIN_SURFACE_PATH = 'admin/v1';

export const SURFACE_PREFIXES = {
  app: `/${GLOBAL_PREFIX}/${APP_SURFACE_PATH}`,
  admin: `/${GLOBAL_PREFIX}/${ADMIN_SURFACE_PATH}`,
} as const;

export type Surface = keyof typeof SURFACE_PREFIXES;

export const SWAGGER_PATHS: Record<Surface, string> = { app: 'docs/app', admin: 'docs/admin' };

/** Routes allowed outside the two surfaces. */
export const SHARED_ROUTE_PREFIXES = [`/${GLOBAL_PREFIX}/health`];
