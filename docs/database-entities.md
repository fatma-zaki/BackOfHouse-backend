# Database Entity Catalog

> The authoritative description of every table. The ERD (`database-erd.md`) shows *shape*; this file defines *meaning*.
> Conventions (UUIDs, timestamps, naming, soft delete) are in `database-design-rules.md`. Enum values are in `enums-and-statuses.md`.
>
> **Traceability tags:** `PRD §14` = the table name appears in the PRD's proposed data model. Other tables cite the requirement that makes them necessary.
> **Phase** = the phase whose migration creates the table.
> **Mandatory business rules** (`business-rules.md`, 2026-09-17) override PRD field lists where they differ. ⏸ = designed but **deferred** (not built unless explicitly requested).

## Standard columns (not repeated below)

| Column | Type | Applies to |
|---|---|---|
| `id` | `uuid` PK | Every table except pure join tables (composite PK) |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Every table |
| `updated_at` | `timestamptz NOT NULL` (set by Prisma `@updatedAt`) | Every **mutable** table (not append-only tables) |
| `created_by` / `updated_by` | `uuid NULL → users.id` | Tables marked **[sensitive]** (§14.1 "creator, modifier and modification date for every sensitive entity") |

Nullable = `NULL` allowed. Required = `NOT NULL`.

---

## Summary

| Phase | Tables | Modules |
|---|---|---|
| **1 — Core & company directory** | 46 | identity, access, profiles, taxonomy, media, organizations, projects, verification, search, content, moderation, notifications, audit, analytics, imports, platform |
| **2 — Points, events (+ ⏸ monetization)** | 27 | engagement, events; billing and entitlements (9 tables) ⏸ deferred — business rules §11 |
| **3 — Professionals & opportunities** | 12 | talent, opportunities (2 tables ⏸ deferred) |
| **4 — Intelligence & buyer features** | 11 | intelligence, institutional (on hold, BQ-51), audit |
| **5 — Observatory & partner API** | 0 (not specified, RG-19) | — |
| **Total** | **96** | 92 business tables + 4 technical (`search_documents`, `outbox_events`, `idempotency_records`, `payment_provider_events`) |

Not stored in the app schema: password hashes, sessions, OTP challenges and MFA factors live in **Supabase Auth** (`auth` schema). See ADR-003 and BQ-30.

### Index of tables

| # | Table | Phase | Module | PRD §14 |
|---|---|---|---|---|
| 1 | users | 1 | identity | ✅ |
| 2 | consents | 1 | identity | ✅ |
| 3 | user_platform_roles | 1 | access | — (§3, §4) |
| 4 | organization_members | 1 | access | ✅ |
| 5 | invitations | 1 | access | — (AUTH-05) |
| 6 | profiles | 1 | profiles | ✅ |
| 7 | profile_skills | 1 | profiles | — (§5.1) |
| 8 | profile_locations | 1 | profiles | — (§5.1) |
| 9 | categories | 1 | taxonomy | ✅ |
| 10 | services | 1 | taxonomy | ✅ |
| 11 | locations | 1 | taxonomy | ✅ |
| 12 | skills | 1 | taxonomy | — (§5.1, §10.1) |
| 13 | industries | 1 | taxonomy | — (rules §3, BQ-63) |
| 14 | media_assets | 1 | media | — (ORG-02, §8.6) |
| 15 | documents | 1 | media | ✅ |
| 16 | organizations | 1 | organizations | ✅ |
| 17 | organization_contacts | 1 | organizations | — (ORG-04, §22.1) |
| 18 | organization_services | 1 | organizations | ✅ |
| 19 | organization_coverage | 1 | organizations | ✅ |
| 20 | organization_credentials | 1 | organizations | — (ORG-05) |
| 21 | organization_media | 1 | organizations | — (ORG-02) |
| 22 | organization_claims | 1 | organizations | — (§5.2) |
| 23 | organization_approvals | 1 | organizations | — (decisions BQ-05, BQ-46) |
| 24 | organization_company_types | 1 | organizations | — (rules §2, BQ-61) |
| 25 | organization_industries | 1 | organizations | — (rules §3, BQ-63) |
| 26 | organization_merges | 1 | organizations | — (ORG-09) |
| 27 | correction_suggestions | 1 | organizations | — (§4) |
| 28 | company_projects | 1 | projects | ✅ (PRD `projects`, renamed by rules §4) |
| 29 | company_project_services | 1 | projects | — (§7.3) |
| 30 | company_project_media | 1 | projects | ✅ (PRD `project_media`) |
| 31 | verifications | 1 | verification | ✅ |
| 32 | verification_documents | 1 | verification | — (§5.1, §5.2) |
| 33 | verification_decisions | 1 | verification | — (§5.2, §8.6 decision record) |
| 34 | search_documents | 1 | search | — (§7.4 technical) |
| 35 | companies_to_watch_selections | 1 | search | — (BQ-70) |
| 36 | content_items | 1 | content | ✅ |
| 37 | abuse_reports | 1 | moderation | — (§13, §23) |
| 38 | appeals | 1 | moderation | — (§8.6, §13) |
| 39 | notifications | 1 | notifications | ✅ |
| 40 | notification_deliveries | 1 | notifications | — (§15.2) |
| 41 | notification_preferences | 1 | notifications | — (§5.1 preferences) |
| 42 | audit_logs | 1 | audit | ✅ |
| 43 | analytics_events | 1 | analytics | — (§16) |
| 44 | import_batches | 1 | imports | — (§22.1) |
| 45 | import_rows | 1 | imports | — (§22.1) |
| 46 | outbox_events | 1 | platform | — (technical, ADR-011) |
| 47 | membership_plans ⏸ | 2 | billing | ✅ |
| 48 | plan_features ⏸ | 2 | billing | — (§7.5) |
| 49 | subscriptions ⏸ | 2 | billing | ✅ |
| 50 | invoices ⏸ | 2 | billing | ✅ |
| 51 | payments ⏸ | 2 | billing | ✅ |
| 52 | coupons ⏸ | 2 | billing | — (§7.5) |
| 53 | coupon_redemptions ⏸ | 2 | billing | — (§7.5) |
| 54 | entitlements ⏸ | 2 | entitlements | ✅ |
| 55 | payment_provider_events ⏸ | 2 | billing | — (§15.1 idempotency) |
| 56 | idempotency_records | 2 | platform | — (§15.1) |
| 57 | point_rules | 2 | engagement | ✅ |
| 58 | point_rule_versions | 2 | engagement | ✅ ("rules and their versions") |
| 59 | point_ledger | 2 | engagement | ✅ |
| 60 | point_balances | 2 | engagement | — (§8.1 separate balances) |
| 61 | member_levels | 2 | engagement | — (§9.1) |
| rewards | 2 | engagement | — (rules §10, BQ-59) |
| 62 | level_assignments | 2 | engagement | — (§9.1, §8.6) |
| 63 | badges | 2 | engagement | ✅ |
| 64 | badge_awards | 2 | engagement | ✅ |
| 65 | visibility_snapshots | 2 | engagement | ✅ |
| 66 | engagement_alerts | 2 | engagement | — (§8.6) |
| 67 | events | 2 | events | ✅ |
| 68 | event_ticket_types | 2 | events | — (§9.2) |
| 69 | event_speakers | 2 | events | — (§9.2) |
| 70 | event_sponsors | 2 | events | — (§9.2) |
| 71 | event_registrations | 2 | events | ✅ |
| 72 | event_feedback | 2 | events | — (§9.2) |
| 73 | experiences | 3 | talent | — (§10.1) |
| 74 | educations | 3 | talent | — (§10.1) |
| 75 | user_certifications | 3 | talent | — (§10.1) |
| 76 | profile_projects | 3 | talent | — (§10.1) |
| 77 | profile_media | 3 | talent | — (§10.1) |
| 78 | opportunities | 3 | opportunities | ✅ |
| 79 | opportunity_skills | 3 | opportunities | — (§10) |
| 80 | opportunity_services | 3 | opportunities | — (§10.2 supplier requests) |
| 81 | applications | 3 | opportunities | ✅ |
| 82 | application_messages ⏸ | 3 | opportunities | — (§6 "controlled messaging"; deferred, rules §9) |
| supplier_responses | 3 | opportunities | — (rules §7) |
| 83 | opportunity_feedback ⏸ | 3 | opportunities | — (§10.3; deferred, rules §9) |
| 84 | metric_definitions | 4 | intelligence | ✅ |
| 85 | metric_facts | 4 | intelligence | ✅ |
| 86 | benchmark_sets | 4 | intelligence | ✅ |
| 87 | benchmark_set_members | 4 | intelligence | — (§11.1) |
| 88 | reports | 4 | intelligence | ✅ |
| 89 | data_exports | 4 | audit | — (§12.3, §18) |
| 90 | saved_lists | 4 | institutional | ✅ |
| 91 | saved_list_items | 4 | institutional | ✅ |
| 92 | saved_searches | 4 | institutional | — (§12.1) |
| 93 | rfis | 4 | institutional | ✅ |
| 94 | rfi_recipients | 4 | institutional | — (§12.1) |

All **38 table names** in the PRD §14 model are kept, except `projects` / `project_media`, renamed `company_projects` / `company_project_media` (rules §4). The PRD rows `categories / services` and `invoices / payments` each name two tables. `point_rule_versions` separates out the "rules **and their versions**" that the PRD's `point_rules` row describes.

---

# PHASE 1

## 1. Identity (module: `identity`)

### users · PRD §14 · [sensitive]

**Purpose.** The platform account of one person: sign-in identifiers, account state, preferences. It is **not** the public profile (`profiles`) and **not** a set of permissions (`access`).

