import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface TestDbState {
  databaseUrl: string;
  embeddedDir: string | null;
  embeddedPort: number | null;
}

export const TEST_DB_STATE_FILE = join(tmpdir(), 'boh-test-db-state.json');

/** Superuser URL of the migrated test database created by globalSetup. */
export function testDatabaseUrl(): string {
  if (process.env['TEST_DATABASE_URL']) {
    return process.env['TEST_DATABASE_URL'];
  }
  const state = JSON.parse(readFileSync(TEST_DB_STATE_FILE, 'utf8')) as TestDbState;
  return state.databaseUrl;
}
