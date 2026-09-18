# Architecture Decision Records

> Every significant architectural decision is recorded here.
> **Status:** `Accepted` (decided; change requires a new ADR) · `Proposed` (recommended; awaiting confirmation) · `Open` (needs a decision; options listed) · `Superseded by ADR-xxx`.
> The stack decisions directed by the project owner (NestJS, TypeScript, PostgreSQL on Supabase, Prisma, REST) are **Accepted**. Everything else stays **Proposed** until confirmed.

## Index

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | Modular monolith in NestJS | Accepted |
| ADR-002 | Prisma as ORM (with hand-written SQL for advanced constraints) | Accepted |
| ADR-003 | Supabase Auth for authentication; NestJS for authorization | Proposed |
| ADR-004 | Code-defined permission catalog; organization context in the URL, not the token | Proposed (context model refined by ADR-029) |
| ADR-005 | UUID v7 primary keys | Proposed |
| ADR-006 | Soft delete only where justified; status-based archival preferred | Proposed |
| ADR-007 | Dedicated `app` schema; RLS deny-all backstop; app-level authorization | Proposed |
| ADR-008 | REST API conventions: URI versioning, error format, cursor pagination, idempotency | Accepted (REST, `/api/v1`) / Proposed (details) |
| ADR-009 | Supabase Storage with quarantine, public and private buckets | Proposed |
| ADR-010 | pg-boss for background jobs (no Redis) | Proposed |
| ADR-011 | Transactional outbox for domain events (no message broker) | Proposed |
| ADR-012 | PostgreSQL full-text + trigram search over a public-only projection | Proposed |
| ADR-013 | No caching layer initially | Proposed |
| ADR-014 | Points as an append-only ledger with balance projection | Proposed |
| ADR-015 | One `organizations` table for companies and institutions | Superseded by ADR-024 |
| ADR-016 | Audit logs written synchronously in the same transaction, append-only | Proposed |
| ADR-017 | First-party analytics events table + provider forwarding | Proposed |
| ADR-018 | Organization status stored as the PRD enum, derived from facts | Proposed |
| ADR-019 | API JSON field casing | **Open** |
| ADR-020 | Money as integer minor units | Proposed |
| ADR-021 | Bilingual content as paired `_ar`/`_en` columns | Proposed |
| ADR-022 | Separate `api` and `worker` processes from one codebase | Proposed |
| ADR-023 | Hosting platform for NestJS | **Open** |
| ADR-024 | Every organization is a company (no organization types) | Accepted (business decision BQ-06) |
| ADR-025 | Company approval, ownership and verification signals are separate | Accepted (business decisions BQ-04, BQ-05, BQ-46, BQ-47, BQ-48) |
| ADR-026 | Two account types; company types (one or more) as classification; company projects as a separate domain | Accepted (business rules §1–§4, BQ-61) |
| ADR-027 | Unified opportunity model with separate individual applications and B2B supplier responses | Accepted (business rules §5–§9) |
| ADR-028 | Monetization deferred; paid visibility always separate from verification | Accepted (business rules §10–§12) |
| ADR-029 | Individual and Company accounts as separate security contexts | Accepted (BQ-60) |
| ADR-030 | One Company Account per company; Individual members without permissions | Accepted (BQ-68, BQ-69, BQ-74) |

---

## ADR-001 · Modular monolith in NestJS

```text
Decision:   Build one NestJS application organised into domain modules with enforced boundaries.
Context:    PRD §19 recommends "a modular application service that starts as a single organised
            application before being split into services". Phased delivery (§6), a small team (§25),
            a strong need for transactional consistency (ownership, points, billing).
Options:    (a) modular monolith  (b) microservices from day one  (c) unstructured monolith
Chosen:     (a)
Why:        Transactions across modules (claim → ownership, payment → entitlements) stay simple ACID
            transactions; one deploy and one database; boundaries (index.ts exports, dependency-cruiser,
            events, ports) keep future extraction possible.
Trade-offs: Discipline required to keep boundaries; a single deploy unit scales as a whole (mitigated
            by the api/worker split, ADR-022).
Date:       2026-09-14
```

