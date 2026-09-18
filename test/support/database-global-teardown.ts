import { rmSync } from 'node:fs';
import { TEST_DB_STATE_FILE } from './test-db-state';

export default async function globalTeardown(): Promise<void> {
  const server = (globalThis as Record<string, unknown>)['__BOH_EMBEDDED_PG__'] as
    { stop(): Promise<void> } | undefined;
  if (server) {
    await server.stop();
  }
  rmSync(TEST_DB_STATE_FILE, { force: true });
}
