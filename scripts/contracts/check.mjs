// Contract-first check (ADR-031, execution-plan.md §1.6). Compares the spec generated from code
// (build/openapi.<surface>.json, from `npm run contract:generate`) with contracts/<surface>/openapi.yaml.
// Fails when:
//   - the code has an operation the contract does not list;
//   - the contract lists an operation for a phase up to contracts/phase.json `current_phase`
//     that the code does not implement;
//   - an implemented operation differs in its success status codes or its path/query parameters.
// Request and response bodies are validated against the contract by the e2e contract tests
// (jest-openapi, Phase 1); breaking contract changes are caught by oasdiff in CI.
// Usage: node scripts/contracts/check.mjs [generatedDir]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { operations, phaseIndex } from './phases.mjs';

const generatedDir = process.argv[2] ?? 'build';
const { current_phase: currentPhase } = JSON.parse(readFileSync('contracts/phase.json', 'utf8'));
const SURFACES = { app: '/api/app/v1', admin: '/api/admin/v1' };

const successCodes = (op) =>
  Object.keys(op.responses ?? {})
    .filter((s) => /^2/.test(s))
    .sort()
    .join(',');
const params = (document, op) =>
  (op.parameters ?? [])
    .map((p) => (p.$ref ? document.components.parameters[p.$ref.split('/').pop()] : p))
    .filter((p) => p.in === 'path' || p.in === 'query')
    .map((p) => `${p.in}:${p.name}`)
    .sort()
    .join(',');

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.log(`  ✗ ${message}`);
};

for (const [surface, prefix] of Object.entries(SURFACES)) {
  const contract = yaml.load(readFileSync(`contracts/${surface}/openapi.yaml`, 'utf8'));
  const generated = JSON.parse(readFileSync(join(generatedDir, `openapi.${surface}.json`), 'utf8'));

  const fromContract = new Map(operations(contract).map(([m, p, op]) => [`${m.toUpperCase()} ${p}`, op]));
  const fromCode = new Map(
    operations(generated).map(([m, p, op]) => {
      if (!p.startsWith(`${prefix}/`)) fail(`${surface}: ${m.toUpperCase()} ${p} is outside ${prefix}`);
      return [`${m.toUpperCase()} ${p.slice(prefix.length)}`, op];
    }),
  );

  console.log(`${surface} (${prefix}), current phase ${currentPhase}`);
  let implemented = 0;
  for (const [key, op] of fromCode) {
    const expected = fromContract.get(key);
    if (!expected) {
      fail(`${surface}: ${key} is in the code but not in contracts/${surface}/openapi.yaml`);
      continue;
    }
    implemented += 1;
    if (successCodes(expected) !== successCodes(op)) {
      fail(`${surface}: ${key} success status ${successCodes(op)} ≠ contract ${successCodes(expected)}`);
    }
    if (params(contract, expected) !== params(generated, op)) {
      fail(`${surface}: ${key} parameters [${params(generated, op)}] ≠ contract [${params(contract, expected)}]`);
    }
  }
  let due = 0;
  for (const [key, op] of fromContract) {
    if (phaseIndex(op['x-phase']) <= phaseIndex(currentPhase)) {
      due += 1;
      if (!fromCode.has(key))
        fail(`${surface}: ${key} (phase ${op['x-phase']}) is in the contract but not implemented`);
    }
  }
  console.log(
    `  implemented ${implemented} · due by phase ${currentPhase}: ${due} · planned later: ${fromContract.size - due}`,
  );
}

console.log(failures ? `\nFAIL: ${failures} contract difference(s)` : '\nOK: code matches the contracts');
process.exit(failures ? 1 : 0);