## ADR-002 · Prisma as ORM

```text
Decision:   Use Prisma for schema, migrations and data access.
Context:    Directed by the project owner unless requirements give a strong reason otherwise. The design
            needs partial unique indexes, CHECK constraints, exclusion constraints, tsvector/GIN,
            partitioning, immutability triggers, row locks (FOR UPDATE / SKIP LOCKED).
Options:    (a) Prisma  (b) TypeORM  (c) Drizzle / Kysely (SQL-first)  (d) MikroORM
Chosen:     (a) Prisma
Why:        Strong type safety, good migration workflow, team familiarity, multi-file schema.
            None of the advanced requirements is blocked: they are written as SQL inside Prisma migration
            files (`migrate dev --create-only`), and lock queries use `$queryRaw` tagged templates
            inside interactive transactions. This is not a strong enough reason to switch ORM.
Trade-offs: Some schema facts live in SQL rather than schema.prisma (documented in
            database-entities.md); interactive transactions hold a connection (keep them short);
            Unsupported("tsvector") fields are not queryable through the typed client (search uses raw SQL).
            Prisma major-version specifics (config file, driver adapters, pooler parameters) to be
            pinned at setup (TQ-23).
Date:       2026-09-14
```

## ADR-003 · Supabase Auth for authentication; NestJS for authorization

```text
Decision:   Authenticate users with Supabase Auth (OTP email/phone, sessions, MFA). NestJS verifies
            Supabase JWTs (JWKS) and performs all authorization from its own tables.
Context:    AUTH-01..05 require OTP registration (decided 2026-09-15, BQ-30: OTP + password; web + mobile, BQ-01), session refresh and global sign-out, MFA for sensitive
            roles, password policy with leaked-password protection, attempt limits. The database is already
            on Supabase. The existing Flutter app expects /auth/* endpoints on the API (TQ-02).
Options:    (a) Supabase Auth, client talks to Supabase directly; NestJS handles /me + onboarding
            (b) Supabase Auth behind a NestJS /auth/* facade (keeps current frontend contract)
            (c) Custom NestJS auth (passport, own OTP, sessions, TOTP)
            (d) Other IdP (Auth0, Cognito, Keycloak)
Chosen:     (a), pending confirmation of TQ-01/TQ-02 and BQ-31. BQ-30 (OTP + password) is fully supported:
            password sign-up with code confirmation, password sign-in, recovery by code
Why:        Covers AUTH-01..04 without building security-critical code; JWT `aal` claim supports MFA
            enforcement by role; `session_id` claim supports immediate revocation; asymmetric JWKS
            verification requires no shared secret; same vendor as the database.
            (b) adds a proxy layer with little benefit; (c) is costly and risky; (d) adds another vendor.
Trade-offs: Vendor coupling for identity; data residency must be confirmed (BQ-31); frontend auth layer
            must change to the Supabase SDK; app.users must be kept in sync with auth.users by the app
            (no cross-schema FK); admin session revocation relies on reading auth.sessions (verify).
            Revisit if BQ-31 requires in-country hosting Supabase can't provide, or the Saudi SMS provider
            can't be integrated via the Send SMS hook.
Date:       2026-09-14
```

## ADR-004 · Permission catalog in code; organization context in the URL

```text
Decision:   Roles and role→permission mappings are defined in code and versioned in git. Role
            assignments are data (user_platform_roles; company access via organizations.account_user_id, ADR-030).
            The acting organization is always the :organizationId path parameter. Roles, memberships,
            active organization and plan are NEVER in the JWT.
Context:    PRD §4 RBAC scoped to an organization; §12.3 automatic expiry and periodic review; §20.1
            negative permission tests; possible multi-organization users (BQ-03).
Options:    Catalog: (a) code  (b) roles/permissions tables editable by admins
            Context: (a) URL path  (b) header  (c) JWT claim  (d) server session
Chosen:     Catalog (a); context (a)
Why:        The PRD does not require runtime-defined roles; code makes the matrix reviewable and
            testable. URL context is explicit and stateless, and revocation is immediate (no stale tokens).
Trade-offs: New roles need a deploy (acceptable); one membership lookup per request (indexed,
            request-scoped cache).
Date:       2026-09-14
```

