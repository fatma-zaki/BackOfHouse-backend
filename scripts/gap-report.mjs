// Generates docs/gap-report.md (execution-plan.md Phase 0). Re-run after each phase:
//   npm run contract:generate && npm run gap-report
// Inputs: contracts/{app,admin}/openapi.yaml, build/openapi.{app,admin}.json (if present),
// docs/admin/openapi/openapi.yaml (hand-off), docs/admin/prisma/schema.prisma (hand-off model),
// and the two hand-maintained maps below.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { operations, PHASES } from './contracts/phases.mjs';

const today = new Date().toISOString().slice(0, 10);
const { current_phase: currentPhase } = JSON.parse(readFileSync('contracts/phase.json', 'utf8'));
const SURFACES = { app: '/api/app/v1', admin: '/api/admin/v1' };

// ---------------------------------------------------------------- model map (hand-off → repo)
// status: built (table exists) · designed (in database-entities.md, not built) · differs · missing
const BUILT_TABLES = new Set(['audit_logs', 'outbox_events']);
const MODEL_MAP = {
  User: ['users, profiles', 'designed', 'Students kept as a profile flag (BQ-79); contact sharing flags to add'],
  Experience: ['experiences', 'designed', 'Talent module'],
  PortfolioItem: ['company_projects (company) · profile_projects (member)', 'designed', ''],
  Connection: ['—', 'missing', 'Flutter `/professionals/{id}/connection`'],
  SavedItem: ['—', 'missing', 'Saved opportunities, events, news'],
  Device: ['—', 'missing', 'FCM tokens for push (Phase 2)'],
  Company: ['organizations', 'designed', 'One Company Account per company (ADR-030)'],
  CompanyMember: [
    'organization_members',
    'differs',
    'Individual members without roles (ADR-030, P3); hand-off has owner/recruiter/editor',
  ],
  Follow: ['—', 'missing', 'Company follows + followers_count'],
  PageClaim: ['organization_claims', 'designed', 'Approval moves ownership, never verifies'],
  Listing: [
    'opportunities',
    'designed',
    'Vocabulary "opportunities" (D1); revision flow (P2); PROJECT type open (BQ-81)',
  ],
  ListingReview: ['—', 'missing', 'Review decisions and pending revisions (P2)'],
  Application: ['applications', 'designed', 'Privacy snapshot on apply'],
  SupplierResponse: ['supplier_responses', 'designed', ''],
  Event: ['events', 'designed', ''],
  EventRegistration: ['event_registrations', 'designed', ''],
  CheckInScan: ['—', 'missing', 'Door scans, idempotent per pass per day'],
  PointsTransaction: ['point_ledger', 'designed', 'Append-only; spending allowed (BQ-76)'],
  EarningRule: ['point_rules, point_rule_versions', 'designed', 'Seed at the design scale (BQ-77)'],
  Reward: ['rewards', 'differs', 'Needs price, stock and level (BQ-76)'],
  Redemption: ['—', 'missing', 'Was excluded by BQ-08; needed after BQ-76'],
  VerificationRequest: [
    'verifications, verification_documents, verification_decisions',
    'designed',
    'Student ID accepted (BQ-79)',
  ],
  Report: ['abuse_reports', 'designed', ''],
  ModerationCase: ['—', 'missing', 'Reports on one target join one case'],
  Article: ['content_items', 'designed', 'Bilingual; comments, likes, saves in the Flutter contract'],
  SupportTicket: ['—', 'missing', ''],
  TicketMessage: ['—', 'missing', ''],
  Broadcast: ['—', 'missing', ''],
  Notification: ['notifications, notification_deliveries, notification_preferences', 'designed', ''],
  Upload: ['media_assets, documents', 'designed', 'Quarantine + virus scan (Phase 1)'],
  AdminUser: ['staff_accounts', 'missing', 'New (ADR-032); replaces user_platform_roles for staff'],
  AdminInvite: ['staff_accounts.status = INVITED', 'differs', 'No invite table or token (ADR-032)'],
  AdminSession: ['admin_sessions', 'missing', 'New (ADR-032)'],
  AuditLog: ['audit_logs', 'built', 'Append-only (grants + trigger)'],
  InternalNote: ['—', 'missing', ''],
  ImportJob: ['import_batches, import_rows', 'designed', ''],
  Export: ['data_exports', 'designed', ''],
  ScheduledExport: ['—', 'missing', ''],
  SavedReport: ['—', 'missing', ''],
  Setting: ['—', 'missing', 'Typed settings (Phase 1)'],
  TaxonomyItem: [
    'categories, services, locations, industries, skills',
    'differs',
    'One table per kind in the repo design',
  ],
  IdempotencyRecord: ['idempotency_records', 'designed', 'Phase 1'],
};

