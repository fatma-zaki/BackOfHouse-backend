import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { loadLocalEnvFile } from './config/load-env-file';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { API_PREFIX, configureHttpApp } from './http-app';

async function bootstrap(): Promise<void> {
  loadLocalEnvFile();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = app.get(AppConfig);
  configureHttpApp(app, config);

  await app.listen(config.app.port, '0.0.0.0');
  logger.log(`API listening on :${config.app.port}/${API_PREFIX} (${config.app.appEnv})`, 'Bootstrap');
}

void bootstrap();
