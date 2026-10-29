import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { AppConfig } from '../../config/app.config';
import { JobsService } from '../jobs/jobs.service';
import { OutboxDispatcher } from '../outbox/outbox-dispatcher';
import { IdempotencyStore } from '../idempotency/idempotency.store';

/** Daily at 03:15 Riyadh time. */
const OUTBOX_PURGE_CRON = '15 3 * * *';
/** Hourly, at minute 20. */
const IDEMPOTENCY_PURGE_CRON = '20 * * * *';

/**
 * Starts the background runtime (outbox dispatcher + scheduled jobs) when
 * JOBS_ENABLED=true. The api and worker are the same codebase (ADR-022): early
 * Phase 1 may enable jobs inside the api process; production runs a separate
 * worker process with JOBS_ENABLED=true and the api with false.
 */
@Injectable()
export class WorkerLifecycle implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(WorkerLifecycle.name);

  constructor(
    private readonly config: AppConfig,
    private readonly jobs: JobsService,
    private readonly dispatcher: OutboxDispatcher,
    private readonly idempotency: IdempotencyStore,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.worker.jobsEnabled) {
      this.logger.log('Background jobs disabled (JOBS_ENABLED=false)');
      return;
    }

    await this.jobs.start();
    await this.jobs.registerCron('outbox.purge-processed', OUTBOX_PURGE_CRON, async () => {
      const removed = await this.dispatcher.purgeProcessed();
      this.logger.log(`Purged ${removed} processed outbox events`);
    });
    await this.jobs.registerCron('idempotency.purge', IDEMPOTENCY_PURGE_CRON, async () => {
      const removed = await this.idempotency.purgeExpired();
      this.logger.log(`Purged ${removed} expired idempotency records`);
    });
    await this.jobs.registerDefinedCrons();
    this.dispatcher.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.dispatcher.stop();
    await this.jobs.stop();
  }
}
