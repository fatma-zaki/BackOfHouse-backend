import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import { ConfigModule } from '../../src/config/config.module';
import { DatabaseModule } from '../../src/platform/database/database.module';
import { IdempotencyModule, IdempotencyStore, IDEMPOTENCY_TTL_MS } from '../../src/platform/idempotency';
import { ConflictError, DomainError } from '../../src/common/errors';
import { applyTestEnv, connectAdmin, resetDatabase } from '../support/database';

const request = { scope: 'user:1', key: 'k-1', method: 'POST', path: '/api/app/v1/x', requestHash: 'hash-a' };

describe('IdempotencyStore (real Postgres)', () => {
  let moduleRef: TestingModule;
  let admin: Client;
  let store: IdempotencyStore;

  beforeAll(async () => {
    applyTestEnv();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, DatabaseModule, IdempotencyModule],
    }).compile();
    await moduleRef.init();
    store = moduleRef.get(IdempotencyStore);
    admin = await connectAdmin();
  });

  afterAll(async () => {
    await admin.end();
    await moduleRef.close();
  });

  beforeEach(async () => {
    await resetDatabase(admin);
  });

  it('reserves a new key, then replays the completed response', async () => {
    const first = await store.begin(request);
    expect(first.kind).toBe('new');
    await store.complete((first as { id: string }).id, 201, { kind: 'value', value: { id: 'abc' } });

    await expect(store.begin(request)).resolves.toEqual({
      kind: 'replay',
      status: 201,
      body: { kind: 'value', value: { id: 'abc' } },
    });
  });

  it('refuses the same key with a different body (422 IDEMPOTENCY_KEY_REUSED)', async () => {
    const first = await store.begin(request);
    await store.complete((first as { id: string }).id, 200, { kind: 'empty' });
    const error = await store.begin({ ...request, requestHash: 'hash-b' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED', status: 422 });
  });

  it('refuses a repeat while the first request is still running (409)', async () => {
    await store.begin(request);
    await expect(store.begin(request)).rejects.toBeInstanceOf(ConflictError);
  });

  it('keeps keys per caller: another scope may use the same key', async () => {
    await store.begin(request);
    await expect(store.begin({ ...request, scope: 'user:2' })).resolves.toMatchObject({ kind: 'new' });
  });

  it('frees the key when the operation failed, so the client can retry', async () => {
    const first = await store.begin(request);
    await store.abandon((first as { id: string }).id);
    await expect(store.begin(request)).resolves.toMatchObject({ kind: 'new' });
  });

  it('only one of many concurrent first requests gets the reservation', async () => {
    const results = await Promise.allSettled(Array.from({ length: 10 }, () => store.begin(request)));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });

  const insertExpired = async (key: string): Promise<void> => {
    await admin.query(
      `INSERT INTO app.idempotency_records
         (id, scope, idempotency_key, method, path, request_hash, status, response_status, response_body,
          expires_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'POST', '/x', 'old-hash', 'COMPLETED', 200, '{"kind":"empty"}',
               now() - interval '1 hour', now() - make_interval(secs => $3), now())`,
      [request.scope, key, IDEMPOTENCY_TTL_MS / 1000 + 3600],
    );
  };

  it('treats an expired record as unused, even with a different body', async () => {
    await insertExpired(request.key);
    await expect(store.begin(request)).resolves.toMatchObject({ kind: 'new' });
  });

  it('purges only expired records', async () => {
    await insertExpired('old-key');
    await store.begin(request);
    await expect(store.purgeExpired()).resolves.toBe(1);
    expect((await admin.query('SELECT idempotency_key FROM app.idempotency_records')).rows).toEqual([
      { idempotency_key: request.key },
    ]);
  });
});