## ADR-005 · UUID v7 primary keys

```text
Decision:   uuid primary keys, version 7, on all non-join tables.
Context:    §14.1 requires non-sequential, publicly usable identifiers.
Options:    (a) UUID v4  (b) UUID v7  (c) bigint identity + public UUID  (d) ULID text
Chosen:     (b)
Why:        Non-guessable enough for public ids, time-ordered for index locality and natural sort,
            native uuid type.
Trade-offs: Embeds creation time (minor information disclosure, acceptable); requires Prisma/Postgres
            support or app generation (TQ-22); fallback gen_random_uuid() (v4) as DB default for raw inserts.
Date:       2026-09-14
```

## ADR-006 · Soft delete strategy

```text
Decision:   No global soft delete. Prefer PRD business states (ARCHIVED) for operational entities;
            `deleted_at` only for user-deletable entities that need retention; anonymisation for personal
            data; append-only for facts. Rules in database-design-rules.md §5.
Context:    §14.1 "logical deletion for operational entities with a retention policy"; PDPL deletion rights.
Options:    (a) deleted_at on every table  (b) targeted strategy  (c) hard deletes + audit only
Chosen:     (b)
Why:        Avoids hidden-row bugs and unique-constraint complexity everywhere; matches the PRD's
            explicit archive states; respects deletion rights.
Trade-offs: Different tables use different mechanisms (documented per table).
Date:       2026-09-14
```

## ADR-007 · `app` schema, RLS backstop, application-level authorization

```text
Decision:   All tables in a dedicated `app` schema not exposed by Supabase's Data API. RLS enabled
            with no policies on every app table (deny-all for Supabase client roles). The NestJS app role
            has BYPASSRLS; authorization is enforced in NestJS. Storage bucket policies restrict client
            access; private files only through signed URLs.
Context:    NestJS is the only client of the database; authorization rules are contextual (org role,
            delegation, entitlements, record state, MFA) — see auth-architecture.md.
Options:    (a) app-level authz + RLS backstop  (b) RLS as primary authz with per-request claims
            (c) no RLS
Chosen:     (a)
Why:        Rules are testable in TypeScript; no per-transaction claim setting through the pooler;
            the RLS backstop still protects against Data API exposure or key leakage.
Trade-offs: A bug in app authorization isn't caught by the DB → mitigated by negative authz test suite,
            query-scoped repositories and code review.
Date:       2026-09-14
```

## ADR-008 · REST API conventions

```text
Decision:   REST over HTTPS, URI versioning `/api/v1`; resource-oriented routes with explicit action
            sub-resources for state transitions (`/submit`, `/approve`); `{data, meta}` success envelope;
            `{code, message, trace_id, errors}` error body; 422 for validation; cursor pagination for
            public/user lists; `Idempotency-Key` for payments, check-ins and point adjustments;
            OpenAPI generated from code.
Context:    Stack directive: REST. §15.1: documented contracts, clear versioning, stable pagination and
            limits, idempotency keys for payment/points/attendance, unified errors with code + message +
            trace id, no sensitive details. PRD allowed REST or GraphQL (I-7).
Options:    Versioning (URI / header); pagination (offset / cursor); errors (RFC 7807 / custom)
Chosen:     URI version; cursor (public) + offset (admin); custom error body compatible with the existing
            frontend parser (root `message` + `errors` map)
Why:        Simple for mobile clients; stable pagination under inserts; zero frontend change for errors.
Trade-offs: Cursor pagination can't jump to page N (frontend uses page numbers today, TQ-06).
Date:       2026-09-14
```

