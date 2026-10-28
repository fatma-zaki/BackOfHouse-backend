import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppConfig } from './config/app.config';
import { requestContextMiddleware } from './common/context/request-context.middleware';
import { buildSurfaceDocuments } from './surfaces/surface-docs';
import { GLOBAL_PREFIX, SWAGGER_PATHS } from './surfaces/surface-paths';

export const JSON_BODY_LIMIT = '256kb';

/**
 * HTTP concerns shared by main.ts and the e2e tests, so tests exercise exactly
 * the middleware stack that production runs.
 */
export function configureHttpApp(app: NestExpressApplication, config: AppConfig): void {
  // Must be first: every later middleware, log line and error sees the request id.
  app.use(requestContextMiddleware);

  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], frameAncestors: ["'none'"] } },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
  app.disable('x-powered-by');

  app.enableCors({
    origin: config.app.corsAllowedOrigins.length > 0 ? config.app.corsAllowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept-Language',
      'Idempotency-Key',
      'X-Request-Id',
      'X-Anonymous-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  });

  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: false });
  app.setGlobalPrefix(GLOBAL_PREFIX);

  // One Swagger page per surface (ADR-031); never in production.
  if (!config.isProduction) {
    const documents = buildSurfaceDocuments(app);
    SwaggerModule.setup(SWAGGER_PATHS.app, app, documents.app);
    SwaggerModule.setup(SWAGGER_PATHS.admin, app, documents.admin);
  }

  app.enableShutdownHooks();
}
