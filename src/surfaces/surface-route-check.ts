import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { SHARED_ROUTE_PREFIXES, SURFACE_PREFIXES, SWAGGER_PATHS } from './surface-paths';

interface ExpressLayer {
  route?: { path: string | string[]; methods: Record<string, boolean> };
}

/** A trailing wildcard: Express 4 (`/api$`, `/api/*`) or Express 5 / path-to-regexp 8 (`/api/{*path}`). */
const TRAILING_WILDCARD = /(\$|\*|\{\*\w+\})$/;

/**
 * Nest binds `forRoutes('*')` middleware (request context, logging) as Express
 * routes on a prefix wildcard for every HTTP method. Those are not controller
 * routes and are skipped.
 */
function isMiddlewareBinding(layer: ExpressLayer): boolean {
  const { path, methods } = layer.route!;
  const paths = Array.isArray(path) ? path : [path];
  return paths.every((p) => TRAILING_WILDCARD.test(p)) && Object.keys(methods).length > 7;
}

/** Lists "METHOD /path" for every controller route registered on the Express app. */
export function listRoutes(expressApp: unknown): string[] {
  const app = expressApp as { _router?: { stack: ExpressLayer[] }; router?: { stack: ExpressLayer[] } };
  const stack = app._router?.stack ?? app.router?.stack ?? [];
  return stack
    .filter((layer) => layer.route && !isMiddlewareBinding(layer))
    .flatMap((layer) => {
      const { path, methods } = layer.route!;
      const paths = Array.isArray(path) ? path : [path];
      return Object.keys(methods).flatMap((method) => paths.map((p) => `${method.toUpperCase()} ${p}`));
    });
}

/** True when the path sits under a surface, a shared route or a Swagger page. */
export function isAllowedRoute(path: string): boolean {
  const allowed = [
    ...Object.values(SURFACE_PREFIXES),
    ...SHARED_ROUTE_PREFIXES,
    ...Object.values(SWAGGER_PATHS).map((p) => `/${p}`),
  ];
  return allowed.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}-`));
}

/**
 * Startup check (execution-plan.md §1.5): boot fails when a controller is mounted
 * outside /api/app/v1, /api/admin/v1 and the shared health routes, so a route can
 * never end up on no surface or on the wrong client by accident.
 * Runs after Nest registers routes and before the server listens.
 */
@Injectable()
export class SurfaceRouteCheck implements OnApplicationBootstrap {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  onApplicationBootstrap(): void {
    const strays = listRoutes(this.adapterHost.httpAdapter.getInstance()).filter(
      (route) => !isAllowedRoute(route.split(' ')[1]),
    );
    if (strays.length > 0) {
      throw new Error(
        `Routes outside the app and admin surfaces (ADR-031): ${strays.join(', ')}. ` +
          'Move the controller into src/surfaces/app or src/surfaces/admin.',
      );
    }
  }
}
