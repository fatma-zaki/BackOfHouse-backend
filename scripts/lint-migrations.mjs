// Lints Prisma migrations added or changed against a base ref with squawk
// (execution-plan.md Phase 1: expand/contract migrations). Earlier migrations are
// not re-judged. Usage: node scripts/lint-migrations.mjs [baseRef]   (default origin/main)
import { execFileSync, spawnSync } from 'node:child_process';

const isValidRef = (ref) => spawnSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).status === 0;

// A branch's first push has no "before" commit (all zeros): fall back to origin/main.
const requested = process.argv[2] || process.env.MIGRATIONS_BASE_REF || 'origin/main';
const base = [requested, 'origin/main', 'main'].find(isValidRef);
if (!base) {
  console.error(`No valid base ref (tried ${requested}, origin/main, main)`);
  process.exit(1);
}
const changed = execFileSync(
  'git',
  ['diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`, '--', 'prisma/migrations'],
  {
    encoding: 'utf8',
  },
)
  .split('\n')
  .filter((file) => /^prisma\/migrations\/[^/]+\/migration\.sql$/.test(file));

if (changed.length === 0) {
  console.log(`No migrations added or changed since ${base}.`);
  process.exit(0);
}

console.log(`Linting ${changed.length} migration(s) changed since ${base}:\n  ${changed.join('\n  ')}`);
const result = spawnSync(
  'npx',
  [
    'squawk',
    // Prisma applies each migration file in a transaction.
    '--assume-in-transaction',
    '--pg-version=17.0',
    // Integer status/count columns are fine; bigint is for ids and money only.
    '--exclude=prefer-bigint-over-int',
    ...changed,
  ],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);
process.exit(result.status ?? 1);
