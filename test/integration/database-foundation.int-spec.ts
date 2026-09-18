import { Client } from 'pg';
import { connectAdmin, resetDatabase } from '../support/database';
import { testDatabaseUrl } from '../support/test-db-state';
import { NORMALIZE_ARABIC_FIXTURES } from '../../src/common/text/normalize-arabic.fixtures';
import { normalizeArabic } from '../../src/common/text/normalize-arabic';

/**
 * Stage 2 exit criteria (backend-development-order.md): migrations apply on a
 * clean database, and the app role cannot modify an immutable table.
 */
describe('database foundation (real Postgres)', () => {
  let admin: Client;
  let appRole: Client;

  const insertAudit = (client: Client): Promise<unknown> =>
    client.query(
      `INSERT INTO app.audit_logs (id, actor_type, action, entity_type, entity_id, request_id)
       VALUES (gen_random_uuid(), 'SYSTEM', 'test.recorded', 'test', gen_random_uuid(), 'req-1')`,
    );

  beforeAll(async () => {
    admin = await connectAdmin();
    // The migration creates boh_app without a password; enable it for this test only.
    await admin.query(`ALTER ROLE boh_app WITH LOGIN PASSWORD 'boh_app_test'`);

    const url = new URL(testDatabaseUrl());
    url.username = 'boh_app';
    url.password = 'boh_app_test';
    appRole = new Client({ connectionString: url.toString() });
    await appRole.connect();
  });

  afterAll(async () => {
    await appRole.end();
    await admin.query('ALTER ROLE boh_app NOLOGIN');
    await admin.end();
  });

  beforeEach(() => resetDatabase(admin));

  describe('schema and extensions', () => {
    it('installs the required extensions', async () => {
      const { rows } = await admin.query<{ extname: string }>(
        `SELECT extname FROM pg_extension WHERE extname = ANY($1) ORDER BY extname`,
        [['btree_gist', 'citext', 'pg_trgm', 'unaccent']],
      );
      expect(rows.map((row) => row.extname)).toEqual(['btree_gist', 'citext', 'pg_trgm', 'unaccent']);
    });

    it('keeps the public schema free of application tables', async () => {
      const { rows } = await admin.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN ('audit_logs', 'outbox_events')`,
      );
      expect(rows).toHaveLength(0);
    });

    it('enables row level security on every app table', async () => {
      const { rows } = await admin.query<{ relname: string; relrowsecurity: boolean }>(
        `SELECT relname, relrowsecurity FROM pg_class
         WHERE relnamespace = 'app'::regnamespace AND relkind = 'r'`,
      );
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.relrowsecurity)).toBe(true);
    });

    it('denies rows to a role without BYPASSRLS, even with a table grant', async () => {
      await insertAudit(admin);
      await admin.query(`DROP ROLE IF EXISTS rls_probe`);
      await admin.query(`CREATE ROLE rls_probe NOLOGIN`);
      await admin.query(`GRANT USAGE ON SCHEMA app TO rls_probe; GRANT SELECT ON app.audit_logs TO rls_probe`);

      await admin.query('BEGIN');
      await admin.query('SET LOCAL ROLE rls_probe');
      const { rows } = await admin.query('SELECT * FROM app.audit_logs');
      await admin.query('ROLLBACK');

      expect(rows).toHaveLength(0);
      await admin.query(
        `REVOKE ALL ON app.audit_logs FROM rls_probe; REVOKE ALL ON SCHEMA app FROM rls_probe; DROP ROLE rls_probe`,
      );
    });
  });

  describe('boh_app role on the append-only audit_logs table', () => {
    it('can insert and read', async () => {
      await insertAudit(appRole);
      const { rows } = await appRole.query('SELECT action FROM app.audit_logs');
      expect(rows).toEqual([{ action: 'test.recorded' }]);
    });

    it('cannot update', async () => {
      await insertAudit(appRole);
      await expect(appRole.query(`UPDATE app.audit_logs SET action = 'tampered'`)).rejects.toThrow(/permission denied/);
    });

    it('cannot delete', async () => {
      await insertAudit(appRole);
      await expect(appRole.query('DELETE FROM app.audit_logs')).rejects.toThrow(/permission denied/);
    });

    it('cannot truncate', async () => {
      await expect(appRole.query('TRUNCATE app.audit_logs')).rejects.toThrow(/permission denied/);
    });

    it('is blocked by the immutability trigger even for the table owner', async () => {
      await insertAudit(admin);
      await expect(admin.query(`UPDATE app.audit_logs SET action = 'tampered'`)).rejects.toThrow(/append-only/);
      await expect(admin.query('DELETE FROM app.audit_logs')).rejects.toThrow(/append-only/);
    });

    it('rejects a USER action without an acting user', async () => {
      await expect(
        admin.query(
          `INSERT INTO app.audit_logs (id, actor_type, action, entity_type, entity_id, request_id)
           VALUES (gen_random_uuid(), 'USER', 'x.y', 'test', gen_random_uuid(), 'req')`,
        ),
      ).rejects.toThrow(/ck_audit_logs__actor_user_required/);
    });
  });

  describe('app.normalize_ar', () => {
    it.each(NORMALIZE_ARABIC_FIXTURES)('matches the TypeScript normaliser for %p', async (input, expected) => {
      const { rows } = await admin.query<{ value: string }>('SELECT app.normalize_ar($1) AS value', [input]);
      expect(rows[0].value).toBe(expected);
      expect(normalizeArabic(input)).toBe(rows[0].value);
    });
  });
});
