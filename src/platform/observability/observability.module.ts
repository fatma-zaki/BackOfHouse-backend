import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfig } from '../../config/app.config';
import { buildLoggerParams } from './logger.config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => buildLoggerParams(config),
    }),
  ],
})
export class ObservabilityModule {}
