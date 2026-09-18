import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/platform/database/database.module';
import { TransactionRunner } from '../../src/platform/database/transaction-runner';
import { PrismaService } from '../../src/platform/database/prisma.service';
import { OutboxHandlerRegistry } from '../../src/platform/outbox/outbox-handler.registry';
import { AppConfig } from '../../src/config/app.config';
import { OutboxModule } from '../../src/platform/outbox/outbox.module';
import { OutboxWriter } from '../../src/platform/outbox/outbox-writer';
import { OutboxDispatcher, MAX_ATTEMPTS } from '../../src/platform/outbox/outbox-dispatcher';
import { DomainEvent, OnDomainEvent } from '../../src/platform/outbox/domain-event';
import { AuditModule } from '../../src/modules/audit/audit.module';
import { AuditLogger } from '../../src/modules/audit/audit-logger';
import { AuditActorType } from '../../src/modules/audit/audit.types';
import { RequestContext } from '../../src/common/context/request-context';
import { uuidv7 } from '../../src/common/ids/uuid-v7';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';

const ENTITY_ID = '0192f7a1-0000-7000-8000-000000000001';
const USER_ID = '0192f7a1-0000-7000-8000-0000000000aa';

@Injectable()
class ProbeHandlers {
  received: DomainEvent[] = [];
  failuresRemaining = 0;

  @OnDomainEvent('probe.item.created')
  async onCreated(event: DomainEvent): Promise<void> {
    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      throw new Error('downstream unavailable');
    }
    this.received.push(event);
  }
}