// ---------------------------------------------------------------- hand-off member/company ops → Flutter contract
// null = missing from contracts/app: add it (contract first) in the phase shown.
const APP_FEATURE_MAP = {
  'POST /uploads': [null, '1'],
  'GET /meta/taxonomy': [null, '1'],
  'POST /auth/register': ['POST /auth/register'],
  'POST /auth/login': ['POST /auth/login'],
  'POST /auth/refresh': ['POST /auth/refresh'],
  'POST /auth/logout': ['POST /auth/logout'],
  'POST /auth/password/forgot': ['POST /auth/forgot-password'],
  'POST /auth/password/reset': ['POST /auth/reset-password'],
  'GET /me': ['GET /me'],
  'PATCH /me': ['PATCH /me/profile'],
  'PATCH /me/preferences': [null, '2'],
  'PUT /me/devices': [null, '2'],
  'PUT /me/contact-sharing': [null, '3a'],
  'GET /search': [null, '3a'],
  'GET /companies': ['GET /companies'],
  'GET /companies/{idOrSlug}': ['GET /companies/{id}'],
  'PUT /companies/{id}/follow': ['PUT /companies/{id}/follow'],
  'DELETE /companies/{id}/follow': ['DELETE /companies/{id}/follow'],
  'GET /professionals': ['GET /professionals'],
  'GET /professionals/{id}': [null, '3a'],
  'POST /professionals/{id}/connections': ['PUT /professionals/{id}/connection'],
  'POST /me/connections/{id}/accept': [null, '3a'],
  'GET /company/profile': ['GET /company'],
  'PATCH /company/profile': ['PATCH /company'],
  'POST /company/portfolio': ['POST /company/projects'],
  'DELETE /company/portfolio/{id}': ['DELETE /company/projects/{id}'],
  'POST /companies/{id}/claims': [null, '3b'],
  'GET /notifications': ['GET /me/notifications'],
  'POST /notifications/read': ['POST /me/notifications/{id}/read'],
  'POST /me/verification-requests': ['POST /me/verification/submit'],
  'GET /me/verification-requests/latest': ['GET /me/verification'],
  'POST /company/verification-requests': [null, '3b'],
  'POST /reports': [null, '4'],
  'GET /home': [null, '5'],
  'GET /listings': ['GET /opportunities'],
  'GET /listings/{id}': ['GET /opportunities/{id}'],
  'PUT /me/saved/listings/{id}': [null, '5'],
  'DELETE /me/saved/listings/{id}': [null, '5'],
  'POST /listings/{id}/applications': ['POST /me/applications'],
  'GET /me/applications': ['GET /me/applications'],
  'GET /me/applications/{id}': [null, '5'],
  'POST /me/applications/{id}/withdraw': ['POST /me/applications/{id}/withdraw'],
  'GET /company/dashboard': ['GET /company/stats'],
  'GET /company/listings': ['GET /company/opportunities'],
  'POST /company/listings': ['POST /company/opportunities'],
  'GET /company/listings/{id}': ['GET /company/opportunities/{id}'],
  'PATCH /company/listings/{id}': ['PATCH /company/opportunities/{id}'],
  'POST /company/listings/{id}/submit': ['POST /company/opportunities/{id}/submit'],
  'POST /company/listings/{id}/close': ['POST /company/opportunities/{id}/close'],
  'GET /company/listings/{id}/applications': ['GET /company/opportunities/{id}/applicants'],
  'GET /company/applications/{id}': ['GET /company/applicants/{id}'],
  'POST /company/applications/{id}/status': ['POST /company/applicants/{id}/status'],
  'GET /company/supplier-requests': ['GET /company/supplier-requests/invited'],
  'POST /company/supplier-requests/{id}/responses': ['POST /company/supplier-responses'],
  'GET /company/listings/{id}/responses': ['GET /company/supplier-requests/{id}/responses'],
  'POST /company/responses/{id}/status': ['POST /company/supplier-responses/{id}/status'],
  'GET /events': ['GET /events'],
  'GET /events/{id}': ['GET /events/{id}'],
  'POST /events/{id}/registrations': ['PUT /events/{id}/registration'],
  'DELETE /events/{id}/registrations/me': ['DELETE /events/{id}/registration'],
  'GET /me/registrations': [null, '6'],
  'PUT /me/saved/events/{id}': [null, '6'],
  'DELETE /me/saved/events/{id}': [null, '6'],
  'GET /companies/{id}/events': [null, '6'],
  'GET /me/points': ['GET /me/points'],
  'GET /me/points/transactions': ['GET /me/points/transactions'],
  'GET /rewards': ['GET /rewards'],
  'POST /rewards/{id}/redeem': ['POST /rewards/{id}/redeem'],
  'GET /me/redemptions/{id}': [null, '6'],
  'GET /articles': ['GET /news'],
  'GET /articles/{slug}': ['GET /news/{id}'],
  'POST /support/tickets': [null, '7'],
  'GET /me/support/tickets': [null, '7'],
  'GET /me/support/tickets/{id}': [null, '7'],
  'POST /me/support/tickets/{id}/messages': [null, '7'],
  'POST /me/data-requests': [null, '8'],
};

