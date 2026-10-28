# Backend Implementation Status

> Progress tracker. Update in the **same pull request** as the work.
>
> Status values: `NOT STARTED` · `IN PROGRESS` · `BLOCKED (<question id>)` · `DONE`
> Columns: **Database** (Prisma models + migrations + constraints) · **Module** (Nest module wiring, public `index.ts`) · **Service** (use cases, policies, transactions) · **Controller** (endpoints + DTOs + guards) · **Tests** (unit + integration + authz negative) · **Documentation** (OpenAPI + docs updated)
>
> Last updated: 2026-10-11 · Build order is now [execution-plan.md](execution-plan.md) v2.2 (phases 0–9). Operation-level progress per surface is generated in [gap-report.md](gap-report.md). The module trees below were written before Stages 1–3 were built and are refreshed as each phase lands.

## Execution plan progress

| Phase | Scope | State |
|---|---|---|
| Stages 1–3 | Project, database and platform foundation (audit, outbox, jobs, storage port) | DONE |
| 0 · Structure | Two surfaces (`src/surfaces/app`, `src/surfaces/admin`), `GET /ping` on both, `GET /api/app/v1/meta/app-version`, two Swagger pages, boot-time route check, surface boundary rules, `contracts/` with `x-phase`, contract check, coverage, gap report, oasdiff job, admin client types, error-code catalog | DONE (2026-10-11) |
| 1A · Shared foundations (hosting-independent) | Actor, surface auth + permission guards, permission matrix, i18n, page types, idempotency, `@AuditRead` + admin-write audit check, settings (`GET/PUT /api/admin/v1/settings`), CodeQL, Dependabot, squawk, drift test, ASVS checklist, DB session in UTC | IN PROGRESS (branch `phase-1a-foundations`) |
| 1B · Shared foundations (rest) | Taxonomy (table design decision), uploads + virus scan (TQ-10), observability, environments, backups, image scan, load tests, PDPL retention + breach runbook | BLOCKED (BQ-31, taxonomy design, TQ-10) |
| 2 – 9 | See execution-plan.md | NOT STARTED |

---

## Summary

| Phase | Modules | Done | In progress | Not started |
|---|---|---|---|---|
| Foundation | 4 | 0 | 0 | 4 |
| Phase 1 | 16 | 0 | 0 | 16 |
| Phase 2 | 4 (billing, entitlements ⏸ deferred) | 0 | 0 | 4 |
| Phase 3 | 2 | 0 | 0 | 2 |
| Phase 4 | 2 (institutional on hold, BQ-51) | 0 | 0 | 2 |

---

## Foundation

```text
Project foundation (Stage 1)
├── Scaffold & config        NOT STARTED
├── Error format & envelope  NOT STARTED
├── Logging & tracing        NOT STARTED
├── OpenAPI                  NOT STARTED
├── CI pipeline              NOT STARTED
└── Documentation            NOT STARTED

Database foundation (Stage 2)
├── Prisma setup             NOT STARTED
├── app schema & roles       NOT STARTED
├── Extensions & functions   NOT STARTED
├── TransactionRunner        NOT STARTED
├── Test DB harness          NOT STARTED
└── Documentation            NOT STARTED

Platform: audit (Stage 3)
├── Database                 NOT STARTED
├── Module                   NOT STARTED
├── Service                  NOT STARTED
├── Controller               NOT STARTED
├── Tests                    NOT STARTED
└── Documentation            NOT STARTED

Platform: outbox & jobs (Stage 3)
├── Database                 NOT STARTED
├── Module                   NOT STARTED
├── Dispatcher / worker      NOT STARTED
├── Tests                    NOT STARTED
└── Documentation            NOT STARTED
```

---

## Phase 1: Core & company directory

```text
Identity
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Access (staff roles, Company Account guard, Individual memberships, invitations)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Profiles (incl. onboarding)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Taxonomy
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Media & documents
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Organizations (incl. approvals, claims, verification signals, ownership transfer, merges, corrections)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Company projects / portfolio
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Verification
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Search & public directory
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Content
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Moderation (abuse reports, appeals)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Notifications
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Audit (module-level features beyond the platform logger)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Analytics
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Imports
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Admin dashboard
├── Database       NOT STARTED   (no tables)
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED
```

### Phase 1 critical journeys (§20.2)

| Journey | Status |
|---|---|
| Registration & verification cannot be bypassed; no easy duplicate accounts | NOT STARTED |
| Company claim: no ownership transfer without evidence and correct review | NOT STARTED |
| Edit & publish company: correct version shown, no restricted-field leakage | NOT STARTED |

