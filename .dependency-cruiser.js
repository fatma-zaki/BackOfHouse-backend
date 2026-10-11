/**
 * Module boundary rules (nest-module-map.md §2.1, module-dependency-map.md).
 * Run with `npm run depcruise`; CI fails on any violation.
 */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'common-is-framework-only',
      comment: 'common/ holds no business rules and depends on neither platform nor domain modules',
      severity: 'error',
      from: { path: '^src/common/' },
      to: { path: '^src/(platform|modules)/' },
    },
    {
      name: 'platform-has-no-business-rules',
      comment: 'platform/ is technical infrastructure and never imports a domain module',
      severity: 'error',
      from: { path: '^src/platform/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'modules-import-each-other-through-index',
      comment: 'Other modules may only import a module through its public index.ts',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/([^/]+)/(?!index\.ts$)', pathNot: '^src/modules/$1/' },
    },
    {
      name: 'domain-folder-is-pure',
      comment: 'modules/*/domain has no Nest or Prisma imports (unit-testable logic)',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain/' },
      to: { path: '(@nestjs|generated/prisma|@prisma)' },
    },
    // ── API surfaces (ADR-031, execution-plan.md §1.5) ──────────────────────
    {
      name: 'app-surface-not-admin',
      comment: 'The app surface never imports the admin surface: DTOs and controllers stay per client',
      severity: 'error',
      from: { path: '^src/surfaces/app/' },
      to: { path: '^src/surfaces/admin/' },
    },
    {
      name: 'admin-surface-not-app',
      comment: 'The admin surface never imports the app surface: DTOs and controllers stay per client',
      severity: 'error',
      from: { path: '^src/surfaces/admin/' },
      to: { path: '^src/surfaces/app/' },
    },
    {
      name: 'business-logic-not-surfaces',
      comment: 'modules/, platform/ and common/ never know which client is calling',
      severity: 'error',
      from: { path: '^src/(modules|platform|common)/' },
      to: { path: '^src/surfaces/' },
    },
    {
      name: 'surfaces-use-module-index',
      comment: 'Surfaces use a domain module only through its public index.ts',
      severity: 'error',
      from: { path: '^src/surfaces/' },
      to: { path: '^src/modules/[^/]+/(?!index\.ts$)' },
    },
    {
      name: 'worker-has-no-surfaces',
      comment: 'The worker process serves no HTTP routes',
      severity: 'error',
      from: { path: '^src/worker(\.module)?\.ts$' },
      to: { path: '^src/surfaces/' },
    },
    { name: 'no-legacy', severity: 'error', from: { path: '^src/' }, to: { path: '^legacy/' } },
    { name: 'no-test-code-in-src', severity: 'error', from: { path: '^src/', pathNot: '\.spec\.ts$' }, to: { path: '^test/' } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^src/generated/|\.spec\.ts$)' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
