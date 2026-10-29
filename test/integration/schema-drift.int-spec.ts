import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { testDatabaseUrl } from '../support/test-db-state';

/**
 * The hand-written migration SQL must produce exactly the Prisma schema
 * (ADR-002): a migrated database and prisma/schema may not differ. Hand-written
 * extras that Prisma cannot model (CHECKs, triggers, RLS) do not count as drift.
 */
describe('Prisma schema vs migrations', () => {
  it('has no drift between the migrated database and prisma/schema', () => {
    const root = join(__dirname, '..', '..');
    const result = spawnSync(
      'npx',
      ['prisma', 'migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema', '--exit-code'],
      {
        cwd: root,
        encoding: 'utf8',
        shell: process.platform === 'win32',
        env: { ...process.env, DIRECT_DATABASE_URL: testDatabaseUrl(), DIRECT_URL: '' },
      },
    );
    const output = `${result.stdout}${result.stderr}`;

    expect({ status: result.status, output }).toEqual({ status: 0, output: expect.any(String) });
  });
});
