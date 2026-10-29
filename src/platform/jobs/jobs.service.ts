import { Injectable, Logger } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { AppConfig } from '../../config/app.config';
import { isTransactionPoolerUrl, toDriverConnectionString } from '../database/connection-string';

export type JobHandler = () => Promise<void>;

/** Cron schedules run in Saudi time (database-design-rules.md §3 "Windows"). */
export const JOBS_TIMEZONE = 'Asia/Riyadh';
const PGBOSS_SCHEMA = 'pgboss';

/**
 * Thin wrapper over pg-boss (ADR-010): Postgres-backed queues and cron in the
 * worker process, no Redis. Swappable behind this class if volumes grow.
 */
@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private boss: PgBoss | null = null;
  private readonly definitions = new Map<string, { cron: string; handler: JobHandler }>();

  constructor(private readonly config: AppConfig) {}

  async start(): Promise<void> {
    if (this.boss) {
      return;
    }

    const url = this.config.database.url;
    if (isTransactionPoolerUrl(url)) {
      // pg-boss relies on LISTEN/NOTIFY and advisory locks, which Supavisor
      // transaction mode (port 6543) does not provide.
      throw new Error(
        'The worker needs a session-mode or direct DATABASE_URL (port 5432, no pgbouncer=true); ' +
          'Supavisor transaction mode is not supported by pg-boss',
      );
    }

    const boss = new PgBoss({
      connectionString: toDriverConnectionString(url),
      schema: PGBOSS_SCHEMA,
      application_name: 'boh-worker',
      max: 3,
    });
    boss.on('error', (error: Error) => this.logger.error({ err: error }, 'pg-boss error'));
    await boss.start();
    this.boss = boss;
    this.logger.log('Job queue started');
  }

  /**
   * Declares a recurring job owned by a domain module. Modules call this from
   * `onModuleInit`; the worker registers every declared job once the queue has
   * started (`registerDefinedCrons`). In the api process (JOBS_ENABLED=false)
   * declarations are kept but never run.
   */
  defineCron(name: string, cron: string, handler: JobHandler): void {
    if (this.definitions.has(name)) {
      throw new Error(`Job ${name} is defined twice`);
    }
    this.definitions.set(name, { cron, handler });
  }

  /** Registers every job declared with `defineCron`. */
  async registerDefinedCrons(): Promise<void> {
    for (const [name, { cron, handler }] of this.definitions) {
      await this.registerCron(name, cron, handler);
    }
  }

  /** Registers a recurring job; safe to call on every boot (schedules are upserted). */
  async registerCron(name: string, cron: string, handler: JobHandler): Promise<void> {
    const boss = this.requireStarted();
    await boss.createQueue(name);
    await boss.schedule(name, cron, {}, { tz: JOBS_TIMEZONE });
    await boss.work(name, async () => {
      await handler();
    });
    this.logger.log(`Scheduled ${name} (${cron} ${JOBS_TIMEZONE})`);
  }

  async stop(): Promise<void> {
    if (!this.boss) {
      return;
    }
    await this.boss.stop({ graceful: true, wait: true });
    this.boss = null;
  }

  private requireStarted(): PgBoss {
    if (!this.boss) {
      throw new Error('JobsService.start() must be called first');
    }
    return this.boss;
  }
}
