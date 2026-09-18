import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { loadLocalEnvFile } from './config/load-env-file';
import { WorkerModule } from './worker.module';
import { AppConfig } from './config/app.config';

/** Second entrypoint (ADR-022): no HTTP server, only the outbox and jobs. */
async function bootstrap(): Promise<void> {
  loadLocalEnvFile();

  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  if (!app.get(AppConfig).worker.jobsEnabled) {
    logger.error('The worker requires JOBS_ENABLED=true', 'Bootstrap');
    await app.close();
    process.exitCode = 1;
    return;
  }

  logger.log('Worker running', 'Bootstrap');
}

void bootstrap();
