# Instructions for the AI code editor — Back of House backend

You are extending the **existing** Back of House backend so it serves:

1. the Flutter mobile app (members and company accounts),
2. a new **admin back-office** web app with five team roles (Super admin, Reviewer, Editor, Support, Analyst).

The screens are already designed (HTML hand-off package). This folder is the backend contract for them.

**Target stack:** Node.js (LTS) · NestJS · PostgreSQL · Prisma · Redis + BullMQ · S3-compatible storage · TypeScript strict.
If the existing backend uses a different ORM or layout, keep what exists and follow its conventions; the contract and rules still apply.

## Read these first, in order

| File | What it gives you |
|---|---|
| `docs/01-domain-and-rules.md` | Business rules and state machines. These are requirements, not suggestions |
| `docs/02-roles-and-permissions.md` | Permission keys and the role matrix |
| `docs/04-api-conventions.md` | Auth, errors, pagination, languages, idempotency, uploads, audit |
| `openapi/openapi.yaml` | The API contract (OpenAPI 3.1, 195 operations). `x-permission` and `x-screens` on each operation |
| `docs/03-data-model.md` + `prisma/schema.prisma` | Target data model |
| `docs/05-screen-api-map.md` | Which endpoints each screen needs |
| `docs/06-jobs-notifications-analytics.md` | Jobs, notifications, metric definitions, export datasets |

## Ground rules

- **Don't break the Flutter app.** Never remove or change the behaviour of an existing route it uses. If a contract route conflicts with an existing one, keep the old one working and add the new one.
- **Contract first.** Request/response shapes, status codes and error codes must match `openapi.yaml`. If you must deviate, change the YAML in the same commit and explain why in the commit message.
- **Enforce rules on the server.** Permissions, state transitions, points, privacy and the personal-data export rule are checked in services, never only in the UI.
- **Small, reviewable steps.** One phase per branch / pull request, with tests. Don't start the next phase until the current one passes its checks.
- **Ask, don't guess,** when the existing code and these docs disagree on something that changes data. Write the question in `docs/backend-gap-report.md` under "Questions" and carry on with the parts that aren't blocked.
- Never commit secrets. Configuration comes from environment variables (`.env.example` lists them).

## Phase 0 — Discovery and gap report (no behaviour changes)

1. Read the existing codebase: modules, routes, entities/tables, auth, file storage, push/email providers, jobs, tests, CI.
2. Create `docs/backend-gap-report.md` with:
   - a table mapping every model in `prisma/schema.prisma` to an existing table (or "missing");
   - a table mapping every operation in `openapi.yaml` to an existing route (exists / differs / missing). Generate it with a script from the YAML so it can be re-run;
   - risks (data that needs migrating, behaviour the Flutter app depends on);
   - questions for the product owner (start with "Open questions" in doc 01).
3. Add tooling if missing: lint, format, test runner, `openapi.yaml` copied to `contracts/`, and a contract test step (see Testing).

**Done when** the gap report is committed and reviewed. Stop and wait for approval before Phase 1.

## Phase 1 — Foundations

- Config module, structured logging with trace ids, RFC 7807 error filter with the codes in doc 04, `Accept-Language` handling, pagination helpers (cursor and page), idempotency interceptor + `IdempotencyRecord` table.
- Uploads: `POST /uploads` with pre-signed URLs; private vs public purposes; signed GET URLs.
- Audit interceptor writing `AuditLog` for every admin write and sensitive read.
- Migrations for missing tables/columns (reversible). Revoke UPDATE/DELETE on `PointsTransaction` and `AuditLog` for the app DB role.
- Seed: earning rules (registration locked at 0), taxonomy (cities, crafts, listing types, company categories), settings defaults, one Super admin from env.

## Phase 2 — Admin identity and roles

