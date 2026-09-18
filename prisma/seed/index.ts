/**
 * Seed runner (database-design-rules.md §16). Run with `npm run db:seed`.
 *
 * Seeders are idempotent (upsert by `code` or `slug`) and declare which
 * environments they may run in. Demo data is local/test only; reference data
 * (taxonomy, levels) runs everywhere. Taxonomy seeds arrive with Stage 5 and
 * are blocked on RG-28 / BQ-21 (value lists), so the registry is empty today.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { toDriverConnectionString } from '../../src/platform/database/connection-string';

type AppEnv = 'local' | 'test' | 'staging' | 'production';

export interface Seeder {
  name: string;
  environments: readonly AppEnv[];
  run(prisma: PrismaClient): Promise<void>;
}

export const SEEDERS: readonly Seeder[] = [];

async function main(): Promise<void> {
  const appEnv = (process.env['APP_ENV'] ?? 'local') as AppEnv;
  const url = process.env['DIRECT_DATABASE_URL'] ?? process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('Set DIRECT_DATABASE_URL (or DATABASE_URL) to seed');
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: toDriverConnectionString(url) }) });
  try {
    const applicable = SEEDERS.filter((seeder) => seeder.environments.includes(appEnv));
    for (const seeder of applicable) {
      await seeder.run(prisma);
      process.stdout.write(`seeded: ${seeder.name}\n`);
    }
    process.stdout.write(`${applicable.length} seeder(s) applied for APP_ENV=${appEnv}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Seeding failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
