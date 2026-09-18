# Architecture

Back Of House is a **modular monolith**: one NestJS process, one Supabase project, with each business domain in its own module. Modules talk through injected services, never through each other's tables, so any one of them can later be extracted into a separate service without rewriting its callers.

## Layers

```
Flutter app
   │  HTTPS, Authorization: Bearer <Supabase access token>
   ▼
NestJS API ─────────────────────────────────────────────────────────────
   Helmet · CORS · body limits · rate limiting (ThrottlerGuard)
   AuthGuard ........ verifies the token, loads the profile, sets request.user
   PermissionsGuard . checks @Auth(...permissions) against the platform role
   ValidationPipe ... DTO whitelisting, type coercion, rejects unknown fields
   Controller ....... HTTP only: routing, status codes, OpenAPI metadata
   Service .......... business rules, resource-level authorization, audit
   DatabaseService .. Supabase clients (service role / anon / per-user)
   AllExceptionsFilter + TransformResponseInterceptor ... one response shape
   ▼
Supabase
   Auth ....... credentials, sessions, email verification, password reset
   PostgreSQL . tables, constraints, RLS, transactional functions
   Storage .... image buckets (public read, service-role write)
```

## Project structure

```
src/
├── main.ts                  bootstrap: security middleware, validation, Swagger
├── app.module.ts            module wiring, global guard/filter/interceptor
├── config/                  typed configuration + fail-fast env validation
├── common/
│   ├── constants/           table names, RPC names, buckets, limits
│   ├── exceptions/          BusinessException hierarchy + stable error codes
│   ├── filters/             AllExceptionsFilter (single error envelope)
│   ├── interceptors/        TransformResponseInterceptor (single success envelope)
│   ├── pagination/          PaginationQueryDto, parsePagination, paginate
│   ├── pipes/               ParseUuidPipe, ValidationException
│   ├── types/               shared types (UUID, ListResult, PaginatedResponse)
│   └── utils/               query (search/sort whitelists), update (mass-assignment guard)
├── database/                DatabaseService — the only place Supabase clients are built
├── auth/                    Supabase Auth flows, AuthGuard, PermissionsGuard, RBAC model
├── audit/                   audit trail writer + admin search
├── users/  companies/  professionals/  events/  opportunities/
├── news/  courses/  points/  rewards/  notifications/  files/  health/
supabase/
├── migrations/              SQL schema, RLS, transactional functions, storage
└── seed.sql                 fictional development data
test/
├── support/                 in-memory Supabase stand-in, app factory
└── security.e2e-spec.ts     end-to-end security suite
```

Each domain module follows the same layout: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.types.ts` (enums and entity interfaces) and `dto/`.

## Modules

| Module | Responsibility | Depends on |
| --- | --- | --- |
| Database | Owns the Supabase clients (global) | Config |
| Audit | Records security/business actions; admin search (global) | Database |
| Auth | Signup, login, refresh, logout, password flows, current identity; guards | Database, Audit |
| Users | Own profile (private fields), public directory projection | Database |
| Companies | Companies, membership, member roles; company-level authorization | Database, Audit |
| Professionals | Talent profiles with visibility | Database |
| Events | Events, registration with capacity | Database, Companies |
| Opportunities | Jobs, projects, supplier requests in one model | Database, Companies |
| News | First-party articles; member comments/reactions; moderation | Database, Audit |
| Courses | Catalogue, enrolment, completion with points | Database, Audit |
| Points | Ledger, balance, admin adjustments | Database, Audit |
| Rewards | Catalogue, transactional redemption | Database, Audit |
| Notifications | Per-member inbox (written by backend flows only) | Database |
| Files | Validated image uploads to Storage | Database, Audit, Config |
| Health | Liveness probe | — |

## Data model

All tables use UUID primary keys, `created_at`/`updated_at` timestamps (maintained by trigger), foreign keys, check constraints and enums. Indexes cover foreign keys, lookup columns (`auth_user_id`, `slug`), filter columns (`status`, `type`) and sort columns (`published_at`, `start_date`, `created_at`).

```
auth.users 1─1 users ─┬─< company_members >─ companies
                      ├─1 professionals
                      ├─< event_registrations >─ events >─ companies
                      ├─< opportunities >─ companies
                      ├─< news_comments >─ news_articles
                      ├─< news_reactions >─ news_articles
                      ├─< course_enrollments >─ courses
                      ├─< points_transactions      (ledger, append-only)
                      ├─1 point_balances           (derived cache, CHECK balance >= 0)
                      ├─< reward_redemptions >─ rewards
                      └─< notifications