## ADR-009 · File storage

```text
Decision:   Supabase Storage with buckets `quarantine` (private), `public-media` (public read),
            `private-documents` (private), `reports` (private, Phase 4). Direct client upload via signed
            upload URLs to quarantine → worker validates type, hashes, scans → moves to target bucket.
            Private downloads via ≤ 5-minute signed URLs issued after authorization, audited.
Context:    §15.2 object storage (Phase 1); §18 separate sensitive documents, short-lived links, malware
            scanning, type/size limits; §8.6 image fingerprints.
Options:    (a) Supabase Storage  (b) S3/R2 directly  (c) upload through the API
Chosen:     (a)
Why:        Same provider and project per environment; S3-compatible if migration is ever needed;
            direct upload keeps large files off the API.
Trade-offs: Malware scanning is not built in (TQ-10); storage is not included in DB backups (separate
            backup needed); app-level encryption of identity documents still to decide (TQ-11).
Date:       2026-09-14
```

## ADR-010 · Background jobs with pg-boss

```text
Decision:   Use pg-boss (Postgres-backed queue) for async jobs and cron in the worker process.
Context:    §17/§19 call for queues for heavy tasks (reports, images, notifications, point calculation);
            don't add infrastructure without need (principle 8).
Options:    (a) pg-boss  (b) BullMQ + Redis  (c) @nestjs/schedule only  (d) cloud queue (SQS / Cloud Tasks)
Chosen:     (a), with @nestjs/schedule-style cron registered through pg-boss
Why:        No new infrastructure; transactional with the database; retries, backoff, scheduling built in;
            sufficient for projected volumes (thousands of companies, not millions of jobs/min).
Trade-offs: Adds DB load; needs session-mode or direct connections (not transaction pooler); if job
            volume grows, move to BullMQ/Redis or a cloud queue behind the same JobsPort.
Date:       2026-09-14
```

## ADR-011 · Domain events via transactional outbox

```text
Decision:   Modules publish domain events by inserting into `outbox_events` in the same transaction as
            the state change; a worker dispatches to in-process handlers with per-handler retries.
            Synchronous in-transaction ports are used where atomicity is required (verification subject
            handlers, merge participants, entitlements recalculation, audit).
Context:    Notifications, points, search and analytics must react to many modules without coupling;
            §20.2 requires points exactly once and no lost effects.
Options:    (a) in-process EventEmitter only  (b) outbox + worker  (c) message broker (Kafka/RabbitMQ)
Chosen:     (b)
Why:        (a) loses events on crash and runs side effects before commit; (c) is unjustified
            infrastructure. The outbox gives atomic publish + at-least-once delivery with plain Postgres.
Trade-offs: Eventual consistency for consumers (seconds); consumers must be idempotent; outbox table
            needs purging.
Date:       2026-09-14
```

## ADR-012 · Search strategy

```text
Decision:   PostgreSQL search over a `search_documents` projection containing only public fields:
            tsvector full-text + pg_trgm fuzzy matching + a custom Arabic normalisation function
            (alef/hamza/ta marbuta/diacritics) + array filters; ranking combines text relevance, filter
            relevance and visibility score.
Context:    §7.4 AR/EN search with spelling variants, many filters, SEO pages, no restricted fields in
            the index, zero-result logging; §17 results < 1 s for most queries; §19 dedicated search engine
            "when relational search capabilities are exceeded".
Options:    (a) Postgres FTS on projection  (b) Meilisearch/Typesense  (c) Elasticsearch/OpenSearch
Chosen:     (a)
Why:        Volumes (≈ 2,000 companies year 1, §1.2) are well within Postgres capability; no sync infra;
            the projection design already isolates public data so a later move to (b)/(c) reuses it.
Trade-offs: Arabic stemming quality is limited (normalisation + trigram compensates); revisit if
            relevance or latency targets are missed.
Date:       2026-09-14
```

## ADR-013 · Caching