| Field | Type | Required | Description |
|---|---|---|---|
| id | uuid | ✅ | **Equals the Supabase `auth.users.id`** (ADR-003). No DB-level FK across schemas. |
| email | citext | — | Verified email. Unique when present. |
| phone | text | — | E.164 phone (e.g. `+9665…`). Unique when present. |
| email_verified_at | timestamptz | — | Copied from the auth provider claims. |
| phone_verified_at | timestamptz | — | Copied from the auth provider claims. |
| account_type | AccountType | — | `INDIVIDUAL` or `COMPANY` (rules §1), chosen **at registration** (BQ-60). Defines the account's **security context**: individual routes need INDIVIDUAL, company routes need COMPANY. Grants no permission by itself. Null only until registration completes; changes → BQ-68. |
| status | UserStatus | ✅ | Default `ACTIVE`. |
| preferred_locale | text | ✅ | `ar` \| `en`. Default `ar`. |
| timezone | text | ✅ | IANA zone. Default `Asia/Riyadh` (§14.1: store UTC, display in the user's zone). |
| onboarding_completed_at | timestamptz | — | Set when terms are accepted and an account type is chosen. |
| last_seen_at | timestamptz | — | Throttled update (at most once per 15 min). |
| suspended_at / suspension_reason | timestamptz / text | — | Admin suspension (§13). |
| deactivated_at | timestamptz | — | Anonymisation time (AUTH-06, later). |

**Relationships.** Has one `profiles`. Has many `consents`, `organization_members`, `user_platform_roles`, `notifications`, `verifications` (as subject and as requester). Referenced as the actor by `audit_logs`.

**Constraints.** `CHECK (email IS NOT NULL OR phone IS NOT NULL)`. Partial unique on `email` and on `phone` where not null. `CHECK (status <> 'SUSPENDED' OR suspended_at IS NOT NULL)`.

**Indexes.** Unique `email` and `phone` (login lookup, duplicate prevention per §20.2). `status` (admin filters).

**Lifecycle.** Created **idempotently** on the first authenticated API call after the auth provider has verified an identifier (AUTH-01). Updated by the user (locale, timezone, account type). Suspended and reinstated by admin. Never hard-deleted: deletion anonymises PII and sets `DEACTIVATED` (AUTH-06, RG-17).

---

### consents · PRD §14

**Purpose.** An append-only record of consents given or withdrawn per processing purpose and policy version (§5.1, §18 PDPL). The current state is the latest row per `(user_id, purpose)`.

| Field | Type | Required | Description |
|---|---|---|---|
| user_id | uuid → users | ✅ | |
| purpose | ConsentPurpose | ✅ | List incomplete (RG-25). |
| document_version | text | ✅ | e.g. `privacy-2026-08`. |
| granted | boolean | ✅ | `true` = consent given, `false` = withdrawn. |
| source | text | ✅ | `WEB` \| `IOS` \| `ANDROID` \| `ADMIN`. |
| recorded_at | timestamptz | ✅ | |

**Relationships.** Belongs to `users`.
**Constraints.** Append-only (no `updated_at`; UPDATE and DELETE revoked from the app role).
**Indexes.** `(user_id, purpose, recorded_at DESC)` for current-state lookup.
**Lifecycle.** Inserted at onboarding and on every preference change. Never updated. Kept for the retention period (BQ-33).

---

## 2. Access (module: `access`)

### user_platform_roles · [sensitive]

**Purpose.** Grants Back Of House **staff** roles (§3: reviewer, moderator, admin, auditor). Staff roles are never stored on `users`, so every grant has its own history.

| Field | Type | Required | Description |
|---|---|---|---|
| user_id | uuid → users | ✅ | |
| role | PlatformRole | ✅ | |
| granted_by | uuid → users | ✅ | Must be a `SYSTEM_ADMIN`. The first admin is created by a seed script. |
| granted_at | timestamptz | ✅ | |
| revoked_at / revoked_by | timestamptz / uuid | — | |
| reason | text | ✅ | |

**Constraints.** Partial unique `(user_id, role) WHERE revoked_at IS NULL`.
**Indexes.** That unique index also serves "roles of user X" lookups on every staff request.
**Lifecycle.** Granted and revoked by `SYSTEM_ADMIN`, always audited. Rows are never deleted. Periodic review (§18) is supported through a report of active grants.

---

### organization_members · PRD §14 · [sensitive]

**Purpose.** An **Individual account's membership** in a company — the company's team (BQ-68, BQ-74). Members are employees or affiliates. Membership grants **no company permissions**: only the company's single Company Account (`organizations.account_user_id`) acts for the company (BQ-60).

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | |
| user_id | uuid → users | ✅ | Must be an **INDIVIDUAL** account (service check + trigger). |
| status | MembershipStatus | ✅ | ACTIVE, REMOVED. |
| invitation_id | uuid → invitations | — | Set when the membership came from an invitation (flow → BQ-75). |
| joined_at | timestamptz | ✅ | |
| removed_at / removed_by | timestamptz / uuid | — | Removed by the Company Account or left by the member. |
| show_on_company_profile | boolean | ✅ | Default `true` (BQ-64). Set by the Company Account. Affects the **public** team section only. Member self-hiding → BQ-75. |

**Relationships.** Belongs to `users` (INDIVIDUAL) and `organizations`. Public team data is read from the member's `profiles` row (name, headline, avatar) — BQ-74.
**Constraints.** Unique `(organization_id, user_id)`; re-joining reactivates the row. An individual may be a member of several companies (BQ-03).
**Indexes.** `(organization_id, status, show_on_company_profile)` for the public team; `(user_id, status)` for "my memberships".
**Lifecycle.** Created by the membership flow (BQ-75); removed by the Company Account or by the member leaving; audited. Never used for authorization.

---

### invitations · [sensitive]

**Purpose.** Candidate flow for adding **Individual** members: the Company Account invites a person by email or phone (BQ-75 decides whether this or a join request is used). PRD AUTH-05 role-scoped invitations no longer apply (BQ-68).

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | |
| email | citext | — | |
| phone | text | — | |
| token_hash | text | ✅ | SHA-256 of a random token. |
| status | InvitationStatus | ✅ | |
| expires_at | timestamptz | ✅ | |
| invited_by | uuid → users | ✅ | The Company Account. |
| accepted_by / accepted_at | uuid / timestamptz | — | An INDIVIDUAL account. |
| revoked_at | timestamptz | — | |

**Constraints.** `CHECK (email IS NOT NULL OR phone IS NOT NULL)`. Unique `token_hash`. Partial unique `(organization_id, email) WHERE status='PENDING'`.
**Lifecycle.** PENDING → ACCEPTED (T-05, by an INDIVIDUAL account whose verified email or phone matches) / REVOKED / EXPIRED.

---

## 3. Profiles (module: `profiles`)

### profiles · PRD §14

**Purpose.** The **Individual account's** public-facing profile (§5.1). Only INDIVIDUAL accounts have one; company data lives on `organizations` (BQ-60). Phase 1 holds the basics; Phase 3 extends it into the professional profile (§10.1). Visibility is controlled by the user.

| Field | Type | Required | Description |
|---|---|---|---|
| user_id | uuid → users | ✅ | Unique. Profiles and users are one-to-one. |
| slug | citext | — | Public URL key. Required when the profile is searchable. |
| full_name | text | ✅ | |
| headline | text | — | Current title (§10.1). The frontend already uses `headline`. |
| summary | text | — | |
| avatar_media_id | uuid → media_assets | — | |
| languages | text[] | ✅ | ISO 639-1 codes. Default `{}`. |
| is_searchable | boolean | ✅ | Default `false`. §5.1 "activate profile in search according to privacy settings". |
| section_visibility | jsonb | ✅ | Per-section privacy (§10.1), schema-validated. Default `{}`. |
| availability | text | — | Phase 3 (§10.1). |
| open_to_opportunities | boolean | ✅ | Phase 3. Default `false`. |
| open_to_opportunities_public | boolean | ✅ | Default `false`. Hidden unless the user opts in (§10.1). |
| completion_score | smallint | ✅ | 0–100, computed. |
| verified_professional_at | timestamptz | — | Set while identity **and** at least one experience verification are approved (§3). Independent of points and levels (BQ-07). |

**Relationships.** Belongs to `users`. Has many `profile_skills`, `profile_locations` and (Phase 3) `profile_media`.
**Constraints.** Unique `user_id`. Partial unique `slug` where not null. `CHECK (completion_score BETWEEN 0 AND 100)`.
**Indexes.** Unique indexes only. Search reads `search_documents`, not this table.
**Lifecycle.** Created at onboarding. Updated by the user. Its search projection is rebuilt on every change. Anonymised on deactivation. Contact data is **never** stored here; it stays on `users` and is private (§10.1).

### profile_skills · profile_locations

**Purpose.** A profile's skills and cities (§5.1 "skills, cities, languages").

| Table | Columns | PK | Notes |
|---|---|---|---|
| profile_skills | profile_id → profiles, skill_id → skills, created_at | (profile_id, skill_id) | Index `skill_id` for filtering. |
| profile_locations | profile_id → profiles, location_id → locations, created_at | (profile_id, location_id) | Index `location_id`. |

**Lifecycle.** Replaced as a set (PUT) by the profile owner. Hard delete (join rows, no history needed).

---

## 4. Taxonomy (module: `taxonomy`)

### categories · PRD §14

**Purpose.** A tree of sector categories and subcategories (ORG-03), with SEO pages per category (§7.4).

| Field | Type | Required | Description |
|---|---|---|---|
| parent_id | uuid → categories | — | Null for top-level categories. |
| slug | citext | ✅ | Globally unique (SEO URL). |
| name_ar / name_en | text | ✅ | |
| description_ar / description_en | text | — | SEO copy. |
| sort_order | int | ✅ | |
| is_active | boolean | ✅ | Deactivate instead of deleting (existing links stay valid). |

**Constraints.** Unique `slug`. `CHECK (parent_id <> id)`. Cycle prevention is done in the service.
**Indexes.** `parent_id` (tree loads).
**Lifecycle.** Managed by staff (§13 content → categories). Seeded before development (§26 P0 "data dictionary and taxonomies"). Never hard-deleted once referenced.

### services · PRD §14

**Purpose.** Concrete services offered by companies. Each service belongs to a category.

| Field | Type | Required | Description |
|---|---|---|---|
| category_id | uuid → categories | ✅ | |
| slug | citext | ✅ | Unique. |
| name_ar / name_en | text | ✅ | |
| sort_order / is_active | int / boolean | ✅ | |

**Indexes.** `category_id`. **Lifecycle.** Same as categories.

### locations · PRD §14

**Purpose.** Regions and cities (§14 "المناطق والمدن"), used for company coverage, projects, profiles, events and SEO city pages.

| Field | Type | Required | Description |
|---|---|---|---|
| parent_id | uuid → locations | — | A city's parent is its region. |
| type | LocationType | ✅ | `REGION` \| `CITY`. |
| country_code | char(2) | ✅ | Default `SA`. Keeps GCC expansion possible (Phase 5, §6). |
| slug | citext | ✅ | Unique. |
| name_ar / name_en | text | ✅ | |
| latitude / longitude | numeric(9,6) | — | For maps (§15.2). |
| is_active | boolean | ✅ | |

**Indexes.** `(type, country_code)`, `parent_id`. **Lifecycle.** Seeded. Admin-managed.

### industries

**Purpose.** Controlled list of **industries** a company can belong to (business rules §3, BQ-63). Multi-select, used for classification, filtering and discovery. **No permissions, no RBAC effect**, and independent of company type.

| Field | Type | Required | Description |
|---|---|---|---|
| slug | citext | ✅ | Unique. |
| name_ar / name_en | text | ✅ | |
| sort_order / is_active | int / boolean | ✅ | Deactivate instead of deleting. |

**Lifecycle.** Admin-managed (like categories). Draft seed list → `business-rules.md` §20 (RG-28, needs business review).

### skills

**Purpose.** Controlled skill vocabulary for profiles (§5.1), professional matching (§10.1) and opportunities (Phase 3).

| Field | Type | Required | Description |
|---|---|---|---|
| slug | citext | ✅ | Unique. |
| name_ar / name_en | text | ✅ | |
| is_active | boolean | ✅ | |

**Lifecycle.** Admin-managed. Whether users can propose new skills is open (not in the PRD).

---

## 5. Media (module: `media`)

### media_assets

**Purpose.** Metadata for **public** media: logos, covers, galleries, project images, videos and links (ORG-02, §7.3). Having one table lets duplicate detection by content hash work across all entities (§8.6 "fingerprint for images and projects").

| Field | Type | Required | Description |
|---|---|---|---|
| uploaded_by | uuid → users | ✅ | |
| organization_id | uuid → organizations | — | Owning organization context, if any. |
| media_type | MediaType | ✅ | IMAGE \| VIDEO \| LINK |
| bucket / storage_path | text | — | Required unless LINK. |
| external_url | text | — | Required for LINK. |
| mime_type / size_bytes | text / bigint | — | Enforced type and size limits (§18). |
| width / height / duration_seconds | int | — | |
| content_sha256 | text | — | Exact duplicate detection. |
| perceptual_hash | text | — | Near-duplicate image detection (§8.6). |
| status | FileStatus | ✅ | |
| alt_text_ar / alt_text_en | text | — | WCAG (§17). |
| deleted_at | timestamptz | — | Soft delete (the storage object is purged by a job). |

**Constraints.** `CHECK ((media_type='LINK') = (external_url IS NOT NULL))`. Unique `(bucket, storage_path)`.
**Indexes.** `content_sha256`, `perceptual_hash` (anti-abuse lookups), `organization_id`.
**Lifecycle.** PENDING_UPLOAD → SCANNING → READY/REJECTED (see `security-and-audit.md` upload flow). Referenced from join tables. Orphaned assets are purged after 7 days.

### documents · PRD §14 · [sensitive]

**Purpose.** Metadata for **private, sensitive** files: commercial registration, authorization letters, identity evidence, invoices, generated reports (§14 "metadata of encrypted documents", §18 "separate sensitive documents").

| Field | Type | Required | Description |
|---|---|---|---|
| uploaded_by | uuid → users | — | Null when generated by the system. |
| organization_id | uuid → organizations | — | |
| bucket / storage_path | text | ✅ | Always a **private** bucket. |
| original_filename | text | ✅ | |
| mime_type / size_bytes | text / bigint | ✅ | |
| sha256 | text | ✅ | Integrity check. |
| classification | DataClassification | ✅ | `CONFIDENTIAL` or `PERSONAL` for uploads. |
| status | FileStatus | ✅ | |
| encryption_key_ref | text | — | Only if app-level encryption is adopted (TQ-11). |
| retention_until | timestamptz | — | BQ-33. |
| deleted_at | timestamptz | — | |

**Relationships.** Linked through `verification_documents`, `organization_credentials.document_id`, `invoices.document_id`, `reports.document_id`, etc.
**Indexes.** `organization_id`, `uploaded_by`.
**Lifecycle.** Uploaded through quarantine and scan. Accessed **only** through short-lived signed URLs issued by the backend after an authorization check, and **every access is audited** (§18). Deleted by the retention job.

---

## 6. Organizations (module: `organizations`)

### organizations · PRD §14 · [sensitive]

**Purpose.** A company in the directory (ORG-01..10). **Every organization is a company** (BQ-06, ADR-024): there is no type column. The PRD's government and contracting entities (§12) are on hold → BQ-51.

| Field | Type | Required | Description |
|---|---|---|---|
| status | OrganizationStatus | ✅ | Derived from the facts below (ADR-018). |
| slug | citext | ✅ | Unique. Clean canonical URL (§7.4). |
| account_user_id | uuid → users | — | **The company's single user — its Company Account** (BQ-68). Unique. Must be a COMPANY account. Set by company registration (T-02) or an approved claim (T-01); changed only by the admin ownership flow (T-30). Null for UNCLAIMED imported companies. |
| legal_name_ar / legal_name_en | text | — | ORG-01. At least one legal or trade name is required. |
| trade_name_ar / trade_name_en | text | — | ORG-01. |
| commercial_registration_number | text | — | ORG-01, normalised to digits. Unique when present. |
| legal_entity_type | text | — | ORG-01. Code from an admin list (BQ-21). |
| logo_media_id / cover_media_id | uuid → media_assets | — | ORG-02. |
| about_ar / about_en | text | — | ORG-02. |
| founded_year | smallint | — | ORG-02. |
| size_range | text | — | ORG-02. Range code (BQ-21). |
| capacity | jsonb | ✅ | ORG-06. Array of `{dimension, range, source}`, schema-validated; ranges, not raw numbers. Default `[]`. |
| languages | text[] | ✅ | Search filter (§7.4). |
| website_url | text | — | ORG-04. |
| website_domain | citext | — | Normalised domain for duplicate checks (§5.3) and claim domain matching (§5.2). |
| headquarters_location_id | uuid → locations | — | |
| field_visibility | jsonb | ✅ | ORG-10. Map `field → PUBLIC/PRIVATE`, schema-validated. |
| completion_score | smallint | ✅ | 0–100, computed. |
| approved_at / approved_by | timestamptz / uuid | — | Fact: an admin approved the company listing (BQ-05). Approval is not verification (BQ-46). |
| claimed_at | timestamptz | — | Fact: the company has an owner and is published (claim approved, or new company approved). |
| registration_verified_at | timestamptz | — | Fact: `ORGANIZATION_REGISTRATION` signal approved and valid (BQ-47). |
| domain_verified_at | timestamptz | — | Fact: `ORGANIZATION_DOMAIN` signal approved and valid (BQ-47). |
| verified_at | timestamptz | — | Derived: the company meets the VERIFIED rule (pending BQ-53; configurable policy). Credential and contact signals live on their own rows. |
| last_confirmed_at | timestamptz | — | ORG-08: last time the owner updated or confirmed the data. |
| suspended_at / suspension_reason | timestamptz / text | — | |
| archived_at | timestamptz | — | |
| merged_into_organization_id | uuid → organizations | — | Set when this row was merged away (ORG-09). |
| source_import_row_id | uuid → import_rows | — | Source record id (§22.1). |

**Relationships.** Has many `organization_members`, `organization_contacts`, `organization_services`, `organization_coverage`, `organization_credentials`, `organization_media`, `organization_claims`, `organization_approvals`, `projects`, `invitations`, `correction_suggestions`, `verifications` (signals). Phase 2+: subscriptions, entitlements, point_ledger, visibility_snapshots, opportunities, benchmark_sets, saved_lists, rfis.

**Constraints.**
- `CHECK (num_nonnulls(legal_name_ar, legal_name_en, trade_name_ar, trade_name_en) >= 1)`
- Partial unique `commercial_registration_number WHERE NOT NULL AND merged_into_organization_id IS NULL`
- `CHECK (founded_year BETWEEN 1900 AND extract(year from now()))`, enforced in app validation (a CHECK cannot use `now()` reliably)
- `CHECK (merged_into_organization_id IS NULL OR merged_into_organization_id <> id)`

**Indexes.**
- `status` for the admin queue and the directory base filter
- GIN `pg_trgm` on the normalised names, for duplicate detection (ORG-09, §5.3)
- `website_domain` for duplicate and claim matching
- `last_confirmed_at` for the staleness job (ORG-08); signal expiry is read from `verifications.expires_at`

**Lifecycle.** See the `OrganizationStatus` state machine. Created by **import** (UNCLAIMED) or by its **owner** (DRAFT, BQ-05). Approved by an admin (T-29) or claimed (T-01), verified signal by signal (BQ-47), updated, flagged NEEDS_UPDATE, suspended, archived or merged. **Never hard-deleted**: archive is the soft delete (§14.1). Public-field changes rebuild `search_documents`.

---

### organization_contacts · [sensitive]

**Purpose.** Public and private contact channels and official accounts (ORG-04). Kept as rows so that each can be confirmed and have its own visibility. §22.1 forbids publishing unconfirmed imported contact data.

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | |
| type | ContactType | ✅ | EMAIL \| PHONE \| SOCIAL_ACCOUNT \| ADDRESS |
| value | text | ✅ | |
| platform | text | — | For SOCIAL_ACCOUNT (e.g. `linkedin`). |
| label | text | — | |
| is_public | boolean | ✅ | Default `false`. |
| is_imported | boolean | ✅ | Default `false`. True for contacts created by an import (§22.1). |
| confirmed_at / confirmed_by | timestamptz / uuid | — | Set by an approved `ORGANIZATION_CONTACT` verification signal (reviewer or admin only, BQ-47, BQ-48). |
| sort_order | int | ✅ | |

**Constraints.** `CHECK (NOT is_public OR NOT is_imported OR confirmed_at IS NOT NULL)`: imported contacts stay private until confirmed (§22.1).
**Indexes.** `organization_id`.
**Lifecycle.** Managed by the Company Account. Confirmed only through a reviewer's signal decision; editing the value clears `confirmed_at`. Hard delete with an audit record.

### organization_services · organization_coverage · organization_media

| Table | PRD | Columns | PK | Indexes | Notes |
|---|---|---|---|---|---|
| organization_company_types | — rules §2 | organization_id, company_type (CompanyType), created_at | (organization_id, company_type) | `company_type` | **One or more** classifications per company (BQ-61). At least one required before approval. Discovery and presentation only; never permissions; never verification. |
| organization_industries | — rules §3 | organization_id, industry_id, created_at | (organization_id, industry_id) | `industry_id` | **One or more** industries per company (BQ-63). Classification, filtering, discovery only; independent of company type; never permissions. |
| organization_services | §14 ✅ | organization_id, service_id, is_primary (bool), created_at | (organization_id, service_id) | `service_id` | ORG-03 services and specialties. |
| organization_coverage | §14 ✅ | organization_id, location_id, created_at | (organization_id, location_id) | `location_id` | ORG-03 coverage. Scope semantics BQ-21. |
| organization_media | — ORG-02 | organization_id, media_asset_id, sort_order, caption_ar, caption_en | (organization_id, media_asset_id) | — | Gallery. Logo and cover live on `organizations`. |

**Lifecycle.** Replaced as a set by the Company Account. Changes are audited and trigger a search reindex.

---

### organization_credentials · [sensitive]

**Purpose.** Licenses and certifications with issue date, expiry date and verification state (ORG-05).

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | |
| type | CredentialType | ✅ | |
| name_ar / name_en | text | — | At least one. |
| issuer | text | ✅ | |
| reference_number | text | — | |
| issued_on | date | — | |
| expires_on | date | — | |
| document_id | uuid → documents | — | Evidence. |
| verified_at | timestamptz | — | Fact from an approved `ORGANIZATION_CREDENTIAL` signal (one case per credential, BQ-47). |
| is_public | boolean | ✅ | |

**Constraints.** `CHECK (expires_on IS NULL OR issued_on IS NULL OR expires_on >= issued_on)`.
**Indexes.** `(organization_id)`, `(expires_on)` for the expiry alert job (ORG-08).
**Lifecycle.** Created by the Company Account. Verified by a reviewer. An expiring credential triggers a notification; an expired one clears `verified_at` and may move the organization to NEEDS_UPDATE (BQ-20).

---

### organization_claims · [sensitive]

**Purpose.** A request by a user to become the owner of an existing organization (§5.2; glossary term "امتلاك الملف"). Claim-specific data lives here. The review itself is a `verifications` case of type `ORGANIZATION_CLAIM`. Approving a claim grants ownership only; it verifies **no** signal (BQ-46).

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | |
| claimant_user_id | uuid → users | ✅ | |
| verification_id | uuid → verifications | ✅ | Unique. One-to-one with the review case. |
| applicant_title | text | ✅ | Applicant's position (صفة مقدم الطلب). |
| work_email | citext | — | Company-domain email where possible (§5.2). |
| work_email_domain_matches | boolean | — | Automated hint for the reviewer (never decides, BQ-48). |
| submitted_cr_number | text | — | |
| automated_checks | jsonb | ✅ | Results of CR, name, domain and contact matching (§5.2). |
| closed_at | timestamptz | — | Set when the verification reaches a final state. |

**Constraints.** Unique `verification_id`. Partial unique `(organization_id, claimant_user_id) WHERE closed_at IS NULL`.
**Indexes.** `(organization_id) WHERE closed_at IS NULL` to show competing open claims to the reviewer.
**Lifecycle.** Opened by the claimant → automated checks shown as hints → **reviewer or admin decides** (always a person in Phase 1, BQ-48) → approved (company linked to the claimant's Company Account + CLAIMED, T-01) or rejected. Competing open claims → BQ-55. Analytics `profile_claim_started` / `profile_claim_completed` (§16). Target review time: 2 business days (§23).

---

### organization_approvals · [sensitive]

**Purpose.** An owner's request for an admin to approve a new company listing (decision BQ-05). Approval publishes the company; it is **separate from verification** (BQ-46), so it lives here and not in `verifications`.

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | |
| status | OrganizationApprovalStatus | ✅ | PENDING, NEEDS_CHANGES, APPROVED, REJECTED |
| submitted_by | uuid → users | ✅ | The company's Company Account. |
| submitted_at | timestamptz | ✅ | Last (re)submission. |
| checks | jsonb | ✅ | Mandatory-field and duplicate-check results at submission. Default `{}`. |
| decided_by | uuid → users | — | `SYSTEM_ADMIN`. |
| decided_at | timestamptz | — | |
| reason | text | — | Required for NEEDS_CHANGES and REJECTED. Shown to the owner. |
| internal_note | text | — | Staff only. |

**Relationships.** Belongs to `organizations`. One company may have several requests over time.
**Constraints.** Partial unique `(organization_id) WHERE status IN ('PENDING','NEEDS_CHANGES')`: one open request per company. `CHECK (status NOT IN ('NEEDS_CHANGES','REJECTED') OR reason IS NOT NULL)`.
**Indexes.** `(status, submitted_at)` for the admin approval queue.
**Lifecycle.** Owner submits a DRAFT → admin approves (T-29: `organizations.approved_at`, status CLAIMED, search index) / requests changes / rejects. Every decision is audited. Resubmission after rejection and whether imports need approval → BQ-57.

---

### organization_merges · [sensitive]

**Purpose.** Duplicate candidates and merge decisions, with a decision record (ORG-09). Used by imports (§22.1) and by admins (§13).

| Field | Type | Required | Description |
|---|---|---|---|
| source_organization_id | uuid → organizations | ✅ | Will be archived. |
| target_organization_id | uuid → organizations | ✅ | Survives. |
| status | MergeStatus | ✅ | |
| detection_signals | jsonb | ✅ | Matching name, CR, domain; similarity scores. |
| proposed_by | uuid → users | — | Null = system detection. |
| decided_by / decided_at / decision_reason | uuid / timestamptz / text | — | Required when not PROPOSED. |
| executed_at | timestamptz | — | |

**Constraints.** `CHECK (source_organization_id <> target_organization_id)`. Partial unique `(source_organization_id) WHERE status IN ('PROPOSED','APPROVED')`.
**Lifecycle.** PROPOSED → APPROVED (transaction T-03 moves children and archives the source) or REJECTED. Can be appealed (BQ-41).

---

### correction_suggestions

**Purpose.** A reviewer's proposed correction to a company profile. Per §4, reviewers may only "suggest a correction", not edit.

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | |
| field_path | text | ✅ | e.g. `trade_name_en`, `contacts[<id>].value`. |
| current_value / suggested_value | jsonb | ✅ | |
| reason | text | ✅ | |
| status | CorrectionSuggestionStatus | ✅ | |
| suggested_by | uuid → users | ✅ | |
| resolved_by / resolved_at | uuid / timestamptz | — | |

**Indexes.** `(organization_id, status)`.
**Lifecycle.** OPEN → ACCEPTED (the owner applies it through the normal update path) / DISMISSED / WITHDRAWN. Workflow details RG-21.

---

## 7. Company projects / portfolio (module: `projects`)

### company_projects · PRD §14 `projects` · [sensitive]

**Purpose.** A project the company **has worked on** — its portfolio and case studies (§7.3, business rules §4). Part of the company's credibility and professional identity. It is **not** an Opportunity and **not** a Job. It feeds project points (≤ 50 each) and visibility (top 10). Prisma model `CompanyProject`.

**Rule field mapping:** title → `name_*` · description → `scope_description_*` · location → `location_id` · date / period → `start_date`/`end_date` · category → `project_type` · services → `company_project_services` · media → `company_project_media` · client name → `client_name` (**optional**, confidential projects allowed).

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | |
| slug | citext | ✅ | Unique per organization. |
| status | ProjectStatus | ✅ | |
| name_ar / name_en | text | — | **Mandatory:** at least one (§7.3). |
| project_type | text | ✅ | Category (§7.3, rules §4). Code list BQ-21. |
| location_id | uuid → locations | ✅ | **Mandatory** city (§7.3). |
| start_date | date | ✅ | **Mandatory** date (§7.3). |
| end_date | date | — | |
| company_role | text | ✅ | **Mandatory** (§7.3). Code list BQ-21. |
| scope_description_ar / _en | text | — | **Mandatory:** at least one (§7.3). |
| challenge_ar/_en, solution_ar/_en, results_ar/_en | text | — | Quality fields (§7.3). |
| size_range | text | — | Quality field. |
| official_url | text | — | Quality field. |
| client_name | text | — | **Optional** (business rules §4). Stored privately. Exposed only if disclosure ≠ NOT_DISCLOSED. |
| client_disclosure | ClientDisclosureStatus | ✅ | Default `NOT_DISCLOSED`. |
| completion_score | smallint | ✅ | 0–100, computed from the quality fields. |
| points_score | smallint | ✅ | 0–50, computed (§7.3). |
| fingerprint | text | — | Duplicate-project detection (§8.6). |
| submitted_at / published_at / archived_at | timestamptz | — | |
| verified_at | timestamptz | — | "Documented project" (§8.2 experience, §7.3 verification weight). |
| reviewed_by | uuid → users | — | |

**Relationships.** Belongs to `organizations`. Has many `company_project_services`, `company_project_media`, `verifications` (PROJECT, PROJECT_CLIENT). Referenced by `profile_projects` (Phase 3). **No relationship to `opportunities`.**
**Constraints.** Unique `(organization_id, slug)`. `CHECK (num_nonnulls(name_ar,name_en) >= 1)`, `CHECK (num_nonnulls(scope_description_ar, scope_description_en) >= 1)`, `CHECK (points_score BETWEEN 0 AND 50)`, `CHECK (end_date IS NULL OR end_date >= start_date)`.
**Indexes.** `(organization_id, status)`. `(status, submitted_at)` for the review queue. `fingerprint`.
**Lifecycle.** See the ProjectStatus state machine. Archived rather than deleted (DRAFT projects may be hard-deleted by the company).

### company_project_services · company_project_media

| Table | PRD | Columns | PK | Notes |
|---|---|---|---|---|
| company_project_services | — §7.3 | company_project_id, service_id | (company_project_id, service_id) | Index `service_id`. |
| company_project_media | §14 ✅ (`project_media`) | company_project_id, media_asset_id, sort_order, caption_ar, caption_en | (company_project_id, media_asset_id) | Images, video, links. Media is reviewed with the project (§13). |

---

## 8. Verification (module: `verification`)

### verifications · PRD §14 · [sensitive]

**Purpose.** A generic **verification case**: a request to check specific evidence about a subject (glossary: "reviewing specific evidence without guaranteeing overall performance"). There is one queue, SLA and decision history for every verification type.

| Field | Type | Required | Description |
|---|---|---|---|
| type | VerificationType | ✅ | |
| status | VerificationStatus | ✅ | |
| subject_user_id | uuid → users | — | USER_IDENTITY, USER_EXPERIENCE |
| subject_organization_id | uuid → organizations | — | ORGANIZATION_REGISTRATION, ORGANIZATION_DOMAIN, ORGANIZATION_CLAIM |
| subject_project_id | uuid → company_projects | — | PROJECT, PROJECT_CLIENT |
| subject_credential_id | uuid → organization_credentials | — | ORGANIZATION_CREDENTIAL |
| subject_contact_id | uuid → organization_contacts | — | ORGANIZATION_CONTACT |
| subject_experience_id | uuid → experiences | — | USER_EXPERIENCE for a specific experience (column added in Phase 3) |
| requested_by_user_id | uuid → users | ✅ | |
| on_behalf_of_organization_id | uuid → organizations | — | When requested as an organization member. |
| assigned_reviewer_id | uuid → users | — | `VERIFICATION_REVIEWER` or `SYSTEM_ADMIN` (BQ-48). |
| applicant_note | text | — | |
| submitted_at / due_at / decided_at | timestamptz | — | `due_at` = SLA (§23). |
| expires_at | timestamptz | — | Validity of an approval (BQ-23). |

**Constraints.**
- `CHECK (num_nonnulls(subject_user_id, subject_organization_id, subject_project_id, subject_credential_id, subject_contact_id, subject_experience_id) = 1)`: exactly one subject, with real foreign keys (no polymorphic `subject_id`)
- Service-level check that `type` matches the populated subject column
- Partial unique: one **open** case per `(type, subject)` for all types **except** `ORGANIZATION_CLAIM` (several people may claim the same company)

**Indexes.** `(status, type, due_at)` for the reviewer queue ordered by SLA. `(assigned_reviewer_id, status)`. One index per subject column.
**Lifecycle.** See the VerificationStatus state machine. Decisions are made by a person only in Phase 1 (BQ-48). The decision runs the subject handler in the **same transaction** (T-06). Company signals are independent cases (BQ-47). Approved cases expire through the scheduler.

### verification_documents

| Columns | PK | Notes |
|---|---|---|
| verification_id → verifications, document_id → documents, document_role (text: `COMMERCIAL_REGISTRATION`, `AUTHORIZATION_LETTER`, `IDENTITY`, `EXPERIENCE_EVIDENCE`, `LICENSE`, `OTHER`), added_by → users, added_at | (verification_id, document_id) | Locked (no inserts) while status is IN_REVIEW or final. |

### verification_decisions · [sensitive]

**Purpose.** An append-only history of every status change on a case, with its reason. This is the "decision record" required by §5.2 and §8.6 and shown to the applicant (reason only).

| Field | Type | Required | Description |
|---|---|---|---|
| verification_id | uuid → verifications | ✅ | |
| from_status / to_status | VerificationStatus | ✅ | |
| decided_by | uuid → users | — | Null = system (e.g. expiry). |
| reason | text | — | Required when `to_status IN (REJECTED, NEEDS_INFO)`. Visible to the applicant. |
| internal_note | text | — | INTERNAL classification. Staff only. |

**Constraints.** `CHECK (to_status NOT IN ('REJECTED','NEEDS_INFO') OR reason IS NOT NULL)`. Append-only.
**Indexes.** `(verification_id, created_at)`.

---

## 9. Search (module: `search`)

### search_documents · technical

**Purpose.** A **public-only** search projection for companies (Phase 1) and professionals (Phase 3). It exists so that restricted fields **cannot** leak through the search index (§7.4 "prevent exposing restricted fields in the search index"). Only fields that passed visibility rules are copied in.

| Field | Type | Required | Description |
|---|---|---|---|
| subject_type | SearchSubjectType | ✅ | ORGANIZATION \| PROFESSIONAL |
| organization_id | uuid → organizations | — | |
| profile_id | uuid → profiles | — | |
| slug | citext | ✅ | |
| display_name_ar / display_name_en | text | — | |
| normalized_text | text | ✅ | Arabic-normalised (alef/hamza/ta marbuta/diacritics) + English lowercased text. |
| search_vector | tsvector | ✅ | `Unsupported("tsvector")` in Prisma. Maintained by SQL. |
| category_ids / service_ids / location_ids / skill_ids / industry_ids | uuid[] | ✅ | Filters (§7.4); `industry_ids` BQ-63. |
| languages / credential_types / capacity_codes | text[] | ✅ | Filters. |
| is_verified | boolean | ✅ | Verification filter: company VERIFIED rule (BQ-53) or verified professional (§3, BQ-07). |
| verification_signals | text[] | ✅ | Approved company signals, e.g. `REGISTRATION`, `DOMAIN`, `CREDENTIAL`, `CONTACT` (BQ-47). |
| completion_score | smallint | ✅ | "Most complete" sort. |
| visibility_score | numeric(5,2) | ✅ | Phase 2. Default 0. |
| is_sponsored | boolean | ✅ | Phase 2. **Shown as a label; never mixed into organic ranking** (§7.5). |
| data_updated_at | timestamptz | ✅ | Freshness filter and "newest" sort. |

**Constraints.** `CHECK (num_nonnulls(organization_id, profile_id) = 1)`. Unique `organization_id`, unique `profile_id`.
**Indexes.** GIN on `search_vector`. GIN `gin_trgm_ops` on `normalized_text` (spelling tolerance). GIN on each array column. B-tree on `visibility_score DESC`.
**Lifecycle.** Upserted by the search module when it receives `organization.*`, `project.*`, `profile.*` and `visibility.recomputed` events. Deleted when the subject is not publicly visible (suspended, archived, not searchable). Can be fully rebuilt from source tables.

---

## 10. Content & moderation (modules: `content`, `moderation`)

### companies_to_watch_selections

**Purpose.** Admin picks for **Companies to Watch** (BQ-70). The section mixes these manual picks with companies computed from activity, verification signals and completeness. It is a **neutral** discovery section: **not paid** placement and **not** a verification statement; never labelled "Featured".

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | Must be an approved, non-suspended company. |
| selected_by | uuid → users | ✅ | `SYSTEM_ADMIN`. |
| reason | text | — | Internal note. |
| starts_at / ends_at | timestamptz | — | Pick duration (BQ-70 remaining). |
| removed_at / removed_by | timestamptz / uuid | — | |

**Constraints.** Partial unique `(organization_id) WHERE removed_at IS NULL`.
**Lifecycle.** Admin adds and removes picks (audited). The public list `GET /companies/to-watch` combines active picks with computed candidates; weights, slot count and refresh cadence → BQ-70.

### content_items · PRD §14

**Purpose.** Editorial website content: pages and news, bilingual, with SEO fields (§13 content: pages, news, translation, SEO).

| Field | Type | Required | Description |
|---|---|---|---|
| type | ContentType | ✅ | PAGE \| NEWS (RG-15) |
| status | ContentStatus | ✅ | |
| slug | citext | ✅ | |
| title_ar / title_en | text | — | At least one. |
| summary_ar/_en, body_ar/_en | text | — | |
| cover_media_id | uuid → media_assets | — | |
| seo_title_ar/_en, seo_description_ar/_en | text | — | |
| author_user_id | uuid → users | ✅ | |
| published_at / archived_at | timestamptz | — | |

**Constraints.** Unique `(type, slug)`.
**Indexes.** `(type, status, published_at DESC)` for news listing.
**Lifecycle.** Staff (`CONTENT_MODERATOR`, `SYSTEM_ADMIN`) create → publish → archive.

### abuse_reports

**Purpose.** Reports (بلاغات) about companies, projects, profiles, content or opportunities, including privacy and impersonation reports that must be handled within 24 hours (§13, §23).

| Field | Type | Required | Description |
|---|---|---|---|
| target_type | AbuseReportTargetType | ✅ | |
| target_organization_id / target_project_id / target_user_id / target_content_item_id / target_opportunity_id | uuid FKs | — | Exactly one. `target_opportunity_id` is added in Phase 3. |
| reporter_user_id | uuid → users | ✅ | Must be signed in (anti-abuse). |
| category | text | ✅ | RG-26 (e.g. `PRIVACY`, `IMPERSONATION`, `MISLEADING`, `DUPLICATE`). |
| description | text | ✅ | |
| status | AbuseReportStatus | ✅ | |
| sla_due_at | timestamptz | ✅ | 24 h for privacy and impersonation (§23). |
| assigned_to / resolved_by / resolved_at / resolution_note | — | — | |

**Constraints.** `CHECK (num_nonnulls(target_…) = 1)`.
**Indexes.** `(status, sla_due_at)` for the moderation queue. One index per target column.
**Lifecycle.** OPEN → IN_REVIEW → ACTIONED / DISMISSED. The resulting action (suspend, unpublish, penalty) is a separate audited operation.

### appeals

**Purpose.** An appeal against a platform decision, with a decision record (§8.6 points appeals; §13 companies "objections").

| Field | Type | Required | Description |
|---|---|---|---|
| subject_type | AppealSubjectType | ✅ | VERIFICATION_DECISION \| ORGANIZATION_STATUS \| ORGANIZATION_MERGE \| POINT_LEDGER_ENTRY (Phase 2) |
| subject_verification_decision_id / subject_organization_id / subject_merge_id / subject_ledger_entry_id | uuid FKs | — | Exactly one. |
| submitted_by | uuid → users | ✅ | |
| on_behalf_of_organization_id | uuid → organizations | — | |
| reason | text | ✅ | |
| status | AppealStatus | ✅ | |
| decided_by / decided_at / decision_reason | — | — | Required when not SUBMITTED. |

**Constraints.** Exactly one subject. Partial unique: one SUBMITTED appeal per subject.
**Lifecycle.** SUBMITTED → UPHELD (the correcting action runs, e.g. a point REVERSAL) / DENIED. Scope BQ-41.

---

## 11. Notifications (module: `notifications`)

### notifications · PRD §14

**Purpose.** An in-app notification for a user, and the parent record of its email and SMS deliveries.

| Field | Type | Required | Description |
|---|---|---|---|
| recipient_user_id | uuid → users | ✅ | |
| type | text | ✅ | Code from the notification catalog (RG-14), e.g. `verification.approved`. |
| organization_id | uuid → organizations | — | Organization context for grouping. |
| payload | jsonb | ✅ | Template variables. Text is rendered per locale at read or send time. |
| link_path | text | — | Deep link. |
| read_at | timestamptz | — | |

**Indexes.** `(recipient_user_id, read_at, created_at DESC)` for the unread feed.
**Lifecycle.** Created by the notification worker from outbox events. Marked read by the user. Purged after retention (BQ-33).

### notification_deliveries

| Field | Type | Required | Description |
|---|---|---|---|
| notification_id | uuid → notifications | ✅ | |
| channel | NotificationChannel | ✅ | EMAIL \| SMS |
| status | DeliveryStatus | ✅ | |
| provider / provider_message_id | text | — | |
| destination_masked | text | ✅ | e.g. `f***@domain.com`. Never the full value (§28 "logs contain no sensitive data"). |
| attempt_count / last_error / sent_at | — | — | |

**Indexes.** `(status, created_at)` for retries.

### notification_preferences

| Columns | PK | Notes |
|---|---|---|
| user_id → users, notification_type (text), channel (NotificationChannel), enabled (bool), updated_at | (user_id, notification_type, channel) | Security and transactional types (OTP, verification decisions, billing) cannot be disabled (service rule). |

---

## 12. Audit, analytics, imports, platform

### audit_logs · PRD §14 · append-only

**Purpose.** An immutable record of security-relevant and business-critical actions: sign-ins, permission changes, approvals, exports, sensitive reads (§5.2, §12.3, §13, §18). It is separate from analytics.

| Field | Type | Required | Description |
|---|---|---|---|
| occurred_at | timestamptz | ✅ | |
| actor_type | AuditActorType | ✅ | USER \| STAFF \| SYSTEM |
| actor_user_id | uuid → users | — | Null for SYSTEM. |
| actor_platform_roles | text[] | ✅ | Staff roles held at the time. |
| organization_id | uuid → organizations | — | Organization context of the action. |
| action | text | ✅ | e.g. `organization.claim.approve`, `membership.role.change`, `document.access`. |
| entity_type / entity_id | text / uuid | ✅ | |
| changes | jsonb | — | `{before, after}` with sensitive fields **redacted**. |
| reason | text | — | Required for admin overrides. |
| request_id | text | ✅ | Trace id (§15.1). |
| ip_address | inet | — | |
| user_agent | text | — | |

**Constraints.** The app role has INSERT and SELECT only; UPDATE, DELETE and TRUNCATE are revoked. No FK on `entity_id` (it points to many tables).
**Indexes.** `(entity_type, entity_id, occurred_at DESC)` for entity history. `(actor_user_id, occurred_at DESC)`. `(organization_id, occurred_at DESC)` for the institution access log (§12.1). `(action, occurred_at DESC)`.
**Lifecycle.** Inserted **in the same transaction** as the audited mutation. Read by `AUDITOR` and `SYSTEM_ADMIN`. Partitioned by month once volume requires it. Retention BQ-33.

### analytics_events

**Purpose.** First-party product analytics events from the PRD event dictionary (§16): `search_performed`, `profile_impression`, `profile_viewed`, `contact_clicked`, and so on. It is also the raw source for Phase 4 company performance metrics (§11.2) and for zero-result search logging (§7.4).

| Field | Type | Required | Description |
|---|---|---|---|
| event_name | text | ✅ | From the §16 dictionary. |
| occurred_at / received_at | timestamptz | ✅ | |
| anonymous_id | text | ✅ | Random, time-limited visitor id (§16.1, TQ-27). |
| user_id | uuid | — | Only after consent (`ANALYTICS_LINKING`, §16.1). No FK (partitioned table). |
| session_id | text | — | |
| organization_id / profile_id | uuid | — | Subject of the event. |
| properties | jsonb | ✅ | e.g. query, filters, results_count, rank, source. |
| source | text | ✅ | WEB \| IOS \| ANDROID \| SERVER |
| is_bot / is_internal | boolean | ✅ | Bot filter. Owner or staff traffic excluded from metrics (§16.1). |

**Constraints.** Partitioned by `RANGE (occurred_at)` monthly. Append-only.
**Indexes.** Per partition: `(event_name, occurred_at)`, `(organization_id, event_name, occurred_at)`.
**Lifecycle.** Inserted asynchronously (batched). Rolled up into `metric_facts` in Phase 4. Old partitions detached and dropped per retention.

### import_batches · [sensitive]

**Purpose.** A bulk import of company data, with preview, commit and rollback (§22.1). Needed to load the first 500 companies (§22).

| Field | Type | Required | Description |
|---|---|---|---|
| source_name | text | ✅ | |
| source_document_id | uuid → documents | ✅ | The uploaded file (format RG-09). |
| status | ImportBatchStatus | ✅ | |
| total_rows / valid_rows / error_rows / duplicate_rows | int | ✅ | |
| quality_report | jsonb | — | Completeness and quality after the batch (§22.1). |
| previewed_at, committed_at / committed_by, rolled_back_at / rolled_back_by | — | — | |

### import_rows

| Field | Type | Required | Description |
|---|---|---|---|
| batch_id | uuid → import_batches | ✅ | |
| row_number | int | ✅ | |
| source_record_id | text | — | Id from the source system (§22.1). |
| raw_data / normalized_data | jsonb | ✅ | |
| errors | jsonb | ✅ | Default `[]` (§22.1 error log). |
| action | ImportRowAction | ✅ | CREATE \| UPDATE \| SKIP \| MERGE_CANDIDATE |
| duplicate_of_organization_id | uuid → organizations | — | |
| created_organization_id | uuid → organizations | — | Used for rollback. |

**Constraints.** Unique `(batch_id, row_number)`. **Indexes.** `source_record_id`.
**Lifecycle.** Rows are created at upload and never edited after commit. Rollback archives the created organizations that are still UNCLAIMED and have no dependants (T-21).

### outbox_events · technical

**Purpose.** Transactional outbox. Domain events are written **in the same transaction** as the state change, then delivered to consumers (notifications, points, search) by a worker (ADR-011).

| Field | Type | Required | Description |
|---|---|---|---|
| event_name | text | ✅ | e.g. `organization.claim.approved`. |
| aggregate_type / aggregate_id | text / uuid | ✅ | |
| payload | jsonb | ✅ | Versioned event payload. |
| occurred_at | timestamptz | ✅ | |
| status | OutboxStatus | ✅ | |
| attempts | int | ✅ | |
| available_at | timestamptz | ✅ | Retry backoff. |
| processed_at / last_error | — | — | |

**Indexes.** `(status, available_at)` for polling. **Lifecycle.** PENDING → PROCESSED / FAILED (alert). PROCESSED rows are purged after 7 days.

---

# PHASE 2

## 13. Billing (module: `billing`) & entitlements (module: `entitlements`) — ⏸ DEFERRED

> **Business rules §11:** no payment, subscription, invoice, wallet, commission or billing infrastructure is built now. The design below is kept only so that future monetization (company subscriptions, featured opportunities, featured companies, sponsored content, B2B supplier tools) fits without a rewrite. Future `Promotion` / `FeaturedListing` / `SponsoredContent` concepts have **no tables** yet.

### membership_plans · PRD §14

**Purpose.** A configurable plan in the catalog, editable **without a code deploy** (§7.5).

| Field | Type | Required | Description |
|---|---|---|---|
| code | text | ✅ | Unique (e.g. `company_free`, `company_verified`, BQ-14). |
| audience | PlanAudience | ✅ | COMPANY \| INDIVIDUAL (BQ-14) |
| name_ar / name_en, description_ar / description_en | text | — | |
| price_amount_minor | int | ✅ | Halalas (ADR-020). |
| currency | char(3) | ✅ | `SAR`. |
| billing_interval | BillingInterval | ✅ | BQ-15. |
| trial_days | int | ✅ | Default 0. |
| is_public / is_active | boolean | ✅ | |
| sort_order | int | ✅ | |

**Lifecycle.** Staff-managed. A price change never alters existing subscriptions, because the subscription keeps a copy of its price.

### plan_features

| Columns | Constraints | Notes |
|---|---|---|
| plan_id → membership_plans, feature_key (text), is_enabled (bool), limit_value (int, null = unlimited) | Unique `(plan_id, feature_key)` | Feature keys (RG-10), e.g. `team.max_members`, `benchmark.max_competitors`, `reports.market`, `export.monthly_quota`, `opportunities.max_active`, `directory.partner_badge`. |

### subscriptions · PRD §14 · [sensitive]

**Purpose.** A subscriber's paid or trial access to a plan (§7.5).

| Field | Type | Required | Description |
|---|---|---|---|
| subscriber_organization_id | uuid → organizations | — | |
| subscriber_user_id | uuid → users | — | Only if BQ-14 confirms individual plans. |
| plan_id | uuid → membership_plans | ✅ | |
| status | SubscriptionStatus | ✅ | |
| price_amount_minor / currency / billing_interval | — | ✅ | Copied from the plan at purchase time. |
| trial_ends_at, current_period_start, current_period_end, grace_ends_at | timestamptz | — | |
| cancel_at_period_end | boolean | ✅ | |
| cancelled_at | timestamptz | — | |
| pending_plan_id | uuid → membership_plans | — | Downgrade that takes effect at period end (§7.5). |
| is_manual / approved_by | boolean / uuid | — | Manual approval for entities (§7.5). |
| provider_customer_ref / provider_subscription_ref | text | — | |

**Constraints.** `CHECK (num_nonnulls(subscriber_organization_id, subscriber_user_id) = 1)`. **No double subscription (§20.2):** partial unique `(subscriber_organization_id) WHERE status IN ('TRIAL','ACTIVE','GRACE_PERIOD','PAST_DUE')`, and the same for the user column.
**Indexes.** `(status, current_period_end)` for the renewal and expiry jobs.
**Lifecycle.** See the SubscriptionStatus state machine (T-14, T-15).

### invoices · PRD §14 · [sensitive]

| Field | Type | Required | Description |
|---|---|---|---|
| subscription_id | uuid → subscriptions | ✅ | |
| invoice_number | text | ✅ | Unique, **sequential** legal number. This is the one deliberate exception to non-sequential ids (tax rules). |
| status | InvoiceStatus | ✅ | |
| issued_at / due_at | timestamptz | — | |
| subtotal_minor / discount_minor / vat_minor / total_minor | int | ✅ | |
| vat_rate | numeric(5,4) | ✅ | |
| currency | char(3) | ✅ | |
| seller_snapshot / buyer_snapshot | jsonb | ✅ | Legal details frozen at issue time (BQ-45). |
| e_invoice_uuid / e_invoice_status | text | — | ZATCA e-invoicing (TQ-18). |
| document_id | uuid → documents | — | PDF (CONFIDENTIAL). |
| coupon_redemption_id | uuid → coupon_redemptions | — | |

**Constraints.** `CHECK (total_minor = subtotal_minor - discount_minor + vat_minor)`. **Lifecycle.** Issued invoices are never edited: VOID or REFUNDED plus a new invoice.

### payments · PRD §14 · [sensitive]

| Field | Type | Required | Description |
|---|---|---|---|
| invoice_id | uuid → invoices | ✅ | |
| provider / provider_payment_ref | text | ✅ | Unique `(provider, provider_payment_ref)`. |
| status | PaymentStatus | ✅ | |
| amount_minor / currency | int / char(3) | ✅ | |
| method | text | — | |
| failure_reason | text | — | |
| paid_at / refunded_at | timestamptz | — | |
| idempotency_key | text | ✅ | Unique (§15.1). |

No card data is ever stored. The gateway holds it.

### coupons · coupon_redemptions

| Table | Key fields | Constraints |
|---|---|---|
| coupons | code (citext, unique), discount_type (CouponDiscountType), discount_value (int), plan_id (nullable), max_redemptions, redeemed_count, valid_from, valid_until, is_active, created_by | `CHECK (discount_type <> 'PERCENTAGE' OR discount_value BETWEEN 1 AND 100)`, `CHECK (max_redemptions IS NULL OR redeemed_count <= max_redemptions)` |
| coupon_redemptions | coupon_id, subscription_id, redeemed_by_user_id, redeemed_at | Unique `(coupon_id, subscription_id)`; the coupon row is locked when redeeming (T-16) |

### entitlements · PRD §14

**Purpose.** The **effective** features and limits of a subscriber (§14 "actual entitlements of the account"). They come from the plan, exemptions, or manual grants. Every feature-gated check reads this table, never the plan directly.

| Field | Type | Required | Description |
|---|---|---|---|
| subscriber_organization_id / subscriber_user_id | uuid | — | Exactly one. |
| feature_key | text | ✅ | |
| is_enabled | boolean | ✅ | |
| limit_value | int | — | |
| source | EntitlementSource | ✅ | |
| subscription_id | uuid → subscriptions | — | Set when source = PLAN. |
| granted_by / reason | uuid / text | — | Required for EXEMPTION and MANUAL_GRANT. |
| valid_from / valid_until | timestamptz | — | |
| revoked_at | timestamptz | — | |

**Indexes.** `(subscriber_organization_id, feature_key) WHERE revoked_at IS NULL`.
**Lifecycle.** PLAN rows are recalculated whenever a subscription changes state (T-14). Exemptions are audited. **Entitlements never write trust, verification or organic ranking** (§7.5, §8.1).

### payment_provider_events · technical

| Columns | Constraints | Purpose |
|---|---|---|
| provider, provider_event_id, event_type, payload (jsonb), signature_verified (bool), received_at, processed_at, processing_error | Unique `(provider, provider_event_id)` | Deduplicates webhooks so each payment event is processed exactly once. |

### idempotency_records · technical

| Columns | Constraints | Purpose |
|---|---|---|
| scope_key (user + method + route), idempotency_key, request_hash, response_status, response_body (jsonb), expires_at | Unique `(scope_key, idempotency_key)` | `Idempotency-Key` header for payments, points and attendance calls (§15.1). Time-to-live 24 h (TQ-21). |

---

## 14. Engagement (module: `engagement`)

### point_rules · PRD §14

**Purpose.** A named way to earn or lose points (§8.2, §8.3).

| Field | Type | Required | Description |
|---|---|---|---|
| code | text | ✅ | Unique, e.g. `MEMBER_MEETUP_ATTENDED`, `MEMBER_IDENTITY_VERIFIED`, `ORG_PROJECT_SCORE`. |
| subject_type | PointSubjectType | ✅ | |
| category | PointCategory | ✅ | |
| description_ar / description_en | text | — | |
| is_active | boolean | ✅ | |

### point_rule_versions · PRD §14

**Purpose.** An immutable version of a rule's values, kept so that "any historical result can be explained" (§8.1).

| Field | Type | Required | Description |
|---|---|---|---|
| rule_id | uuid → point_rules | ✅ | |
| version | int | ✅ | |
| points | int | ✅ | Negative for penalties. |
| max_per_subject | int | — | `1` = once only (profile completion). |
| daily_cap / weekly_cap | int | — | §8.2, §8.6. |
| requires_verification / requires_review | boolean | ✅ | §8.2 trust and contribution rows. |
| effective_from | timestamptz | ✅ | |
| effective_to | timestamptz | — | |
| created_by | uuid → users | ✅ | |

**Constraints.** Unique `(rule_id, version)`. No overlapping effective periods per rule (exclusion constraint with `btree_gist`). Rows are immutable once `effective_from` has passed.

### point_ledger · PRD §14 · append-only

**Purpose.** **The source of truth for points.** Every movement is recorded here and never updated. Corrections are made by reverse movements (§8.1, §20.2).

| Field | Type | Required | Description |
|---|---|---|---|
| subject_type | PointSubjectType | ✅ | |
| subject_user_id / subject_organization_id | uuid | — | Exactly one. |
| category | PointCategory | ✅ | |
| entry_type | LedgerEntryType | ✅ | |
| amount | int | ✅ | Signed. Never 0. |
| rule_version_id | uuid → point_rule_versions | — | Null only for admin adjustments (then `reason` is required). |
| source_type / source_id | text / uuid | — | The activity that caused it (e.g. `event_registration`). |
| idempotency_key | text | ✅ | **Unique.** e.g. `MEMBER_MEETUP_ATTENDED:<registration_id>` (§8.6 "unique events marked with a non-repeat key"). |
| reverses_entry_id | uuid → point_ledger | — | **Unique.** An entry can be reversed at most once. |
| reason | text | — | |
| created_by | uuid → users | — | Null = system. |
| occurred_at | timestamptz | ✅ | Time of the activity, used for decay (§8.5). |

**Constraints.** `CHECK (amount <> 0)`. `CHECK ((entry_type='REVERSAL') = (reverses_entry_id IS NOT NULL))`. `CHECK (rule_version_id IS NOT NULL OR reason IS NOT NULL)`. Exactly one subject. UPDATE and DELETE revoked from the app role.
**Indexes.** `(subject_user_id, category, occurred_at)`, `(subject_organization_id, category, occurred_at)` for balances, caps and decay. `(source_type, source_id)`.
**Lifecycle.** Insert-only (T-08, T-09).

### point_balances

**Purpose.** A **projection** of the ledger: current balance per subject per category (§8.1 "each has an independent balance"). It is fast to read, can be rebuilt, and is reconciled nightly.

| Field | Type | Required | Description |
|---|---|---|---|
| subject_type, subject_user_id / subject_organization_id | — | ✅ | |
| category | PointCategory | ✅ | |
| balance | int | ✅ | |
| last_entry_id | uuid → point_ledger | ✅ | |
| frozen_at / frozen_by / frozen_reason | — | — | §8.2 penalties "deduction or **freeze**". |

**Constraints.** Unique `(subject_user_id, category)` and `(subject_organization_id, category)` (partial).
**Lifecycle.** Updated **in the same transaction** as each ledger insert, under a row lock. A mismatch found by nightly reconciliation raises an `engagement_alerts` row.

### rewards

**Purpose.** Catalog of **Rewards and Benefits unlocked** by points or levels (rules §10, BQ-59). Points are **never deducted** when a reward is used. Example: `PROFILE_HIGHLIGHT` — shown with its own label, separate from verification and from Featured / Promoted paid placement.

| Field | Type | Required | Description |
|---|---|---|---|
| code | text | ✅ | Unique, e.g. `PROFILE_HIGHLIGHT`. |
| name_ar / name_en, description_ar / description_en | text | — | |
| subject_type | PointSubjectType | ✅ | USER or ORGANIZATION (BQ-71 for companies). |
| unlock_level_id | uuid → member_levels | — | Unlocked at this level… |
| unlock_min_points | int | — | …or at this balance (which balance → BQ-09). |
| is_active | boolean | ✅ | |

**Constraints.** Unique `code`. `CHECK (num_nonnulls(unlock_level_id, unlock_min_points) >= 1)`.
**Lifecycle.** Staff-managed. Whether a reward is unlocked is **computed** from the level or balance; no spending, no redemption rows. Activation, duration and ranking effect of Profile Highlight → BQ-71.

### member_levels

| Field | Type | Required | Description |
|---|---|---|---|
| code | text | ✅ | Unique (§9.1 codes). |
| name_ar / name_en | text | ✅ | |
| min_points / max_points | int | ✅ / — | |
| requires_review / requires_nomination | boolean | ✅ | §9.1 gates. There is **no** verification gate (BQ-07). |
| benefits_ar / benefits_en | text | — | RG-22. |
| sort_order | int | ✅ | |

Seeded from §9.1 (500–799 name pending BQ-52) and managed by staff. Levels unlock benefits only; points are never spent (BQ-08).

### level_assignments · [sensitive]

| Field | Type | Required | Description |
|---|---|---|---|
| user_id | uuid → users | ✅ | |
| level_id | uuid → member_levels | ✅ | |
| status | LevelAssignmentStatus | ✅ | |
| points_at_assignment | int | ✅ | |
| nominated_by / reviewed_by | uuid → users | — | Leader: review. Ambassador: nomination + admin (§9.1). |
| reason | text | — | |
| effective_at / ended_at | timestamptz | — | |

**Constraints.** Partial unique `(user_id) WHERE status='ACTIVE' AND ended_at IS NULL`.

### badges · badge_awards · PRD §14

| Table | Key fields | Constraints |
|---|---|---|
| badges | code (unique), name_ar/en, description_ar/en, icon_media_id, subject_type, is_manual, criteria (jsonb, RG-16), is_active | — |
| badge_awards | badge_id, subject_user_id / subject_organization_id (exactly one), awarded_by (nullable = system), reason, awarded_at, revoked_at, revoked_by, revoke_reason | Partial unique `(badge_id, subject) WHERE revoked_at IS NULL` (§14 "granting and **revoking** badges") |

A paid partner badge is **not** a badge row. It comes from the `directory.partner_badge` entitlement (§7.5).

### visibility_snapshots · PRD §14

**Purpose.** A calculated visibility score with its breakdown and formula version (§8.4). It is kept historically for explainability and anomaly detection.

| Field | Type | Required | Description |
|---|---|---|---|
| subject_type, subject_user_id / subject_organization_id | — | ✅ | |
| score | numeric(5,2) | ✅ | 0–100 |
| components | jsonb | ✅ | Per component: raw value, cap, normalised value, weight, decay applied. |
| formula_version | text | ✅ | e.g. `company-v1` (30/25/20/15/10). |
| computed_at | timestamptz | ✅ | |
| is_current | boolean | ✅ | |

**Constraints.** Partial unique `(subject) WHERE is_current`. `CHECK (score BETWEEN 0 AND 100)`.
**Indexes.** `(subject_organization_id, computed_at DESC)`, `(subject_user_id, computed_at DESC)`.

### engagement_alerts

| Field | Type | Description |
|---|---|---|
| subject (user / org) | uuid | Exactly one. |
| alert_type | text | `POINTS_SPIKE`, `VISIBILITY_SPIKE`, `DUPLICATE_MEDIA`, `DUPLICATE_PROJECT`, `LINKED_ACCOUNTS`, `BALANCE_MISMATCH` |
| details | jsonb | |
| status | EngagementAlertStatus | |
| detected_at / resolved_by / resolved_at / resolution_note | — | |

---

## 15. Events (module: `events`)

### events · PRD §14

| Field | Type | Required | Description |
|---|---|---|---|
| slug | citext | ✅ | Unique. |
| status | EventStatus | ✅ | BQ-18. |
| kind | EventKind | ✅ | MEETUP \| WORKSHOP \| OTHER. Drives the point rule (§8.2 meetup 10, workshop 15). |
| title_ar/_en, description_ar/_en | text | — | |
| venue_name / address | text | — | Location (§9.2). |
| location_id | uuid → locations | — | City. |
| latitude / longitude | numeric(9,6) | — | |
| starts_at / ends_at | timestamptz | ✅ | |
| capacity | int | — | Overall capacity (§9.2). |
| agenda | jsonb | ✅ | Schedule (RG-01). Display-only until specified. |
| cover_media_id | uuid → media_assets | — | |
| host_organization_id | uuid → organizations | — | BQ-17. |
| published_at / completed_at / cancelled_at | timestamptz | — | |

**Constraints.** `CHECK (ends_at > starts_at)`, `CHECK (capacity IS NULL OR capacity > 0)`.
**Indexes.** `(status, starts_at)` for the public listing.

### event_ticket_types

| Field | Type | Description |
|---|---|---|
| event_id | uuid → events | |
| name_ar / name_en | text | Ticket categories (§9.2). |
| capacity | int | Null = shares the event capacity. |
| price_amount_minor / currency | int / char(3) | Default 0. Paid tickets BQ-16. |
| required_feature_key | text | Eligibility by plan (BQ-16). |
| min_level_id | uuid → member_levels | Eligibility by level (BQ-16). |
| sales_start_at / sales_end_at | timestamptz | |
| is_active / sort_order | — | |

### event_speakers · event_sponsors

| Table | Key fields | Notes |
|---|---|---|
| event_speakers | event_id, user_id (nullable), name, title, bio_ar/en, photo_media_id, sort_order | RG-01 |
| event_sponsors | event_id, organization_id (nullable), name, logo_media_id, tier, sort_order | Sponsorship is **labelled visibility**; it never adds trust (§8.1) |

### event_registrations · PRD §14

**Purpose.** A booking **and** its attendance record (§14 "booking and attendance").

| Field | Type | Required | Description |
|---|---|---|---|
| event_id / ticket_type_id | uuid | ✅ | |
| user_id | uuid → users | ✅ | |
| status | RegistrationStatus | ✅ | |
| waitlist_position | int | — | |
| entry_code | text | — | **Unique**, random 128-bit, issued when CONFIRMED (§9.2). |
| attended_at | timestamptz | — | **The attendance fact.** Points are awarded only from this (§9.2). |
| attendance_method | AttendanceMethod | — | |
| checked_in_by | uuid → users | — | Required for MANUAL. |
| transferred_from_registration_id | uuid → event_registrations | — | |
| cancelled_at | timestamptz | — | |
| certificate_document_id / certificate_issued_at | — | — | §9.2 certificate (BQ-19). |

**Constraints.** Partial unique `(event_id, user_id) WHERE status IN ('CONFIRMED','WAITLISTED')`. `CHECK (attended_at IS NULL OR status IN ('CONFIRMED','TRANSFERRED'))`. `CHECK ((attended_at IS NULL) = (attendance_method IS NULL))`.
**Indexes.** `(event_id, status, waitlist_position)` for promotion. `entry_code` for check-in.
**Lifecycle.** See the RegistrationStatus state machine (T-11, T-12, T-13).

### event_feedback

| Columns | Constraints |
|---|---|
| event_id, registration_id, user_id, rating (smallint), answers (jsonb, RG-05), submitted_at | Unique `registration_id`; `CHECK (rating BETWEEN 1 AND 5)`; only for attended registrations (service rule) |

---

# PHASE 3

## 16. Talent (module: `talent`)

### experiences · [sensitive]

**Purpose.** Work history, including the **confirmed employment relationship** with a company on the platform (§10.1: requested by the individual, confirmed by the company, with start and end dates).

| Field | Type | Required | Description |
|---|---|---|---|
| user_id | uuid → users | ✅ | |
| organization_id | uuid → organizations | — | Company on the platform. |
| organization_name | text | — | Company not on the platform. |
| title | text | ✅ | |
| description | text | — | |
| location_id | uuid → locations | — | |
| start_date | date | ✅ | |
| end_date | date | — | |
| is_current | boolean | ✅ | |
| confirmation_status | EmploymentConfirmationStatus | ✅ | |
| confirmation_requested_at / confirmed_at / declined_at | timestamptz | — | |
| confirmed_by_user_id | uuid → users | — | A member of `organization_id` holding `organization.employment.confirm`. |
| verified_at | timestamptz | — | Staff verification (USER_EXPERIENCE). |
| is_public | boolean | ✅ | |

**Constraints.** `CHECK (num_nonnulls(organization_id, organization_name) >= 1)`. `CHECK (end_date IS NULL OR end_date >= start_date)`. `CHECK (NOT is_current OR end_date IS NULL)`. `CHECK (confirmation_status = 'UNCONFIRMED' OR organization_id IS NOT NULL)`.
**Indexes.** `(organization_id, confirmation_status)` for the company confirmation inbox. `user_id`.
**Lifecycle.** Created by the user. Confirmation requested → the company confirms or declines (T-24) → trust points (§8.2 "employer 25", "organization confirmation 20").

### educations · user_certifications · profile_projects · profile_media

| Table | Key fields | Constraints / notes |
|---|---|---|
| educations | user_id, institution_name, degree, field_of_study, start_date, end_date, is_public | End date ≥ start date |
| user_certifications | user_id, name, issuer, credential_reference, issued_on, expires_on, document_id, verified_at, is_public | Distinct from `organization_credentials` |
| profile_projects | user_id, company_project_id (nullable → company_projects), title (nullable), role_description, start_date, end_date, is_public | `CHECK (num_nonnulls(company_project_id, title) >= 1)`. A link to a company project is a "documented project" candidate (§8.2 15–30 points, BQ-10) |
| profile_media | profile_id, media_asset_id, sort_order, caption | PK `(profile_id, media_asset_id)`. Media portfolio (§10.1) |

---

## 17. Opportunities (module: `opportunities`) — unified model (business rules §5–§9)

### opportunities · PRD §14

| Field | Type | Required | Description |
|---|---|---|---|
| organization_id | uuid → organizations | ✅ | Publishing company. For SUPPLIER_REQUEST: the buyer company (rules §7). |
| created_by | uuid → users | ✅ | The company's Company Account. |
| type | OpportunityType | ✅ | JOB, CO_OP, VOLUNTEERING, SUPPLIER_REQUEST (rules §5; PROJECT removed by BQ-62). |
| employment_type | JobEmploymentType | — | PERMANENT, TEMPORARY, FREELANCE. **Required when `type = JOB`**, null otherwise (BQ-73). |
| audience | OpportunityAudience | ✅ | **Generated** from `type`: SUPPLIER_REQUEST → COMPANY, others → INDIVIDUAL (rules §6). |
| status | OpportunityStatus | ✅ | |
| title_ar/_en, description_ar/_en | text | — | At least one title. |
| location_id | uuid → locations | — | |
| availability_requirements | text | — | Type-specific detail. |
| application_deadline | timestamptz | — | |
| starts_on / ends_on | date | — | |
| published_at / paused_at / closed_at / archived_at | timestamptz | — | |
| outcome | OpportunityOutcome | — | Required when CLOSED (§10.3 "close with a result"). |
| closure_note / review_notes | text | — | |

**Constraints.** `CHECK (status NOT IN ('CLOSED','ARCHIVED') OR outcome IS NOT NULL)`. Type rules (audience, who may respond, required fields) live in **one type policy map** in the service (rules §5, §14). `CHECK ((type = 'JOB') = (employment_type IS NOT NULL))`. Publishing a JOB requires a **verified** publishing company (BQ-73; VERIFIED rule BQ-53), checked at publish (T-32).
**Indexes.** `(audience, status, type, published_at DESC)` for the separate individual and company listings, `(organization_id, status)`.

### opportunity_skills · opportunity_services

Composite-PK join tables `(opportunity_id, skill_id)` and `(opportunity_id, service_id)`, each with a reverse index. They are used for filtering and matching (RG-03).

### applications · PRD §14 · [sensitive]

**Purpose.** An **individual's** application to an individual-facing opportunity (business rules §8). Companies never apply here; supplier requests use `supplier_responses`.

| Field | Type | Required | Description |
|---|---|---|---|
| opportunity_id | uuid → opportunities | ✅ | Must have `audience = INDIVIDUAL`. |
| applicant_user_id | uuid → users | ✅ | The individual. |
| status | ApplicationStatus | ✅ | SUBMITTED, REVIEWED, SHORTLISTED, CONTACT, ACCEPTED, REJECTED, WITHDRAWN (rules §8). |
| cover_note | text | — | |
| availability | jsonb | — | Type-specific answers (schema-validated). |
| attachment_document_id | uuid → documents | — | e.g. CV. |
| status_changed_by | uuid → users | — | Company member (or the applicant for WITHDRAWN). |
| reviewed_at / shortlisted_at / contacted_at / decided_at / withdrawn_at | timestamptz | — | One timestamp per stage. |

**Constraints.** Unique `(opportunity_id, applicant_user_id)`. The opportunity's audience is checked in the service (T-17): an application to a SUPPLIER_REQUEST is rejected.
**Indexes.** `(opportunity_id, status)`, `(applicant_user_id, created_at DESC)`.
**Lifecycle.** See `ApplicationStatus`. Transitions are **flexible**: the company may set any status from a non-final status (BQ-67). **The company decides; Back Of House never makes the hiring decision** (rules §8). Withdrawal rule → BQ-67.
**Privacy.** Applicant personal data is visible only to the publishing company's Company Account.

### supplier_responses · [sensitive]

**Purpose.** A **company's** response to a supplier request — the B2B flow Buyer Company → Supplier Request → Supplier Companies → Supplier Response (business rules §7). Never mixed with `applications`.

| Field | Type | Required | Description |
|---|---|---|---|
| opportunity_id | uuid → opportunities | ✅ | Must have `type = SUPPLIER_REQUEST`. |
| responding_organization_id | uuid → organizations | ✅ | The supplier company. Must differ from the buyer company. |
| submitted_by_user_id | uuid → users | ✅ | The responding company's Company Account. |
| status | SupplierResponseStatus | ✅ | SUBMITTED, WITHDRAWN. More statuses and content later if needed (BQ-66). |
| message | text | ✅ | |
| attachment_document_id | uuid → documents | — | |
| submitted_at / withdrawn_at | timestamptz | — | |

**Constraints.** Unique `(opportunity_id, responding_organization_id)`. Service check: responding company ≠ publishing company. **Any** company may respond; **no** restriction by company type (BQ-66). Individuals can never respond.
**Indexes.** `(opportunity_id, status)`, `(responding_organization_id, created_at DESC)`.
**Privacy.** Visible to the buyer company's Company Account and to the responding company's Company Account; never to other suppliers, individuals or visitors (BQ-65).

### application_messages · [sensitive] · ⏸ DEFERRED (business rules §9: no messaging system in the MVP)

**Purpose.** "Controlled messaging" (§6 Phase 3): messages are possible **only inside an application**. There is no open direct messaging.

| Field | Type | Required | Description |
|---|---|---|---|
| application_id | uuid → applications | ✅ | |
| sender_user_id | uuid → users | ✅ | |
| sender_side | MessageSide | ✅ | APPLICANT \| PUBLISHER |
| body | text | ✅ | |
| attachment_document_id | uuid → documents | — | |
| read_at | timestamptz | — | |

**Indexes.** `(application_id, created_at)`. Append-only apart from `read_at`.

### opportunity_feedback · ⏸ DEFERRED (surveys, business rules §9)

| Columns | Constraints |
|---|---|
| opportunity_id, application_id (nullable), respondent_user_id, respondent_side (MessageSide), rating, answers (jsonb, RG-05), submitted_at | Unique `(opportunity_id, application_id, respondent_side)`; "survey for both parties" (§10.3) |

---

# PHASE 4

## 18. Intelligence (module: `intelligence`)

### metric_definitions · PRD §14

| Field | Type | Required | Description |
|---|---|---|---|
| code / version | text / int | ✅ | Unique `(code, version)` (§14.1 "historical versions of report rules"). |
| name_ar / name_en | text | ✅ | |
| metric_group | MetricGroup | ✅ | §11.2 groups. |
| formula_description | text | ✅ | §16.1 "document every KPI formula, source and period". |
| source | text | ✅ | |
| aggregation_period | text | ✅ | |
| min_sample_size | int | ✅ | Default 5 (§11.3). |
| is_active | boolean | ✅ | |

### metric_facts · PRD §14

| Field | Type | Required | Description |
|---|---|---|---|
| metric_definition_id | uuid → metric_definitions | ✅ | |
| organization_id | uuid → organizations | — | Null = aggregate benchmark row. |
| dimension_key | text | ✅ | e.g. `all`, `service:<id>`, `region:<id>`, `size:<code>` (RG-13). |
| period_start / period_end | date | ✅ | |
| value | numeric | ✅ | |
| sample_size | int | — | Required for aggregates. Rows under `min_sample_size` are **never served** (§11.3). |
| is_estimated | boolean | ✅ | §11.3 "mark estimated or incomplete data". |
| data_version | text | ✅ | Reproducibility (§11.3). |
| computed_at | timestamptz | ✅ | |

**Constraints.** Unique `(metric_definition_id, organization_id, dimension_key, period_start, period_end, data_version)` (NULLS NOT DISTINCT).
**Indexes.** `(organization_id, metric_definition_id, period_start)`.

### benchmark_sets · benchmark_set_members · PRD §14 (sets)

| Table | Key fields | Constraints / rules |
|---|---|---|
| benchmark_sets | organization_id (unique), created_by | One set per subscribing company (§11.1) |
| benchmark_set_members | benchmark_set_id, competitor_organization_id, added_by, added_at, removed_at, removed_by | Partial unique `(set, competitor) WHERE removed_at IS NULL`; **max 3 active** and **one change per 90 days** enforced under a row lock on the set (T-19); the competitor must be a listed COMPANY other than the owner |

### reports · PRD §14

| Field | Type | Required | Description |
|---|---|---|---|
| type | ReportType | ✅ | |
| status | ReportStatus | ✅ | |
| organization_id | uuid → organizations | ✅ | Requesting or subject organization. |
| requested_by_user_id | uuid → users | — | Null = scheduled. |
| purpose | text | ✅ | §12.3 "every report carries … purpose". |
| parameters | jsonb | ✅ | |
| period_start / period_end | date | — | §11.3 "show period, region, specialty, sample size". |
| data_version / rule_versions | text / jsonb | — | Required when READY (reproducibility). |
| document_id | uuid → documents | — | |
| error_message | text | — | |
| scheduled_for / started_at / completed_at / expires_at | timestamptz | — | |

### data_exports · append-only · module `audit`

**Purpose.** The export log. Every export records organization, user, date and purpose (§12.3), plus a watermark (§20.2).

| Field | Type | Required | Description |
|---|---|---|---|
| requested_by_user_id | uuid → users | ✅ | |
| organization_id | uuid → organizations | — | |
| export_type | text | ✅ | |
| format | ExportFormat | ✅ | |
| purpose | text | ✅ | |
| filters | jsonb | ✅ | |
| row_count | int | ✅ | |
| watermark_id | text | ✅ | Unique. |
| report_id / document_id | uuid | — | |
| expires_at | timestamptz | ✅ | |

**Rule.** The row is committed **before** the file URL is returned (T-20). Individuals' data cannot be bulk-exported (§2.2, §12.3).

## 19. Institutional / buyer features (module: `institutional`)

> ⚠️ **On hold — BQ-51.** Every organization is a company (BQ-06), so these tables would belong to a **buyer company**, not an institution. Kept as a Phase 4 placeholder until BQ-51 is answered.

| Table | PRD | Key fields | Constraints / notes |
|---|---|---|---|
| saved_lists | §14 ✅ | organization_id (buyer company, BQ-51), name, description, created_by, deleted_at | Private supplier lists (§5.4, §12.1). Soft delete |
| saved_list_items | §14 ✅ | saved_list_id, company_organization_id, internal_note, added_by | Unique `(saved_list_id, company_organization_id)`; internal notes are **never** visible to the company |
| saved_searches | — §12.1 | organization_id, created_by_user_id, name, query (jsonb), alerts_enabled, last_alerted_at, deleted_at | Alerts when new matching suppliers appear |
| rfis | §14 ✅ | requester_organization_id, created_by, subject, message, status (RfiStatus), due_at, sent_at, closed_at | RG-04 |
| rfi_recipients | — §12.1 | rfi_id, recipient_organization_id, status, response_text, response_document_id, responded_by, responded_at | Unique `(rfi_id, recipient_organization_id)` |

---

## Supporting enums introduced by this catalog

Also listed in `enums-and-statuses.md` §12: `LocationType` 🟡, `ContactType` 🟡, `EventKind` 🟡, `MetricGroup` 🟢, `SearchSubjectType` 🔴, `AppealSubjectType` 🔴, `AuditActorType` 🔴, `ImportRowAction` 🔴, `PlanAudience` 🔴, `MessageSide` 🔴. Rule-defined: `AccountType`, `CompanyType`, `OpportunityType`, `OpportunityAudience`, `ApplicationStatus` 🔵; `SupplierResponseStatus` 🔴.
