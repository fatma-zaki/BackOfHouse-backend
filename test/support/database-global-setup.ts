import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { Client } from 'pg';
import { TEST_DB_STATE_FILE, TestDbState } from './test-db-state';

// embedded-postgres is ESM-only; a real dynamic import survives TS→CJS compilation.
const importEsm = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<{
  default: new (options: Record<string, unknown>) => {
    initialise(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
  };
}>;

const DATABASE = 'boh_test';

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() =>
        typeof address === 'object' && address ? resolve(address.port) : reject(new Error('no port')),
      );
    });
  });
}

/**
 * Test database harness (backend-development-order.md Stage 2): one Postgres
 * per test run, migrated with the real Prisma migrations.
 *
 * - CI: set TEST_DATABASE_ADMIN_URL to a Postgres service container (superuser).
 * - Locally: an embedded Postgres 17 binary is started in a temp directory.
 */
export default async function globalSetup(): Promise<void> {
  let adminUrl = process.env['TEST_DATABASE_ADMIN_URL'];
  const state: TestDbState = { databaseUrl: '', embeddedDir: null, embeddedPort: null };

  if (!adminUrl) {
    const EmbeddedPostgres = (await importEsm('embedded-postgres')).default;
    const dir = mkdtempSync(join(tmpdir(), 'boh-pg-'));
    const port = await freePort();
    const server = new EmbeddedPostgres({
      databaseDir: dir,
      user: 'postgres',
      password: 'postgres',
      port,
      persistent: false,
      // Supabase databases are UTF-8; the OS default may not be.
      initdbFlags: ['--encoding=UTF8', '--locale=C'],
      onLog: () => undefined,
    });
    await server.initialise();
    await server.start();
    (globalThis as Record<string, unknown>)['__BOH_EMBEDDED_PG__'] = server;
    adminUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
    state.embeddedDir = dir;
    state.embeddedPort = port;
  }

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${DATABASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${DATABASE} ENCODING 'UTF8' TEMPLATE template0`);
  await admin.end();

  const databaseUrl = new URL(adminUrl);
  databaseUrl.pathname = `/${DATABASE}`;
  state.databaseUrl = databaseUrl.toString();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DIRECT_DATABASE_URL: state.databaseUrl, DIRECT_URL: '' },
    stdio: 'pipe',
  });

  writeFileSync(TEST_DB_STATE_FILE, JSON.stringify(state));
  process.env['TEST_DATABASE_URL'] = state.databaseUrl;
}
