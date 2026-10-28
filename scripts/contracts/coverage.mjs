// Checks that every contract operation carries exactly one valid `x-phase` and prints the count
// per phase (docs/execution-plan.md §4). Exits 1 on a missing or unknown phase.
// Usage: node scripts/contracts/coverage.mjs
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { PHASES, operations } from './phases.mjs';

const SURFACES = { app: 'contracts/app/openapi.yaml', admin: 'contracts/admin/openapi.yaml' };
let failed = false;

console.log('Phase coverage (every operation has exactly one x-phase)\n');
for (const [surface, file] of Object.entries(SURFACES)) {
  const ops = operations(yaml.load(readFileSync(file, 'utf8')));
  const counts = Object.fromEntries(PHASES.map((p) => [p, 0]));
  for (const [method, path, op] of ops) {
    const phase = op['x-phase'];
    if (!PHASES.includes(String(phase))) {
      failed = true;
      console.log(`  !! ${surface}: ${method.toUpperCase()} ${path} has x-phase ${JSON.stringify(phase)}`);
      continue;
    }
    counts[phase] += 1;
  }
  const row = PHASES.filter((p) => counts[p] > 0)
    .map((p) => `${p}:${counts[p]}`)
    .join('  ');
  console.log(`${surface.padEnd(6)} total ${String(ops.length).padStart(3)} | ${row}`);
}
console.log(failed ? '\nFAIL: operations without a valid x-phase' : '\nOK: every operation maps to exactly one phase');
process.exit(failed ? 1 : 0);