describe('TransactionRunner, AuditLogger and the outbox (real Postgres)', () => {
  let moduleRef: TestingModule;
  let admin: Client;
  let transactions: TransactionRunner;
  let audit: AuditLogger;
  let outbox: OutboxWriter;
  let dispatcher: OutboxDispatcher;
  let handlers: ProbeHandlers;

  const count = async (table: string): Promise<number> =>
    Number((await admin.query<{ n: string }>(`SELECT count(*)::text AS n FROM app.${table}`)).rows[0].n);

  const recordAndEmit = async (): Promise<void> => {
    await audit.record({
      actor: { type: AuditActorType.USER, userId: USER_ID },
      action: 'probe.item.create',
      entityType: 'probe_item',
      entityId: ENTITY_ID,
      changes: { after: { name: 'Riyadh Expo', contact_email: 'owner@example.test', access_token: 'secret-value' } },
    });
    await outbox.emit({
      name: 'probe.item.created',
      aggregateType: 'probe_item',
      aggregateId: ENTITY_ID,
      actor: { type: 'USER', user_id: USER_ID },
      data: { item_id: ENTITY_ID },
    });
  };

  beforeAll(async () => {
    applyTestEnv();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule, OutboxModule, AuditModule],
      providers: [ProbeHandlers],
    }).compile();
    await moduleRef.init();

    transactions = moduleRef.get(TransactionRunner);
    audit = moduleRef.get(AuditLogger);
    outbox = moduleRef.get(OutboxWriter);
    dispatcher = moduleRef.get(OutboxDispatcher);
    handlers = moduleRef.get(ProbeHandlers);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
    handlers.received = [];
    handlers.failuresRemaining = 0;
  });

  describe('atomicity', () => {
    it('commits the audit row and the event together', async () => {
      await RequestContext.run({ requestId: 'req-commit-1', ipAddress: '203.0.113.7', userAgent: 'jest' }, () =>
        transactions.run(() => recordAndEmit()),
      );

      expect(await count('audit_logs')).toBe(1);
      expect(await count('outbox_events')).toBe(1);

      const { rows } = await admin.query('SELECT request_id, ip_address, actor_user_id, changes FROM app.audit_logs');
      expect(rows[0].request_id).toBe('req-commit-1');
      expect(rows[0].ip_address).toBe('203.0.113.7');
      expect(rows[0].actor_user_id).toBe(USER_ID);
    });

    it('writes neither the audit row nor the event when the use case fails', async () => {
      await expect(
        transactions.run(async () => {
          await recordAndEmit();
          throw new Error('business rule violated after writing');
        }),
      ).rejects.toThrow('business rule violated');

      expect(await count('audit_logs')).toBe(0);
      expect(await count('outbox_events')).toBe(0);
    });

    it('joins an outer transaction instead of opening a second one', async () => {
      await expect(
        transactions.run(async (outer) => {
          await transactions.run(async (inner) => {
            expect(inner).toBe(outer);
            await recordAndEmit();
          });
          throw new Error('outer failure');
        }),
      ).rejects.toThrow('outer failure');

      expect(await count('audit_logs')).toBe(0);
    });

    it('refuses to audit outside a transaction', async () => {
      await expect(recordAndEmit()).rejects.toThrow(/must run inside TransactionRunner/);
      expect(await count('audit_logs')).toBe(0);
    });
  });

  describe('audit redaction', () => {
    it('stores masked emails and no secrets', async () => {
      await transactions.run(() => recordAndEmit());

      const { rows } = await admin.query('SELECT changes FROM app.audit_logs');
      const after = rows[0].changes.after as Record<string, unknown>;
      expect(after['name']).toBe('Riyadh Expo');
      expect(after['contact_email']).toBe('o***@example.test');
      expect(after['access_token']).toBe('[REDACTED]');
      expect(JSON.stringify(rows[0].changes)).not.toContain('secret-value');
    });
  });

  describe('dispatcher', () => {
    it('delivers the event envelope to its handler and marks it processed', async () => {
      await RequestContext.run({ requestId: 'req-dispatch-1' }, () => transactions.run(() => recordAndEmit()));

      const result = await dispatcher.dispatchOnce();

      expect(result).toMatchObject({ claimed: 1, processed: 1 });
      expect(handlers.received).toHaveLength(1);
      expect(handlers.received[0]).toMatchObject({
        event_name: 'probe.item.created',
        event_version: 1,
        aggregate_id: ENTITY_ID,
        request_id: 'req-dispatch-1',
        actor: { type: 'USER', user_id: USER_ID },
        payload: { item_id: ENTITY_ID },
      });

      const { rows } = await admin.query('SELECT status, processed_at FROM app.outbox_events');
      expect(rows[0].status).toBe('PROCESSED');
      expect(rows[0].processed_at).not.toBeNull();
    });

    it('never delivers an event whose transaction rolled back', async () => {
      await transactions.run(() => recordAndEmit()).catch(() => undefined);
      await transactions
        .run(async () => {
          await recordAndEmit();
          throw new Error('rollback');
        })
        .catch(() => undefined);

      await dispatcher.dispatchOnce();
      expect(handlers.received).toHaveLength(1);
    });

    it('backs off and keeps the error when a handler fails', async () => {
      handlers.failuresRemaining = 1;
      await transactions.run(() => recordAndEmit());

      const result = await dispatcher.dispatchOnce();

      expect(result).toMatchObject({ claimed: 1, retried: 1 });
      const { rows } = await admin.query(
        `SELECT status, attempts, last_error, available_at > now() AS deferred FROM app.outbox_events`,
      );
      expect(rows[0]).toMatchObject({
        status: 'PENDING',
        attempts: 1,
        last_error: 'downstream unavailable',
        deferred: true,
      });

      // Not due yet, so an immediate second cycle does nothing.
      expect((await dispatcher.dispatchOnce()).claimed).toBe(0);
    });

    it('marks the event FAILED after the maximum number of attempts', async () => {
      handlers.failuresRemaining = 1;
      await transactions.run(() => recordAndEmit());
      await admin.query(`UPDATE app.outbox_events SET attempts = ${MAX_ATTEMPTS - 1}`);

      const result = await dispatcher.dispatchOnce();

      expect(result.failed).toBe(1);
      const { rows } = await admin.query('SELECT status, attempts FROM app.outbox_events');
      expect(rows[0]).toMatchObject({ status: 'FAILED', attempts: MAX_ATTEMPTS });
    });

    it('lets two concurrent dispatchers claim disjoint events', async () => {
      await transactions.run(async () => {
        for (let index = 0; index < 8; index += 1) {
          await outbox.emit({
            name: 'probe.item.created',
            aggregateType: 'probe_item',
            aggregateId: uuidv7(),
            actor: { type: 'SYSTEM', user_id: null },
            data: { index },
          });
        }
      });

      // A second dispatcher on its own connection stands in for a second worker.
      const other = new OutboxDispatcher(
        moduleRef.get(PrismaService),
        moduleRef.get(OutboxHandlerRegistry),
        moduleRef.get(AppConfig),
      );
      const [first, second] = await Promise.all([dispatcher.dispatchOnce(), other.dispatchOnce()]);

      expect(first.claimed + second.claimed).toBe(8);
      expect(handlers.received).toHaveLength(8);
      expect(new Set(handlers.received.map((event) => event.event_id)).size).toBe(8);
    });

    it('purges processed events older than the retention period', async () => {
      await transactions.run(() => recordAndEmit());
      await dispatcher.dispatchOnce();
      await admin.query(`UPDATE app.outbox_events SET processed_at = now() - interval '8 days'`);

      expect(await dispatcher.purgeProcessed()).toBe(1);
      expect(await count('outbox_events')).toBe(0);
    });
  });
});