---

## Phase 2: Membership, points, events

```text
Entitlements (⏸ DEFERRED — future monetization, rules §11)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Billing (⏸ DEFERRED — future monetization, rules §11)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Engagement (points, levels, badges, visibility)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Events
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED
```

| Critical journey (§20.2) | Status |
|---|---|
| Payment & renewal: no double subscription, correct invoice | ⏸ DEFERRED (rules §11) |
| Points: once only, explainable, reversible | NOT STARTED |
| Attendance: no points for booking without attendance | NOT STARTED |

---

## Phase 3: Professionals & opportunities

```text
Talent
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Opportunities (unified model, applications, supplier responses)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED
```

---

## Phase 4: Intelligence & institutional

```text
Intelligence
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED

Institutional (ON HOLD — BQ-51)
├── Database       NOT STARTED
├── Module         NOT STARTED
├── Service        NOT STARTED
├── Controller     NOT STARTED
├── Tests          NOT STARTED
└── Documentation  NOT STARTED
```

| Critical journey (§20.2) | Status |
|---|---|
| Comparison: no confidential data or small samples | NOT STARTED |
| Institution export: permission, purpose, watermark and log correct | NOT STARTED |

---

## Phase 5: Observatory & partner API

```text
Observatory      NOT STARTED (not designed — RG-19)
Partner API      NOT STARTED (not designed — RG-19)
```

---

## Blocking questions tracker

| Question | Blocks | Status |
|---|---|---|
| BQ-01 clients | Stage 1 | ✅ RESOLVED — web + Flutter mobile, one API |
| BQ-30 authentication method | Stage 4 | ✅ RESOLVED — OTP + password |
| BQ-03 / BQ-04 / BQ-05 / BQ-49 memberships and owners | Stage 8 | ✅ RESOLVED — many memberships, one owner per company, owner creates, admin approves, several companies per owner |
| BQ-06 organization types | Stage 8 | ✅ RESOLVED — every organization is a company |
| BQ-46 / BQ-47 / BQ-48 approval and verification | Stage 10 | ✅ RESOLVED — separate; independent signals; human reviewers only |
| BQ-07 / BQ-08 verified professional, rewards | Phase 2 | ✅ RESOLVED — verification independent of levels; points are not a currency |
| TQ-01 / TQ-02 auth integration (client-direct vs facade) | Stage 4 | OPEN |
| TQ-05 / TQ-06 / TQ-07 API contract | Stage 1 | OPEN |
| BQ-53 company VERIFIED rule | Stage 10, 12 | OPEN (working assumption: registration signal) |
| BQ-56 ownership transfer | Stage 10 | OPEN (admin-only transfer until decided) |
| BQ-57 approval criteria, resubmission, imports | Stage 10, 14 | OPEN |
| BQ-58 sign-in options | Stage 4 | OPEN (password sign-in only until decided) |
| BQ-51 buyer entities | Phase 1 pilot scope, Phase 4 | PARTLY RESOLVED — supplier requests are B2B between companies (rules §7) |
| BQ-59 / BQ-60 / BQ-61 rewards, account contexts, company types | Stages 4, 6–8, Phase 2 | ✅ RESOLVED 2026-09-17 |
| BQ-68 company account model | Stages 4, 6, 8 | MOSTLY RESOLVED — one Company Account per company; remaining identifier / type-change / staff questions |
| BQ-75 membership flow | Stage 8 | OPEN |
| BQ-69 / BQ-72 / BQ-73 / BQ-74 | Phases 1, 3 | ✅ RESOLVED 2026-09-17 |
| BQ-70 Companies to Watch weights and slots | Phase 1 | MOSTLY RESOLVED |
| BQ-71 Profile Highlight | Phase 2 | OPEN |
| RG-28 industries list | Stage 5 | DRAFT READY — needs business review |
| BQ-63 / BQ-64 industries, public team | Stage 8 | OPEN |
| BQ-62 … BQ-66 project, industries, team visibility, supplier requests and responses | Phases 1, 3 | ✅ RESOLVED 2026-09-17 |
| BQ-67 withdrawal rule and decision changes (transitions resolved) | Phase 3 | PARTLY RESOLVED |
| BQ-21 Phase 1 value lists | Stage 8, 11 | OPEN |
| RG-09 import format | Stage 14 | OPEN |
| RG-14 notification catalog (incl. push) | Stage 13 | OPEN |
| TQ-09 hosting platform | Stage 1 | OPEN |
| BQ-31 data residency / region | Production | OPEN |
