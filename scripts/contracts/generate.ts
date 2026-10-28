/**
 * Writes the OpenAPI document generated from the code for each surface to
 * build/openapi.<surface>.json (ADR-031). No database connection is made: the
 * app is created but never initialised.
 * Usage: npm run contract:generate
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { buildSurfaceDocuments } from '../../src/surfaces/surface-docs';
import { GLOBAL_PREFIX } from '../../src/surfaces/surface-paths';

async function main(): Promise<void> {
  process.env.DATABASE_URL ??= 'postgresql://contracts:generate@127.0.0.1:5432/unused';
  process.env.LOG_LEVEL ??= 'fatal';

  const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
  app.setGlobalPrefix(GLOBAL_PREFIX);
  const documents = buildSurfaceDocuments(app);

  const outDir = join(__dirname, '..', '..', 'build');
  mkdirSync(outDir, { recursive: true });
  for (const [surface, document] of Object.entries(documents)) {
    const file = join(outDir, `openapi.${surface}.json`);
    writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
    process.stdout.write(`Wrote ${file}\n`);
  }
  await app.close();
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
