# Back Of House — Backend

NestJS modular monolith (`api` + `worker` from one codebase) on Supabase PostgreSQL through Prisma, exposing two REST surfaces (ADR-031):

| Surface | Prefix | Client | Contract | Swagger (non-production) |
| --- | --- | --- | --- | --- |
| **App** | `/api/app/v1` | Flutter app (members, Company Accounts) | [contracts/app/openapi.yaml](contracts/app/openapi.yaml) | `/docs/app` |
| **Admin** | `/api/admin/v1` | Admin back-office (staff, Google Workspace sign-in) | [contracts/admin/openapi.yaml](contracts/admin/openapi.yaml) | `/docs/admin` |

Health probes are shared: `/api/health`, `/api/health/ready`. The build plan is [docs/execution-plan.md](docs/execution-plan.md).

**The architecture lives in [`docs/`](docs/BACK_OF_HOUSE_BACKEND_MAP.md) and is the source of truth.** This README covers only how to run and work on the code. Where the code makes a choice the docs leave open, it is listed under [Decisions and assumptions](#decisions-and-assumptions).

## Status

Built: **Stages 1–3** of [docs/backend-development-order.md](docs/backend-development-order.md), then **Phase 0** of [docs/execution-plan.md](docs/execution-plan.md), which supersedes the stage order from here on.

| Stage | Contents | State |
| --- | --- | --- |
| 1 · Project foundation | Config validation (zod), pino logging with redaction, request id → `trace_id`, error body `{code, message, trace_id, errors}`, 422 validation, `{data, meta}` envelope, cursor/offset pagination, `/health` + `/health/ready`, OpenAPI, Helmet, CORS allow-list, throttling, deny-by-default, `api` + `worker` entrypoints, ESLint + Prettier + dependency-cruiser, Jest, CI, Dockerfile | Done |
| 2 · Database foundation | Prisma 7 multi-file schema, private `app` schema, extensions, `boh_app` role and grants, RLS deny-all helper, `raise_immutable()`, `app.normalize_ar()`, `PrismaService`, `TransactionRunner`, real-Postgres test harness, seed runner | Done |
| 3 · Platform | `audit_logs` + `AuditLogger` + `redact()`, transactional outbox (`outbox_events`, writer, dispatcher, `@OnDomainEvent`), pg-boss jobs, storage port | Done (audit read endpoint waits for Stage 6) |
| Phase 0 · Structure | Two surfaces (`src/surfaces/app`, `src/surfaces/admin`) with `GET /ping`, `GET /api/app/v1/meta/app-version`, two Swagger pages, boot-time route check, surface boundary rules, contracts in `contracts/` with `x-phase`, contract check + coverage + gap report scripts, oasdiff in CI, admin client types | Done |
| Phase 1A · Foundations | Actor + per-surface auth guard + permission guard and matrix, locale, page types, `Idempotency-Key`, `@AuditRead` and the admin-write audit check, platform settings (`GET/PUT /api/admin/v1/settings`), CodeQL, Dependabot, squawk, schema-drift test | Done |
| Phase 2A · Staff identity | Google Workspace sign-in (OIDC), staff accounts and invites, cookie sessions + CSRF, `/api/admin/v1/me`, `/roles`, `/team`, permission-matrix e2e | Done |
| Phase 1B · Taxonomy | Regions/cities, crafts, industries and the fixed lists; `GET/PUT /api/admin/v1/taxonomy/{kind}`, `GET /api/app/v1/meta/taxonomy`; all Phase 1 contract operations implemented | Done |
| Phase 2B · Member identity | `/api/app/v1/auth/*` (email + password, phone SMS code, refresh, logout, password reset) and `GET /me` over Supabase Auth (in memory locally without Supabase), company created at registration, activity tracking; all Phase 2 contract operations implemented (`contracts/phase.json` = 2) | In progress |
| Next | Member identity, notifications, uploads, … | Hosting deferred while in development. See [docs/execution-plan.md](docs/execution-plan.md) and [docs/gap-report.md](docs/gap-report.md) |

## Layout

```
prisma/
  schema/            multi-file Prisma schema (one file per module), all models in the `app` schema
  migrations/        Prisma migrations with hand-written SQL (RLS, grants, triggers, CHECKs)
  seed/              idempotent seed runner
contracts/
  app/openapi.yaml   app surface contract (source of truth), every operation tagged x-phase
  admin/openapi.yaml admin surface contract (source of truth); admin/types/ = generated client types
  phase.json         current phase: operations due up to it must be implemented
scripts/
  contracts/         coverage, generate (spec from code), check (code vs contract), one-time converter
  gap-report.mjs     regenerates docs/gap-report.md
src/
  main.ts            api entrypoint
  worker.ts          worker entrypoint (outbox dispatcher + scheduled jobs)
  http-app.ts        HTTP middleware stack shared by main.ts and e2e tests
  config/            zod env schema → typed AppConfig
  common/            framework-only: errors, filter, envelope, pagination, pipes, request context, Arabic text
  platform/          database, observability, outbox, jobs, rate-limit, storage, worker runtime
  modules/audit/     AuditLogger (first domain module, layer L0)
  surfaces/          ADR-031: app/ (/api/app/v1) and admin/ (/api/admin/v1) controllers + DTOs; route check
  generated/prisma/  generated client (git-ignored; `npm run prisma:generate`)
test/
  support/           embedded-Postgres harness, DB helpers
  integration/       real-database tests (migrations, roles, RLS, transactions, outbox)
  e2e/               full HTTP stack against the real database
  architecture/      boundary rules (dependency-cruiser) checked against fixtures; npm run test:architecture
```

## Getting started

Requirements: Node.js ≥ 20.19 (developed on 24), npm.

```bash
npm install
npm run prisma:generate
cp .env.example .env        # fill in the database URLs
npm run start:dev           # http://localhost:3000/api/health
```

Swagger UI: `http://localhost:3000/docs/app` and `http://localhost:3000/docs/admin` (disabled when `APP_ENV=production`).

### Contracts

```bash
npm run contracts          # x-phase coverage, generate specs from code, compare with contracts/
npm run contract:types     # regenerate contracts/admin/types/admin-api.d.ts
npm run gap-report         # regenerate docs/gap-report.md
npm run migrations:lint    # squawk on migrations added since origin/main
```

Change the contract first, then the code, in the same PR. When a phase is done, raise `current_phase` in `contracts/phase.json`.

### Environment

All variables are documented in [.env.example](.env.example) and validated at boot. The two database URLs are:

| Variable | Used by | Connection |
| --- | --- | --- |
| `DATABASE_URL` | api and worker at runtime | Session pooler (5432) or direct. Role `boh_app` in deployed environments |
| `DIRECT_DATABASE_URL` (alias `DIRECT_URL`) | `prisma migrate` only | Direct or session pooler, owner role |

The transaction pooler (port 6543, `pgbouncer=true`) works for the api, but the worker refuses it because pg-boss needs session features.

## Database

Migrations are Prisma migrations. Features Prisma cannot express are hand-written inside the migration file (ADR-002).

```bash
npm run db:migrate:status   # what is applied where
npm run db:migrate:deploy   # apply pending migrations (uses DIRECT_DATABASE_URL / DIRECT_URL)
```

To add a migration: change `prisma/schema/*.prisma`, then `npx prisma migrate dev --create-only` against a **local** database (never a hosted project, supabase-architecture.md §4), add any hand-written SQL, and commit.

**First deployment to a Supabase project** (once per environment):

1. `npm run db:migrate:deploy` with the owner-role `DIRECT_DATABASE_URL`.
2. Check the migration output for a `WARNING` about `BYPASSRLS`. If present, run `ALTER ROLE boh_app BYPASSRLS;` as a privileged role.
3. Enable the runtime role: `ALTER ROLE boh_app WITH LOGIN PASSWORD '<from the secrets manager>';`
4. Point `DATABASE_URL` at `boh_app` (on the Supabase pooler the user is `boh_app.<project-ref>`).
5. In the Supabase dashboard, confirm `app` is **not** in the Data API's exposed schemas.

## Testing

```bash
npm test                  # unit tests (no database)
npm run test:integration  # integration + e2e on a real Postgres 17
npm run test:all          # typecheck, lint, format, boundaries, unit, integration
```

Integration tests start an **embedded Postgres 17** (downloaded binary, UTF-8, throwaway directory) and apply the real migrations. In CI, set `TEST_DATABASE_ADMIN_URL` to a Postgres service container instead (see [.github/workflows/ci.yml](.github/workflows/ci.yml)). They never touch the database in `.env`.

## Running

```bash
npm run build
npm run start:prod        # api
JOBS_ENABLED=true npm run start:worker
docker compose up --build # api + worker containers
```

## Decisions and assumptions

Choices made where the docs are open or silent. Each is reversible without a data migration.

| Topic | Choice | Doc reference |
| --- | --- | --- |
| JSON casing | snake_case on both surfaces | ADR-019 (accepted 2026-10-11) |
| Prisma version | 7.10.1, `prisma-client` generator, `pg` driver adapter, `prisma.config.ts` | ADR-002, TQ-23 |
| NestJS version | 11 (Express 5). Exact pins; `overrides` force `multer` 2.5.0 and Swagger's `js-yaml` 5.4.3 until Nest ships them (security advisories). Remove each override once the parent package carries a fixed version | `npm audit --omit=dev --audit-level=high` in CI |
| UUID v7 | Generated by Prisma (`uuid(7)`) and by `common/ids/uuid-v7.ts`; **no database default**, because a DB default causes Prisma schema drift. Raw SQL inserts must supply ids | ADR-005, TQ-22 |
| Array `NOT NULL` | Enforced with CHECK constraints (Prisma cannot express it without drift) | database-design-rules.md §12 |
| 401 error code | `UNAUTHENTICATED` (the docs list 403 codes but name none for 401) | api-map.md §1.3 |
| Outbox envelope | Columns per the entity catalog; `event_version`, `actor`, `organization_id`, `request_id` stored inside `payload` | database-entities.md §12, domain-events.md §1 |
| Outbox retries | Event-level status: when one handler fails, all handlers for that event are retried (all must be idempotent). The docs mention per-handler records, but the catalog defines no table for them | domain-events.md §1 |
| Outbox claiming | Lease pattern: `FOR UPDATE SKIP LOCKED` + `available_at` pushed forward, so handlers run outside the claiming transaction | database-design-rules.md §14 |
| Audit FKs | `actor_user_id` / `organization_id` get their foreign keys when `users` (Stage 4) and `organizations` (Stage 8) exist | database-design-rules.md §6 |
| Deny by default | Per surface (`SurfaceAuthGuard`): a route needs an actor from its own surface's resolver. Admin: the staff session cookie (ADR-032). App: none yet (member identity), so only `@Public()` app routes are reachable | security-and-audit.md §3, ADR-031 |
| Admin sessions | Opaque token in `__Host-boh_admin` (httpOnly, Secure, SameSite=Strict); CSRF double-submit `__Host-boh_csrf` + `X-CSRF-Token` on writes; 30-min idle (setting), 12 h max; ID tokens verified with `node:crypto` against Google's JWKS (no JWT library) | ADR-032 |
| Staff email domain | `STAFF_GOOGLE_WORKSPACE_DOMAIN` only; the `admin_email_domain` setting shows it and cannot change it | ADR-032 |
| Database time zone | Every app session runs `TimeZone=UTC`: the pg adapter sends dates without an offset | `test/integration/time-zone.int-spec.ts` |
| Staff in audit rows | `actor_type = STAFF`, `actor_user_id` = the staff account id (staff are not `users`, ADR-032); that column's future foreign key must not target `users` for STAFF rows | ADR-016, ADR-032 |
| Migrations | Each new migration sets `lock_timeout` and `statement_timeout`; squawk lints migrations added in a PR (`npm run migrations:lint`) | database-design-rules.md |
| Test database | Embedded Postgres locally, service container in CI | Stage 2 |
