// Builds docs/index.html from docs/*.md so the viewer works offline-from-disk (file://)
// without fetching Markdown at runtime. Run after editing any document:
//
//   node docs/tools/build-index.mjs
//
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const groups = [
  { label: 'Start', docs: ['BACK_OF_HOUSE_BACKEND_MAP', 'business-rules', 'open-questions', 'architecture-decisions'] },
  { label: 'Domains & modules', docs: ['domain-map', 'nest-module-map', 'module-dependency-map'] },
  { label: 'Data', docs: ['database-erd', 'database-entities', 'enums-and-statuses', 'database-design-rules', 'transaction-boundaries'] },
  { label: 'Access & trust', docs: ['auth-architecture', 'company-context', 'security-and-audit'] },
  { label: 'Behaviour', docs: ['business-workflows', 'domain-events', 'points-architecture', 'api-map'] },
  { label: 'Platform & delivery', docs: ['execution-plan', 'gap-report', 'error-codes', 'supabase-architecture', 'backend-development-order', 'backend-implementation-status'] },
];

const keywords = {
  BACK_OF_HOUSE_BACKEND_MAP: 'overview master start summary',
  'business-rules': 'rules mandatory account company type opportunity supplier application monetization mvp',
  'open-questions': 'ambiguities business decision gaps',
  'architecture-decisions': 'adr decisions prisma supabase',
  'domain-map': 'domains relationships',
  'nest-module-map': 'nestjs modules folders structure',
  'module-dependency-map': 'dependencies circular layers',
  'database-erd': 'erd diagram tables schema',
  'database-entities': 'tables fields catalog columns',
  'enums-and-statuses': 'status state machine lifecycle',
  'database-design-rules': 'conventions naming uuid soft delete',
  'transaction-boundaries': 'atomic locks transactions',
  'auth-architecture': 'authentication authorization permissions roles mfa jwt',
  'company-context': 'multi-tenancy organization membership',
  'security-and-audit': 'audit privacy pdpl uploads rate limit',
  'business-workflows': 'workflow lifecycle journey',
  'domain-events': 'events outbox notifications',
  'points-architecture': 'points ledger levels badges visibility',
  'api-map': 'rest endpoints routes api',
  'supabase-architecture': 'supabase rls storage migrations connection',
  'backend-development-order': 'roadmap order phases stages',
  'backend-implementation-status': 'progress tracker status',
  'execution-plan': 'plan phases surfaces app admin contracts decisions',
  'gap-report': 'gap contract coverage missing implemented',
  'error-codes': 'errors codes catalog http status',
};

const docs = [];
for (const g of groups) {
  for (const name of g.docs) {
    const file = join(docsDir, `${name}.md`);
    if (!existsSync(file)) throw new Error(`Missing document: ${file}`);
    const markdown = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const title = (markdown.match(/^# (.+)$/m)?.[1] ?? name)
      .replace(/^Back Of House Backend:\s*/, '')
      .trim();
    docs.push({ name, title, keywords: keywords[name] ?? '', markdown });
  }
}

const data = {
  home: 'BACK_OF_HOUSE_BACKEND_MAP',
  source: 'PRD v1.0 · 27 Aug 2026 · architecture 2026-09-14',
  groups,
  docs,
};

// Escape "<" so no document content can close the <script> element.
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const template = readFileSync(join(docsDir, 'tools', 'index.template.html'), 'utf8');
if (!template.includes('/*__DOCS__*/')) throw new Error('Template placeholder missing');
writeFileSync(join(docsDir, 'index.html'), template.replace('/*__DOCS__*/', () => json));
console.log(`index.html built with ${docs.length} documents`);
