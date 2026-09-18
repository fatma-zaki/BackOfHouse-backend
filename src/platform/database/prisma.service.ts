import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { AppConfig } from '../../config/app.config';
import { toDriverConnectionString } from './connection-string';

/**
 * The only PrismaClient in the process. Connects with the runtime role
 * (`boh_app` in deployed environments) through the pg driver adapter.
 * Domain code does not use this directly for writes inside a use case; it goes
 * through TransactionRunner so audit and outbox rows join the same transaction.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: AppConfig) {
    super({
      adapter: new PrismaPg({
        connectionString: toDriverConnectionString(config.database.url),
        max: config.database.poolSize,
        statement_timeout: config.database.statementTimeoutMs,
        application_name: 'boh-backend',
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database client connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