```text
Decision:   No shared cache (Redis) initially. Per-request memoisation (memberships), short-lived
            in-process caches for taxonomy and JWKS, HTTP caching headers for public reads (CDN).
Context:    §19 lists a cache for sessions, limits and hot results as reference architecture; principle 8
            forbids unjustified infrastructure.
Options:    (a) none/in-process  (b) Redis now
Chosen:     (a)
Why:        Supabase Auth handles sessions; volumes are small; public reads can be CDN-cached.
Trade-offs: Rate limiting is per instance until a shared store is added (TQ-16); revisit when scaling
            horizontally or latency targets are missed.
Date:       2026-09-14
```

## ADR-014 · Points ledger

```text
Decision:   Points are recorded only as immutable `point_ledger` entries (CREDIT/DEBIT/REVERSAL) with
            rule version, source, idempotency key; balances are a projection (`point_balances`) updated in
            the same transaction and reconciled nightly. Computed company components write deltas.
            Visibility is calculated from ledger + data into `visibility_snapshots`.
Context:    §8.1 ledger not directly editable, corrections by reverse movement, rules and versions kept;
            §8.6 non-repeat keys; §20.2 once, explainable, reversible.
Options:    (a) mutable counter  (b) ledger only (sum on read)  (c) ledger + projection
Chosen:     (c)
Why:        Satisfies explainability and reversibility; fast reads; exactly-once through unique keys.
Trade-offs: More tables and write logic; projection drift possible → reconciliation job.
Date:       2026-09-14
```

## ADR-015 · Single organizations table

> **Superseded by ADR-024 (2026-09-15).** Kept for history.

```text
Decision:   Companies and institutions (government, contracting, research) share `organizations` with a
            `type` column; type-specific rules live in services; institution-only data lives in
            institutional tables.
Context:    PRD §14 `organizations: companies and entities`; both need members, roles, invitations,
            subscriptions, audit context.
Options:    (a) one table + type  (b) companies and institutions as separate tables
Chosen:     (a)
Why:        One membership/authorization mechanism; follows the PRD data model; supports a company that
            may also act as buyer if BQ-06 allows.
Trade-offs: Some columns irrelevant to institutions (nullable); directory queries must filter
            type = COMPANY.
Date:       2026-09-14
```

## ADR-016 · Audit logging

```text
Decision:   `audit_logs` rows are written synchronously inside the mutating transaction by
            AuditLogger; the table is append-only (privileges + trigger); sensitive values redacted.
Context:    §5.2, §12.3, §13, §18 — logging of approvals, permission changes, exports, sign-ins.
Options:    (a) same-transaction insert  (b) async via events  (c) DB triggers on all tables
Chosen:     (a)
Why:        No committed change without its audit row; explicit "action" semantics rather than raw row
            diffs; no trigger overhead on every table.
Trade-offs: Developers must call AuditLogger (enforced by review + tests for listed operations).
Date:       2026-09-14
```

## ADR-017 · Analytics storage

```text
Decision:   Capture PRD §16 analytics events in a first-party, monthly-partitioned `analytics_events`
            table from Phase 1, and forward them to a product analytics provider.
Context:    §15.2 product analytics (Phase 1); §11.2 Phase 4 company reports need impressions, views,
            contact clicks history; §16.1 privacy (consent linking, internal/bot exclusion, no fingerprinting).
Options:    (a) provider only  (b) first-party table only  (c) both
Chosen:     (c)
Why:        Provider serves product analytics; first-party data is required to build auditable,
            reproducible company metrics (§11.3) without depending on a third party's export.
Trade-offs: Storage growth (partition + retention); ingestion endpoint needs abuse protection.
Date:       2026-09-14
```

## ADR-018 · Organization status derivation

