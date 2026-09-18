import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppConfig } from '../../config/app.config';
import { RequestContext } from '../../common/context/request-context';
import { scrubSecrets } from '../../common/text/scrub-secrets';
import { OutboxHandlerRegistry } from './outbox-handler.registry';
import { DomainEvent, StoredEventPayload } from './domain-event';

interface ClaimedRow {
  id: string;
  event_name: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: StoredEventPayload;
  occurred_at: Date;
  attempts: number;
}

export interface DispatchResult {
  claimed: number;
  processed: number;
  retried: number;
  failed: number;
}

/** After this many attempts the event is FAILED and an alert is logged (domain-events.md §1). */
export const MAX_ATTEMPTS = 10;
/** While a worker holds an event, other workers skip it; a crashed worker's lease simply expires. */
const LEASE_SECONDS = 120;
const BASE_BACKOFF_SECONDS = 2;
const MAX_BACKOFF_SECONDS = 3600;
const PROCESSED_RETENTION_DAYS = 7;
const MAX_ERROR_LENGTH = 1000;

export function backoffSeconds(attempts: number): number {
  return Math.min(BASE_BACKOFF_SECONDS * 2 ** Math.max(attempts - 1, 0), MAX_BACKOFF_SECONDS);
}

/**
 * Delivers outbox events to @OnDomainEvent handlers (ADR-011), in the worker.
 *
 * Claiming is a short transaction: pending rows are selected with
 * FOR UPDATE SKIP LOCKED and leased by pushing `available_at` forward, so
 * several workers never take the same event. Handlers then run OUTSIDE any
 * database transaction (they may call email or SMS providers). Delivery is at
 * least once; handlers must be idempotent.
 */
@Injectable()
export class OutboxDispatcher {
  private readonly logger = new Logger(OutboxDispatcher.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private stopped = true;

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: OutboxHandlerRegistry,
    private readonly config: AppConfig,
  ) {}

  start(): void {
    if (!this.stopped) {
      return;
    }
    this.stopped = false;
    const tick = async (): Promise<void> => {
      try {
        const result = await this.dispatchOnce();
        const delay =
          result.claimed === this.config.worker.outboxBatchSize ? 0 : this.config.worker.outboxPollIntervalMs;
        this.schedule(tick, delay);
      } catch (error) {
        this.logger.error({ err: error }, 'Outbox dispatch cycle failed');
        this.schedule(tick, this.config.worker.outboxPollIntervalMs);
      }
    };
    this.schedule(tick, 0);
    this.logger.log('Outbox dispatcher started');
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // Let an in-flight batch finish so leases are released promptly.
    while (this.running) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async dispatchOnce(): Promise<DispatchResult> {
    this.running = true;
    try {
      const rows = await this.claim(this.config.worker.outboxBatchSize);
      const result: DispatchResult = { claimed: rows.length, processed: 0, retried: 0, failed: 0 };

      for (const row of rows) {
        const outcome = await this.deliver(row);
        result[outcome] += 1;
      }
      return result;
    } finally {
      this.running = false;
    }
  }

  /** Deletes PROCESSED events older than the retention period. Scheduled daily by the worker. */
  async purgeProcessed(): Promise<number> {
    return this.prisma.$executeRaw`
      DELETE FROM app.outbox_events
      WHERE status = 'PROCESSED'
        AND processed_at < now() - make_interval(days => ${PROCESSED_RETENTION_DAYS})
    `;
  }

  private claim(limit: number): Promise<ClaimedRow[]> {
    return this.prisma.$queryRaw<ClaimedRow[]>`
      UPDATE app.outbox_events AS e
      SET attempts = e.attempts + 1,
          available_at = now() + make_interval(secs => ${LEASE_SECONDS}),
          updated_at = now()
      WHERE e.id IN (
        SELECT id FROM app.outbox_events
        WHERE status = 'PENDING' AND available_at <= now()
        ORDER BY available_at, id
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING e.id, e.event_name, e.aggregate_type, e.aggregate_id, e.payload, e.occurred_at, e.attempts
    `;
  }

  private async deliver(row: ClaimedRow): Promise<'processed' | 'retried' | 'failed'> {
    const event = this.toEvent(row);

    try {
      // Handlers log under the request id of the request that produced the event.
      await RequestContext.run({ requestId: event.request_id }, async () => {
        for (const handler of this.registry.handlersFor(event.event_name)) {
          await handler.handle(event);
        }
      });
    } catch (error) {
      return this.recordFailure(row, error);
    }

    await this.prisma.$executeRaw`
      UPDATE app.outbox_events
      SET status = 'PROCESSED', processed_at = now(), last_error = NULL, updated_at = now()
      WHERE id = ${row.id}::uuid
    `;
    return 'processed';
  }

  private async recordFailure(row: ClaimedRow, error: unknown): Promise<'retried' | 'failed'> {
    const message = scrubSecrets(error instanceof Error ? error.message : String(error)).slice(0, MAX_ERROR_LENGTH);

    if (row.attempts >= MAX_ATTEMPTS) {
      await this.prisma.$executeRaw`
        UPDATE app.outbox_events
        SET status = 'FAILED', last_error = ${message}, updated_at = now()
        WHERE id = ${row.id}::uuid
      `;
      // Alerting hooks onto this log line until a monitoring provider is chosen (TQ-09).
      this.logger.error(
        { event_id: row.id, event_name: row.event_name, attempts: row.attempts, alert: 'outbox.event.failed' },
        'Outbox event failed permanently',
      );
      return 'failed';
    }

    await this.prisma.$executeRaw`
      UPDATE app.outbox_events
      SET available_at = now() + make_interval(secs => ${backoffSeconds(row.attempts)}),
          last_error = ${message},
          updated_at = now()
      WHERE id = ${row.id}::uuid
    `;
    this.logger.warn(
      { event_id: row.id, event_name: row.event_name, attempts: row.attempts },
      'Outbox handler failed; will retry',
    );
    return 'retried';
  }

  private toEvent(row: ClaimedRow): DomainEvent {
    return {
      event_id: row.id,
      event_name: row.event_name,
      event_version: row.payload.event_version,
      occurred_at: row.occurred_at.toISOString(),
      aggregate_type: row.aggregate_type,
      aggregate_id: row.aggregate_id,
      actor: row.payload.actor,
      organization_id: row.payload.organization_id,
      request_id: row.payload.request_id,
      payload: row.payload.data,
    };
  }

  private schedule(tick: () => Promise<void>, delay: number): void {
    if (this.stopped) {
      return;
    }
    this.timer = setTimeout(() => void tick(), delay);
  }
}