- `AdminUser`, invites (72 h), password + mandatory TOTP, sessions with 30-min idle timeout, rate limits.
- Permission matrix constant, `@RequirePermission()` guard, `GET /admin/me`, `GET /admin/roles`, team endpoints, `LAST_SUPER_ADMIN` rule.
- **Done when** an e2e test signs in each of the five roles and gets 403 on an endpoint outside its permissions.

## Phase 3 — Member and company API gaps

Implement whatever the gap report marks missing or different for the app: auth, `/me`, home, events and registrations (0 points), listings and applications (privacy snapshot), companies index (A–Z with letters, filters, watch list) and company page, follows, claims, professionals, news, notifications, points and rewards (atomic redemption), verification requests, reports, support tickets, and the company workspace (listings with submit + automated checks, applicants and status changes, supplier requests and responses, profile and portfolio).

## Phase 4 — Review and trust

Admin listings review (approve / request changes / reject, SLA, history, notifications), applications (read-only), supplier requests, verification queue with signed document URLs, claims, moderation cases and actions, users and companies admin (detail, notes, suspend, remove verification, Companies to watch, data requests).

## Phase 5 — Content, events, points, support, broadcasts

Admin events (CRUD, door check-ins, attendance summary, award points idempotently), news (bilingual drafts, checks, schedule/publish job), rewards and redemptions, points ledger and manual adjustments (Support cap), earning rules, support inbox (SLA in working hours, macros, send & solve), broadcasts (audience estimate, quiet hours, scheduling, test send), imports (validate → preview → confirm, error report).

## Phase 6 — Dashboards, analytics, reports and exports

Role homes (`/admin/my-work/*`), overview, analytics KPIs/series/breakdowns/top listings with the definitions in doc 06 (materialized views refreshed every 15 min), report catalog, export jobs (CSV/XLSX/PDF incl. Arabic), personal-data rule, 24-h expiry, scheduled exports, saved reports, audit log endpoint, settings and taxonomy.

## Testing (every phase)

- **Unit tests** for every rule in doc 01 that has a number or a state machine: listing transitions, review SLA, support points cap, redemption balance/level/stock, attendance award idempotency, translation requirement, last Super admin, personal-data export.
- **Contract tests:** validate real responses against `openapi.yaml` (e.g. `jest-openapi` or Schemathesis against a seeded test DB).
- **Permission tests:** a table-driven e2e test that calls each admin operation as each role and expects 2xx for roles with the `x-permission` key and 403 for the others.
- **Seed data** that matches the screens (Saudi Events Group, Riyadh Tech Summit, Stage Manager listing, Reem Alharbi with 2,450 points…) so the web and app teams can build against realistic data.

## Definition of done (per phase)

- Endpoints match the contract; contract and permission tests pass.
- Migrations are reversible and run cleanly on a copy of production data.
- Every admin write appears in the audit log.
- The Flutter app's existing flows still pass their tests.
- `docs/backend-gap-report.md` is updated (rows moved from missing → done).

## Environment variables (minimum)

`DATABASE_URL`, `REDIS_URL`, `JWT_MEMBER_SECRET`, `JWT_ADMIN_SECRET`, `TOTP_ENCRYPTION_KEY`, `S3_ENDPOINT`, `S3_BUCKET_PUBLIC`, `S3_BUCKET_PRIVATE`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `PUSH_PROVIDER_KEY` (FCM), `EMAIL_PROVIDER_KEY`, `ADMIN_EMAIL_DOMAIN`, `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_NAME`, `APP_TIMEZONE=Asia/Riyadh`.

## Suggested module layout (NestJS)

```
src/
  common/        errors, i18n, pagination, idempotency, audit, guards, uploads
  auth/          member auth
  admin-auth/    admin auth, invites, TOTP, sessions
  users/  companies/  listings/  applications/  supplier-requests/
  events/  points/  rewards/  verification/  claims/  moderation/
  news/  notifications/  support/  broadcasts/  imports/
  analytics/  exports/  audit/  settings/  team/
  jobs/          BullMQ processors
```

Start with **Phase 0** now and stop after the gap report.