```text
Decision:   Store `organizations.status` with the exact PRD §29.1 values, but compute it in
            OrganizationStatusService from stored facts (approved_at, claimed_at, owner membership,
            approved verification signals per BQ-53, staleness, suspended_at, archived_at) instead of setting it freely.
Context:    The PRD status list mixes ownership, verification, freshness and moderation states; lifting a
            suspension must restore the correct state.
Options:    (a) free-set single enum  (b) decomposed flags only (no PRD enum)  (c) PRD enum derived from facts
Chosen:     (c)
Why:        Keeps PRD vocabulary for APIs and reporting while keeping the concepts separate
            (verification ≠ ownership ≠ moderation) and restorable.
Trade-offs: Status and facts can drift if written outside the service → only the service writes them;
            test for derivation table.
Date:       2026-09-14
```

## ADR-019 · API JSON field casing — OPEN

```text
Decision:   (pending)
Context:    The existing frontend parses snake_case (`full_name`, `access_token`, `avatar_url`,
            `is_verified`, `member_type`). NestJS/TypeScript defaults to camelCase.
Options:    (a) snake_case JSON — DTO properties declared in snake_case (no transformation layer)
            (b) camelCase JSON — frontend parsers change
            (c) camelCase internally + global key-transform interceptor (runtime cost, validation complexity)
Chosen:     —  (recommendation: decide with the frontend team before the first endpoint; (a) avoids frontend
            changes and a transformation layer)
Why:        —
Trade-offs: —
Date:       2026-09-14
```

## ADR-020 · Money representation

```text
Decision:   Integer minor units (halalas) + ISO currency code (default SAR); VAT rate numeric(5,4).
Context:    §7.5 plans, tax invoices, payments.
Options:    (a) integer minor units  (b) numeric(12,2)  (c) float
Chosen:     (a)
Why:        No rounding errors; matches payment gateway APIs.
Trade-offs: Formatting required at the edges.
Date:       2026-09-14
```

## ADR-021 · Bilingual fields

```text
Decision:   Paired `_ar` / `_en` columns for user- and staff-authored bilingual text; CHECK that at least
            one is present where required; API returns both.
Context:    §2.1 bilingual site; §17 Arabic and English without duplicating business logic; no other
            languages planned (GCC expansion is geographic, §6 Phase 5).
Options:    (a) paired columns  (b) JSONB translations map  (c) translations table
Chosen:     (a)
Why:        Simple queries, indexable for search, explicit constraints.
Trade-offs: Adding a third language needs migrations (not foreseen).
Date:       2026-09-14
```

## ADR-022 · API and worker processes

```text
Decision:   Two entrypoints from one codebase: `api` (HTTP) and `worker` (outbox dispatcher, jobs, cron).
            May run in one process in early Phase 1.
Context:    §17 stateless services and queues for heavy tasks.
Options:    (a) single process  (b) api + worker  (c) separate services per domain
Chosen:     (b) (configurable)
Why:        Heavy jobs don't affect request latency; independent scaling; same modules and tests.
Trade-offs: Two deploy targets.
Date:       2026-09-14
```

## ADR-023 · Hosting platform for NestJS — OPEN

```text
Decision:   (pending, TQ-09)
Context:    Needs: container hosting for api + worker, secrets manager, IPv4/IPv6 connectivity to Supabase
            (direct vs session pooler), CDN/WAF (§19), logs/metrics (§17), region close to Saudi users and to
            the Supabase region (BQ-31), staging + production environments.
Options:    e.g. Fly.io, Render, Railway, AWS (ECS/App Runner), GCP Cloud Run, Azure Container Apps,
            a Saudi cloud region provider
Chosen:     —
Why:        —
Trade-offs: —
Date:       2026-09-14
```

## ADR-024 · Every organization is a company