audit_logs (actor_id → users.id, no FK so records survive account deletion)
```

Two identifiers exist for every person and must not be confused:

- `auth.users.id` — Supabase Auth subject, the `sub` of the JWT.
- `users.id` — the application **profile id**. Every domain foreign key (`user_id`, `created_by`, `author_id`) references this one.

`AuthGuard` resolves the profile id once per request and puts both on `request.user`, so services never look it up again.

### Extensibility points

- **Event registration** is a separate table, so waitlists, check-in and ticket types extend it without touching `events`.
- **Opportunities** are one table with `type` (`job`, `project`, `supplier_request`) and `status`. Applications or supplier quotes will be a single `opportunity_submissions` table keyed by `opportunity_id`.
- **Courses** already have `course_enrollments` with `completed_at`; certificates will reference an enrolment row, and completion points flow through the ledger.

## Authentication flow

1. The app calls `POST /auth/signup` or `POST /auth/login`. The API forwards to Supabase Auth with the anon key; Supabase owns password hashing, sessions and email verification.
2. On signup the API sets `app_metadata.app_role = USER` with the service-role key and creates the `users` profile row.
3. The app stores the returned `access_token` / `refresh_token` and sends `Authorization: Bearer <access_token>` on every request.
4. `AuthGuard` calls `supabase.auth.getUser(token)`, which verifies the token with Supabase (signature, expiry, revocation). It then loads or provisions the profile, rejects suspended accounts, and builds `AuthContext`:

   ```ts
   { authUserId, profileId, email, role, accessToken }
   ```

   `role` comes from **`app_metadata`**, which only the service role can write. `user_metadata` is writable by the user and is never used for authorization.
5. `POST /auth/refresh` rotates the session; `POST /auth/logout` revokes it server-side.

Identity is never read from a request body. DTOs have no `user_id` for "who am I" purposes; services receive `AuthContext` from `@CurrentUser()`.

## Authorization flow

Authorization happens in two independent layers.

**1. Platform RBAC (route level).** `@Auth(Permission.X)` applies `AuthGuard` + `PermissionsGuard`. The role → permission table in [permissions.enum.ts](src/auth/decorators/permissions.enum.ts) is the single source of truth.

| Role | Holds |
| --- | --- |
| `USER`, `COMPANY_MEMBER`, `COMPANY_ADMIN` | Participation: read, create own content, comment, react, enrol, register, redeem |
| `PLATFORM_ADMIN` | Everything, including `NEWS_PUBLISH`, `COURSE_MANAGE`, `REWARD_MANAGE`, `POINTS_ADJUST`, `AUDIT_READ` |

**2. Resource authorization (service level).** Rights over a *specific* record are checked by the owning service:

- A company is administered by users whose `company_members.role = 'admin'` **for that company** (`CompaniesService.assertCompanyAdmin`). Holding `COMPANY_ADMIN` as a platform role grants nothing over an arbitrary company.
- Events and opportunities can be managed by their creator or an admin of the hosting company.
- Professional profiles, notifications, ledger rows and redemptions are scoped to the caller's `profileId`.
- `PLATFORM_ADMIN` bypasses resource checks.

Drafts and private profiles return **404** to people who cannot manage them, so their existence is not disclosed.

## Supabase integration

`DatabaseService` exposes three clients:

| Client | Key | RLS | Used for |
| --- | --- | --- | --- |
| `admin` | service role | bypassed | All data access after the API has authorized the caller |
| `anon` | anon | applies | Signup, login, refresh, password reset |
| `forUser(token)` | anon + user JWT | applies | Actions Supabase should re-authorize as the user (password change) |

RLS is therefore a **second line of defence**: it governs what a client holding the anon key could read directly, while the API is the primary enforcement point. See [SECURITY.md](SECURITY.md#row-level-security).

### Transactions

PostgREST runs one statement per request, so multi-step writes that must be atomic are Postgres functions (one function call = one transaction), callable only by the service role:

| Function | Guarantees |
| --- | --- |
| `award_points` | Ledger insert + balance update under a row lock; refuses a negative balance |
| `redeem_reward` | Locks the reward; checks status, expiry, stock, pending duplicates; debits points; decrements stock; records the redemption — all or nothing |
| `complete_course_enrollment` | Locks the enrolment; only an `enrolled` row can complete; credits points once |
| `register_for_event` | Locks the event; enforces capacity and single registration |
| `create_company_with_owner` | Company and its first admin membership together |

Unique constraints back these up: one pending redemption per member per reward, one enrolment per course, one registration per event, one membership per company, one professional profile per member.

## Response conventions

Success: `{ "data": ... }`, or for collections `{ "data": [...], "meta": { page, limit, total, totalPages } }`.

Error: `{ statusCode, error, code, message, timestamp, path, details? }`, where `code` is a stable value from `ErrorCode`. Unexpected errors are logged server-side and returned as a generic 500.

## Logging

Nest's logger with environment-dependent levels: production logs `error`, `warn` and `log`; development adds `debug` and `verbose`. Tokens, passwords and keys are never logged. Profile ids appear in authorization warnings; emails do not. The audit service redacts metadata keys that look like secrets (`password`, `token`, `key`, `secret`, `authorization`).

## Testing

| Layer | Location | What it proves |
| --- | --- | --- |
| Unit | `src/**/*.spec.ts` | Guards, RBAC table, pagination, UUID pipe, search/sort sanitisation, mass-assignment guard, error filter, upload validation |
| Service | `src/**/*.service.spec.ts` | Company membership authorization, redemption error mapping, ledger scoping, profile updates |
| End-to-end | `test/security.e2e-spec.ts` | Full HTTP stack: 401/403/400/404 paths, pagination limits, points manipulation, redemption, company isolation |

The e2e suite replaces only the Supabase client with an in-memory stand-in ([fake-supabase.ts](test/support/fake-supabase.ts)). It does **not** execute the SQL functions or RLS policies. Those need integration tests against a local Supabase stack (`supabase start`) — see [SECURITY.md § Known limitations](SECURITY.md#known-limitations).

## Design decisions

Where the brief was ambiguous, these are the choices made (simplest production-safe option):

1. **Clients never write through RLS.** Only SELECT policies exist for `authenticated`. Every write goes through the API, which keeps business rules in one place and makes RLS a pure read filter. Allowing direct writes later means adding a narrowly scoped policy per table.
2. **Platform role in `app_metadata`, company role in `company_members`.** The prompt's four roles are kept, but company authority is per company, because a single global `COMPANY_ADMIN` flag cannot say *which* company.
3. **Profiles are provisioned lazily** by `AuthGuard` if a Supabase account has no `users` row (e.g. created in the dashboard), so every authenticated request has a profile id.
4. **The balance is a cache of the ledger**, maintained only inside `award_points` under a row lock. The ledger is authoritative; balances can be rebuilt with `SUM(amount)`.
5. **One pending redemption per reward per member.** A member can redeem the same reward again once the previous one is fulfilled or cancelled.
6. **News authorship is platform-only.** Members comment and react; `NEWS_MODERATE` is separate from `NEWS_PUBLISH`.
7. **Public member directory excludes email and phone.** Full profiles are returned only to their owner.
8. **Swagger is disabled in production** to avoid publishing the attack surface.
9. **Search uses an allow-list of characters** rather than escaping, removing PostgREST filter injection entirely; sort columns are whitelisted per endpoint.
10. **Existing migrations are not edited.** Fixes are additive migrations, so environments that already applied the originals converge safely.
11. **Images only.** Uploads accept JPEG/PNG/WebP, verified by file signature; SVG is excluded because it can carry script.
