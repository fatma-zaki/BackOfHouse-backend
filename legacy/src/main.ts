import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig, getAppConfig } from './config/configuration';
import { NodeEnv } from './config/env.validation';
import { API_PREFIX, SWAGGER_PATH, BEARER_AUTH_NAME, JSON_BODY_LIMIT } from './common/constants';
import { ValidationException } from './common/pipes/validation.pipe';

function logLevelsFor(nodeEnv: NodeEnv): LogLevel[] {
  return nodeEnv === NodeEnv.Production
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const configService = app.get(ConfigService);
  const config = getAppConfig((key) => configService.get<AppConfig>(key));
  const isProduction = config.nodeEnv === NodeEnv.Production;

  app.useLogger(logLevelsFor(config.nodeEnv));

  // Secure HTTP headers. The API serves JSON only, so the CSP can be minimal.
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  // Strict CORS: only configured origins, and no credentials for the mobile client.
  app.enableCors({
    origin: config.corsOrigins.length > 0 ? config.corsOrigins : false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 600,
    optionsSuccessStatus: 204,
  });

  // Explicit, small body limits: oversized payloads are rejected before parsing.
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: false });
  app.disable('x-powered-by');
  app.setGlobalPrefix(API_PREFIX);

  // Reject unknown properties so clients cannot smuggle extra fields into DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: (errors) => new ValidationException(errors),
    }),
  );

  // Swagger is developer documentation; it stays out of production deployments.
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Back Of House API')
      .setDescription(
        'REST API for the Back Of House mobile application. ' +
          'All protected endpoints expect a Supabase access token as `Authorization: Bearer <token>`.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        BEARER_AUTH_NAME,
      )
      .build();
    SwaggerModule.setup(SWAGGER_PATH, app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  app.enableShutdownHooks();

  const logger = new Logger('Bootstrap');
  await app.listen(config.port, '0.0.0.0');

  logger.log(`Back Of House API listening on port ${config.port} (${config.nodeEnv})`);
  logger.log(`API base path: /${API_PREFIX}`);
  if (!isProduction) {
    logger.log(`OpenAPI docs: /${SWAGGER_PATH}`);
  }
}

void bootstrap();