```text
Decision:   Remove organization types. `organizations` holds companies only; no `type` column, no
            OrganizationType enum, no institution roles (BUYER, READER, AUDITOR), no institution MFA rule.
Context:    Business decision BQ-06 (2026-09-15). Supersedes ADR-015. PRD §12 and §14 describe government
            and contracting entities as organizations.
Options:    (a) keep a type column for future use  (b) remove types entirely
Chosen:     (b), as decided by the business
Why:        Simpler schema, permissions and queries; no unused states to test.
Trade-offs: PRD buyer journeys (§5.4, §12), SUPPLIER_REQUEST publishers and the Phase 1 buyer pilot have no
            home until BQ-51 is answered. Re-introducing entities later needs a migration.
Date:       2026-09-15
```

## ADR-025 · Approval, ownership and verification are separate

```text
Decision:   Three independent mechanisms for companies:
            1. Ownership — exactly one owner per company (refined by ADR-030: the single Company Account); set by creation, an approved
               claim, or an audited transfer (T-30). A user may own several companies.
            2. Approval — the owner creates the company and SYSTEM_ADMIN approves the listing through
               `organization_approvals` (T-29). Approval publishes the company as CLAIMED and sets no
               verification and no trust points.
            3. Verification — independent signal cases (registration, domain, each credential, each contact),
               decided only by VERIFICATION_REVIEWER or SYSTEM_ADMIN in Phase 1 (no automated decisions).
Context:    Business decisions BQ-03, BQ-04, BQ-05, BQ-46, BQ-47, BQ-48, BQ-49 (2026-09-15).
Options:    (a) approval as a verification type  (b) a separate approvals table
Chosen:     (b)
Why:        The business defined approval and verification as different things; a separate table keeps the
            verification queue, SLA and trust points free of listing approvals.
Trade-offs: Two review queues for staff. Open details: VERIFIED rule (BQ-53), ownership transfer process
            (BQ-56), approval criteria and resubmission (BQ-57).
Date:       2026-09-15
```

## ADR-026 · Account types, company type, company projects

```text
Decision:   users.account_type ∈ {INDIVIDUAL, COMPANY}. organization_company_types (one or more) ∈ {EVENT_ORGANIZER, SUPPLIER,
            VENUE, PRODUCTION, AGENCY, SERVICE_PROVIDER, OTHER} for classification only. The PRD `projects` table is
            renamed `company_projects` (+ company_project_services, company_project_media).
Context:    Mandatory business rules §1–§4 (2026-09-17).
Options:    (a) account type per business role  (b) two account types + company classification
Chosen:     (b), as mandated
Why:        Business roles (supplier, organizer, venue…) describe companies, not logins. Permissions stay in memberships,
            so a company's type never silently changes what its members can do. The rename avoids confusing past work
            (company projects) with opportunities. BQ-62 later removed PROJECT from the opportunity types.
Trade-offs: Open details: account type meaning (BQ-60), single vs multiple company types (BQ-61).
Date:       2026-09-17
```

## ADR-027 · Unified opportunities, applications and supplier responses

```text
Decision:   One `opportunities` table and module for JOB, CO_OP, VOLUNTEERING and SUPPLIER_REQUEST (PROJECT removed by BQ-62), with a
            generated `audience` and a single type policy map. Individuals apply through `applications` (one status model:
            SUBMITTED, REVIEWED, SHORTLISTED, CONTACT, ACCEPTED, REJECTED, WITHDRAWN; flexible transitions chosen by the company, BQ-67).
            Supplier requests are visible to Company Accounts only (BQ-65); any company may respond (BQ-66). Companies respond to
            supplier requests through `supplier_responses`. Messaging, interviews, offers, matching and surveys deferred.
Context:    Mandatory business rules §5–§9 (2026-09-17). Replaces the PRD §10.2 type list.
Options:    (a) a table and screens per type  (b) unified model  (c) unified model with company applicants in applications
Chosen:     (b)
Why:        Reusable models, endpoints and UI components; B2B responses kept apart from individual hiring; no competing
            status systems.
Trade-offs: Type-specific fields live in a validated JSON / policy map until they stabilise. Open: BQ-73 (JOB details),
            withdrawal rule (BQ-67).
Date:       2026-09-17
```

## ADR-028 · Monetization deferred; paid visibility separate from trust

