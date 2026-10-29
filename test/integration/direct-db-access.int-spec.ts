import { Client } from 'pg';
import { connectAdmin } from '../support/database';

/**
 * Supabase's client roles reach nothing in the app schema (supabase-architecture.md
 * §3, §6). The roles are created here, as Supabase would have them, with the default
 * privileges Supabase grants them on the public schema only.
 */
describe('Direct database access by Supabase client roles', () => {
  let admin: Client;
  let tables: string[];

  beforeAll(async () => {
    admin = await connectAdmin();
    for (const role of ['anon', 'authenticated']) {
      await admin.query(`DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN CREATE ROLE ${role} NOLOGIN; END IF;
      END $$`);
      await admin.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
    }
    const { rows } = await admin.query(
      `SELECT format('%I.%I', schemaname, tablename) AS name FROM pg_tables WHERE schemaname = 'app' ORDER BY 1`,
    );
    tables = rows.map((r) => r.name as string);
  });

  afterAll(async () => {
    await admin.end();
  });

  it('finds the app tables', () => {
    expect(tables).toEqual(expect.arrayContaining(['app.users', 'app.companies', 'app.staff_accounts']));
  });

  it.each(['anon', 'authenticated'])('refuses SELECT on every app table as %s', async (role) => {
    const refused: string[] = [];
    for (const table of tables) {
      await admin.query('BEGIN');
      try {
        await admin.query(`SET LOCAL ROLE ${role}`);
        await admin.query(`SELECT 1 FROM ${table} LIMIT 1`);
      } catch (error) {
        if ((error as { code?: string }).code === '42501') refused.push(table);
      } finally {
        await admin.query('ROLLBACK');
      }
    }
    expect(refused).toEqual(tables);
  });

  it('keeps row level security on for every app table', async () => {
    const { rows } = await admin.query(
      `SELECT format('%I.%I', n.nspname, c.relname) AS name FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'app' AND c.relkind = 'r' AND NOT c.relrowsecurity ORDER BY 1`,
    );
    expect(rows).toEqual([]);
  });
});
