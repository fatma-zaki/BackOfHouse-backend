import { Client } from 'pg';
import { testDatabaseUrl } from './test-db-state';

export const APP_TABLES = [
  'app.audit_logs',
  'app.outbox_events',
  'app.idempotency_records',
  'app.platform_settings',
  'app.admin_sessions',
  'app.admin_oidc_states',
  'app.staff_accounts',
  'app.locations',
  'app.skills',
  'app.industries',
  'app.taxonomy_labels',
];

/** Superuser connection to the test database (for setup and assertions). */
export async function connectAdmin(): Promise<Client> {
  const client = new Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  return client;
}

/**
 * Empties every app table between tests. audit_logs refuses TRUNCATE through a
 * trigger, so triggers are suspended for this session only (superuser only).
 */
export async function resetDatabase(client: Client): Promise<void> {
  await client.query('SET session_replication_role = replica');
  await client.query(`TRUNCATE ${APP_TABLES.join(', ')}`);
  await client.query('SET session_replication_role = origin');
}

/** Environment for building AppConfig against the test database. */
export function testEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    NODE_ENV: 'test',
    APP_ENV: 'test',
    LOG_LEVEL: 'fatal',
    DATABASE_URL: testDatabaseUrl(),
    DATABASE_POOL_SIZE: '4',
    CORS_ALLOWED_ORIGINS: 'https://app.backofhouse.test',
    RATE_LIMIT_LIMIT: '1000',
    OUTBOX_BATCH_SIZE: '10',
    ...overrides,
  };
}

/** Puts testEnv() into process.env, which ConfigModule reads when a module is compiled. */
export function applyTestEnv(overrides: Record<string, string> = {}): void {
  Object.assign(process.env, testEnv(overrides));
}
