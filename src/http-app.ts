import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppConfig } from './config/app.config';
import { requestContextMiddleware } from './common/context/request-context.middleware';

export const API_PREFIX = 'api/v1';
export const SWAGGER_PATH = 'docs';
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
  app.setGlobalPrefix(API_PREFIX);

  if (!config.isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Back Of House API')
        .setDescription('REST API. Errors: { code, message, trace_id, errors }. Validation failures: 422.')
        .setVersion('1.0.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
        .build(),
    );
    SwaggerModule.setup(SWAGGER_PATH, app, document);
  }

  app.enableShutdownHooks();
}