```text
Decision:   Do not build billing, subscriptions, invoices, payment gateways, wallets, commissions or entitlements now. Keep
            their designs as a compatibility reference. Future Promotion / FeaturedListing / SponsoredContent will be a
            separate module. Featured / Sponsored / Promoted never write verification, trust points or organic ranking,
            and API responses expose them as separate fields from verification.
Context:    Mandatory business rules §10–§12 (2026-09-17). Supersedes the Phase 2 billing build plan (PRD §6, §7.5).
Options:    (a) build billing in Phase 2 as planned  (b) defer and keep extension points
Chosen:     (b)
Why:        Keeps the MVP simple; module boundaries (billing/entitlements/promotions never import verification or
            engagement writers) already keep commercial and trust concerns apart.
Trade-offs: PRD Phase 2 commercial gate (100 paid members) must be restated; plan-based limits are not enforced.
Date:       2026-09-17
```

## ADR-029 · Separate account security contexts

```text
Decision:   users.account_type (INDIVIDUAL | COMPANY) is chosen at registration through two separate flows and fixes
            the security context of that login. Every non-public route declares its context and AccountContextGuard
            rejects the other type. Company permissions come only from the company's Company Account
            (refined by ADR-030: one Company Account per company, no roles). Individual accounts never hold company permissions;
            ownership, employment or any other individual–company link grants nothing. Company types (one or more per
            company) never grant permissions.
Context:    Business decision BQ-60 and BQ-61 (2026-09-17). Changes ADR-004's assumption that one person account reaches
            company context through memberships.
Options:    (a) one person account + company memberships (previous design)  (b) separate account contexts
Chosen:     (b), as decided
Why:        Clear separation of individual and company data, flows and permissions; no privilege inheritance through
            ownership.
Trade-offs: A person working for a company needs a COMPANY-type login in addition to any individual account. Open
            details: team logins, several companies per login, same identifier for both types, type change, staff
            accounts (BQ-68); individual ownership record (BQ-69).
Date:       2026-09-17
```

## ADR-030 · One Company Account per company

```text
Decision:   Each company has exactly one user: its Company Account (organizations.account_user_id, unique, COMPANY accounts
            only). That account holds every company permission for its own company; there are no company roles and no
            delegation (organization roles and member_permission_grants removed). People who work for a company use
            INDIVIDUAL accounts and are company members (organization_members), which grants no permissions and only
            drives the public team section (show_on_company_profile). Ownership is set by company registration or an
            approved claim and changed only by the admin ownership flow.
Context:    Business decisions BQ-68, BQ-69, BQ-74 (2026-09-17). Refines ADR-029; supersedes PRD §4 company roles and
            AUTH-05 role-scoped team invitations (inconsistency I-10).
Options:    (a) Company RBAC with team logins  (b) one Company Account + Individual members
Chosen:     (b), as decided
Why:        Simple authorization (one check: account_user_id = caller); clean separation between the company's identity
            and the people affiliated with it.
Trade-offs: A shared company login must be protected well (MFA recommended, per-action audit cannot distinguish people);
            no per-employee permissions. Open: membership flow (BQ-75), same identifier for both account types, type
            change and staff account type (BQ-68 remaining), ownership flow details (BQ-56).
Date:       2026-09-17
```

---

## Decisions intentionally deferred

| Topic | When to decide | Reference |
|---|---|---|
| Payment gateway & e-invoicing provider | Only when monetization is requested (ADR-028) | TQ-18 |
| Malware scanning service | Before Phase 1 launch | TQ-10 |
| App-level document encryption | Before identity verification launch | TQ-11 |
| PDF/XLSX generation | Phase 4 | TQ-20 |
| Dedicated search engine | When ADR-012 targets are missed | ADR-012 |
| Redis / shared cache | When scaling out | ADR-013, TQ-16 |
| Analytics warehouse | When Phase 4 volume requires | TQ-19 |
| Partner API authentication | Phase 5 | RG-19 |