// ---------------------------------------------------------------- load
const load = (file) => yaml.load(readFileSync(file, 'utf8'));
const contracts = { app: load('contracts/app/openapi.yaml'), admin: load('contracts/admin/openapi.yaml') };
const implemented = {};
for (const [surface, prefix] of Object.entries(SURFACES)) {
  const file = `build/openapi.${surface}.json`;
  implemented[surface] = new Set(
    existsSync(file)
      ? operations(JSON.parse(readFileSync(file, 'utf8'))).map(
          ([m, p]) => `${m.toUpperCase()} ${p.slice(prefix.length)}`,
        )
      : [],
  );
}
const handoff = load('docs/admin/openapi/openapi.yaml');
const handoffApp = operations(handoff)
  .filter(([, p]) => !p.startsWith('/admin'))
  .map(([m, p]) => `${m.toUpperCase()} ${p}`);
const handoffModels = [...readFileSync('docs/admin/prisma/schema.prisma', 'utf8').matchAll(/^model (\w+)/gm)].map(
  (m) => m[1],
);

const problems = [];
for (const op of handoffApp) if (!APP_FEATURE_MAP[op]) problems.push(`hand-off op not mapped: ${op}`);
for (const model of handoffModels) if (!MODEL_MAP[model]) problems.push(`hand-off model not mapped: ${model}`);
const appOps = new Set(operations(contracts.app).map(([m, p]) => `${m.toUpperCase()} ${p}`));
for (const [op, [target]] of Object.entries(APP_FEATURE_MAP)) {
  if (target && !appOps.has(target)) problems.push(`${op} maps to ${target}, which is not in contracts/app`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

// ---------------------------------------------------------------- render
const lines = [];
const out = (s = '') => lines.push(s);
out('# Gap report');
out();
out(
  `> Generated by \`npm run gap-report\` on ${today} (current phase **${currentPhase}**). Do not edit by hand: change the`,
);
out(
  '> contracts, the code or the maps in `scripts/gap-report.mjs`, then re-run. Plan: [execution-plan.md](execution-plan.md).',
);
out();
out('## 1. Operations by surface and phase');
out();
out('An operation is **implemented** when the spec generated from code (`npm run contract:generate`) contains it.');
out();
for (const [surface, prefix] of Object.entries(SURFACES)) {
  const ops = operations(contracts[surface]);
  const done = ops.filter(([m, p]) => implemented[surface].has(`${m.toUpperCase()} ${p}`)).length;
  out(`### ${surface === 'app' ? 'App' : 'Admin'} surface (\`${prefix}\`): ${done} of ${ops.length} implemented`);
  out();
  out('| Phase | Operations | Implemented | Missing |');
  out('|---|---|---|---|');
  for (const phase of PHASES) {
    const inPhase = ops.filter(([, , op]) => String(op['x-phase']) === phase);
    if (!inPhase.length) continue;
    const missing = inPhase.filter(([m, p]) => !implemented[surface].has(`${m.toUpperCase()} ${p}`));
    const list =
      missing.length > 12
        ? `${missing.length} operations`
        : missing.map(([m, p]) => `\`${m.toUpperCase()} ${p}\``).join(', ');
    out(`| ${phase} | ${inPhase.length} | ${inPhase.length - missing.length} | ${list || '—'} |`);
  }
  out();
}

out('## 2. Hand-off member and company features not yet in `contracts/app`');
out();
out(
  'The Flutter contract wins for app routes (D1). These hand-off operations have no Flutter equivalent yet. Each is added',
);
out('to `contracts/app/openapi.yaml` (contract first, Flutter naming, snake_case) in the PR of the phase shown.');
out();
out('| Hand-off operation | Add in phase |');
out('|---|---|');
const missingFeatures = Object.entries(APP_FEATURE_MAP).filter(([, [target]]) => !target);
for (const [op, [, phase]] of missingFeatures) out(`| \`${op}\` | ${phase} |`);
out();
out(
  `${missingFeatures.length} of ${handoffApp.length} hand-off member/company operations are missing; the other ${handoffApp.length - missingFeatures.length} map to an existing Flutter route:`,
);
out();
out('<details><summary>Mapped operations</summary>');
out();
out('| Hand-off | Flutter contract |');
out('|---|---|');
for (const [op, [target]] of Object.entries(APP_FEATURE_MAP)) if (target) out(`| \`${op}\` | \`${target}\` |`);
out();
out('</details>');
out();

out('## 3. Hand-off data model → repo entities');
out();
out(
  'Repo entity names stay (D7). **built** = table exists in a migration; **designed** = in `database-entities.md`, not built;',
);
out('**differs** = designed, but the hand-off needs changes; **missing** = no table designed yet.');
out();
out('| Hand-off model | Repo entity | Status | Note |');
out('|---|---|---|---|');
const counts = {};
for (const model of handoffModels) {
  const [entity, status, note] = MODEL_MAP[model];
  const real = status === 'built' && entity.split(', ').every((t) => BUILT_TABLES.has(t)) ? 'built' : status;
  counts[real] = (counts[real] ?? 0) + 1;
  out(
    `| \`${model}\` | ${
      entity === '—'
        ? '—'
        : entity
            .split(', ')
            .map((e) => `\`${e}\``)
            .join(', ')
    } | ${real} | ${note} |`,
  );
}
out();
out(
  `Totals: ${Object.entries(counts)
    .map(([k, v]) => `${k} ${v}`)
    .join(' · ')} (of ${handoffModels.length}).`,
);
out();

out('## 4. Differences to resolve before the phase that needs them');
out();
out('| Topic | App contract | Admin contract | Resolve by |');
out('|---|---|---|---|');
out(
  '| Opportunity status | `DRAFT, IN_REVIEW, CHANGES_REQUESTED, PUBLISHED, PAUSED, CLOSED, ARCHIVED` | `DRAFT, IN_REVIEW, CHANGES_REQUESTED, PUBLISHED, REJECTED, CLOSED` | Phase 5: one status enum for both (add `REJECTED`, `PAUSED`, `ARCHIVED` where missing) |',
);
out('| Opportunity type `PROJECT` | present | present | BQ-81 (Phase 5) |');
out(
  '| Company team roles | single Company Account | `OWNER, RECRUITER, EDITOR` on company team | Phase 4: admin team view shows the single account (P3) |',
);
out(
  '| Reward errors | `INSUFFICIENT_POINTS`, `REWARD_UNAVAILABLE` | — | Phase 6: add `LEVEL_TOO_LOW`, `OUT_OF_STOCK` (BQ-76, docs/error-codes.md) |',
);
out(
  '| Hand-off admin descriptions | — | some still name camelCase fields in prose | Fix when the phase touches the operation |',
);
out();
writeFileSync('docs/gap-report.md', `${lines.join('\n')}\n`);
console.log(
  `Wrote docs/gap-report.md (${missingFeatures.length} app features to add, ${handoffModels.length} models mapped)`,
);
