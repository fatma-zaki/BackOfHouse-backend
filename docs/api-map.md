# REST API Map

> Base path: **`/api/v1`**. Only endpoints backed by PRD requirements are listed. The phase is shown per group.
> Permissions refer to the catalog in `auth-architecture.md` §2.2. `🔐` = requires MFA (`aal2`). `💳` = also requires an entitlement.
> One API serves both the **web** and the **Flutter** clients (BQ-01). **Mandatory business rules:** `business-rules.md`. ⏸ = deferred endpoints, not built unless requested. Open contract decisions: JSON casing (TQ-05), pagination (TQ-06), envelope (TQ-07).

---

## 1. Conventions

### 1.1 Access levels

| Symbol | Meaning |
|---|---|
| **Public** | No token. Returns only public data. Rate-limited per IP |
| **Auth** | Valid token, account ACTIVE, registration complete |
| **Individual** | Auth + `account_type = INDIVIDUAL` (separate security context, BQ-60) |
| **Company** | Auth + `account_type = COMPANY` (separate security context, BQ-60) |
| **Auth⁰** | Valid token; onboarding may be incomplete |
| **Self** | Auth + the resource belongs to the caller |
| **Org** | **Company** + `:organizationId` is the caller's own company (`organizations.account_user_id = caller`, BQ-68) + the resource belongs to that company. The Company Account holds all company permissions; there are no roles |
| **Staff:`perm`** 🔐 | Platform role with `perm` + `aal2` |

### 1.2 URL shapes

```text
/api/v1
├── /me/...                                 the caller's own resources
├── /companies, /professionals, /events,
│   /opportunities, /news, /pages, /...     public read models
├── /organizations/:organizationId/...     company-scoped management (every organization is a company, BQ-06)
├── /admin/...                              staff back office (🔐)
└── /webhooks/...                           signed inbound provider callbacks
```

### 1.3 Response and error format (proposal, TQ-05/06/07)

```jsonc
// 200 collection
{ "data": [ ... ], "meta": { "next_cursor": "eyJpZCI6...", "has_more": true } }

// 200 single
{ "data": { ... } }

// 4xx / 5xx   (fits the existing frontend parser: root-level message + errors map)
{
  "code": "VALIDATION_FAILED",          // stable machine code (clients localise, TQ-26)
  "message": "Validation failed",       // English, for logs/devs only
  "trace_id": "01J9...",                // §15.1 trace id, never sensitive details
  "errors": { "trade_name_en": ["must be at most 200 characters"] }
}
```

| HTTP | When |
|---|---|
| 400 | Malformed request |
| 401 | Missing or invalid token |
| 403 | Authenticated but not permitted (`FORBIDDEN`, `MFA_REQUIRED`, `REGISTRATION_REQUIRED`, `WRONG_ACCOUNT_CONTEXT`, `ACCOUNT_SUSPENDED`, `ENTITLEMENT_REQUIRED`) |
| 404 | Not found **or belongs to another organization** (no existence leak) |
| 409 | State conflict (`INVALID_STATE_TRANSITION`, `DUPLICATE_ORGANIZATION`, `CAPACITY_FULL`, `COMPANY_ALREADY_LINKED`, `COMPANY_NOT_VERIFIED`, `APPROVAL_PENDING`) |
| 422 | Validation failed (the frontend maps 422 → validation) |
| 429 | Rate limited |

### 1.4 Cross-cutting headers

| Header | Purpose |
|---|---|
| `Authorization: Bearer <supabase access token>` | Authentication |
| `Accept-Language: ar \| en` | Locale for server-rendered text (notifications, PDFs); JSON carries both `_ar`/`_en` fields |
| `Idempotency-Key` | **Required** on payment, check-in and point-adjustment calls (§15.1), and accepted everywhere a POST creates something |
| `X-Request-Id` | Optional client correlation id; echoed as `trace_id` |
| `X-Anonymous-Id` | Analytics visitor id (§16.1) on public endpoints |

### 1.5 Pagination

Cursor-based on public and user lists (stable under inserts, §15.1): `?limit=20&cursor=…`. Admin tables may use `?page=&page_size=`. Maximum `limit` = 100.

---

## 2. Identity & onboarding (Phase 1)

Authentication itself happens against **Supabase Auth** from the web or mobile client (ADR-003): sign-up with email or phone **and password**, one-time code confirmation, password sign-in, password recovery by one-time code, refresh and MFA challenge (BQ-30). The endpoints below are the backend's side.

| Method | Path | Access | Description | PRD |
|---|---|---|---|---|
| GET | `/me` | Auth⁰ | Current user; creates the `users` row on first call; includes `onboarding_required` | AUTH-01 |
| PATCH | `/me` | Auth⁰ | Locale, timezone | §14.1 |
| POST | `/registration/individual` | Auth⁰ | Individual flow: full name, consents, basic profile → `account_type = INDIVIDUAL` (T-25) | §5.1, BQ-60 |
| POST | `/registration/company` | Auth⁰ | Company flow: company names, `company_types[]` (one or more, BQ-61), `industry_ids[]` (one or more, BQ-63), contact, consents → `account_type = COMPANY` + DRAFT company with `account_user_id` = this account (T-25, T-02). For an imported company, register then claim (§5.2) | §5.3, BQ-60 |
| GET | `/me/consents` | Auth⁰ | Current consent state | §5.1, §18 |
| PUT | `/me/consents/:purpose` | Auth⁰ | Give or withdraw consent (append-only) | §18 |
| DELETE | `/me/sessions` | Auth⁰ | Terminate **all** sessions | AUTH-02 |
| GET | `/me/company` | Company | The caller's single company (BQ-68) | BQ-68 |
| GET | `/me/company-memberships` | Individual | Companies the individual is a member of (no permissions) | BQ-68 |
| DELETE | `/me/company-memberships/:membershipId` | Individual | Leave a company | BQ-68 |
| — | `/me/data-export`, `/me/deletion-request` | Self | **Later** (AUTH-06, RG-17) | AUTH-06 |

**Admin: users**

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/admin/users` | Staff:`admin.users.manage` | Search users (§13) |
| GET | `/admin/users/:userId` | Staff:`admin.users.manage` | Detail + memberships + roles |
| POST | `/admin/users/:userId/suspend` | Staff:`admin.users.manage` | `reason` required; revokes sessions |
| POST | `/admin/users/:userId/reinstate` | Staff:`admin.users.manage` | |
| POST | `/admin/users/:userId/sessions/revoke` | Staff:`admin.users.manage` | |
| — | `/admin/users/:userId/merge` | — | **Not designed** (RG-07) |

## 3. Company members, invitations, staff roles (Phase 1)

A company has **one user — its Company Account**. Members are **Individual accounts** with no company permissions (BQ-68). How members join → **BQ-75**; the invitation routes below are the candidate flow.

| Method | Path | Access | Rules | Source |
|---|---|---|---|---|
| GET | `/organizations/:organizationId/members` | Org | All members incl. hidden, with `show_on_company_profile` | BQ-64, BQ-68 |
| PATCH | `/organizations/:organizationId/members/:memberId` | Org | `{ show_on_company_profile }` — public visibility only | BQ-64 |
| DELETE | `/organizations/:organizationId/members/:memberId` | Org | Remove member (membership → REMOVED) | BQ-68 |
| GET / POST | `/organizations/:organizationId/invitations` | Org | Invite a person by `email\|phone` (no role) — candidate flow, BQ-75 | BQ-75 |
| DELETE | `/organizations/:organizationId/invitations/:invitationId` | Org | Revoke | BQ-75 |
| GET | `/invitations/:token` | Auth⁰ | Preview (company name) | BQ-75 |
| POST | `/invitations/:token/accept` | Individual | Caller's verified email or phone must match; creates a membership (T-05) | BQ-75 |
| PUT | `/admin/organizations/:organizationId/owner` | Staff:`admin.organizations.manage` | Admin ownership flow: link the company to another Company Account (T-30, BQ-56) | BQ-69 |
| GET | `/admin/staff-roles` | Staff:`admin.staff_roles.manage` | | §3 |
| POST | `/admin/staff-roles` | Staff:`admin.staff_roles.manage` | `user_id`, `role`, `reason` (staff account type → BQ-68) | §3, §18 |
| DELETE | `/admin/staff-roles/:grantId` | Staff:`admin.staff_roles.manage` | `reason` | §18 |

## 4. Profiles (Phase 1; public professionals Phase 3)

| Method | Path | Access | Description | PRD |
|---|---|---|---|---|
| GET | `/me/profile` | Individual | Own individual profile (all sections) | §5.1 |
| PATCH | `/me/profile` | Individual | Name, headline, summary, avatar, languages, `is_searchable`, section visibility | §5.1, §10.1 |
| PUT | `/me/profile/skills` | Self | Replace skill set | §5.1 |
| PUT | `/me/profile/locations` | Self | Replace cities | §5.1 |
| GET | `/professionals` | Public | Search professionals (**Phase 3**) | §6 P3 |
| GET | `/professionals/:slug` | Public | Public profile, privacy applied (**Phase 3**) | §10.1 |

## 5. Taxonomy (Phase 1)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/categories` | Public | Tree; `?include=services` |
| GET | `/categories/:slug` | Public | SEO category page data |
| GET | `/services` | Public | `?category=` |
| GET | `/locations` | Public | `?type=REGION\|CITY&parent=` |
| GET | `/locations/:slug` | Public | SEO city page data |
| GET | `/skills` | Public | `?q=` |
| GET | `/industries` | Public | Industry list (BQ-63) |
| POST / PATCH | `/admin/categories[/:id]`, `/admin/services[/:id]`, `/admin/locations[/:id]`, `/admin/skills[/:id]` | Staff:`taxonomy.manage` | Deactivate instead of DELETE |

## 6. Media & documents (Phase 1)

| Method | Path | Access | Description | PRD |
|---|---|---|---|---|
| POST | `/uploads` | Auth | Request a signed upload: `purpose` (`ORGANIZATION_LOGO`, `PROJECT_MEDIA`, `VERIFICATION_EVIDENCE`, …), `mime_type`, `size_bytes`, `organization_id?` → `{ upload_id, upload_url, expires_at }`. Type and size limits per purpose | §18 |
| POST | `/uploads/:uploadId/complete` | Self (uploader) | Starts the scan; returns asset or document id (status SCANNING) | §18 |
| GET | `/uploads/:uploadId` | Self | Poll status (READY / REJECTED) | |
| GET | `/documents/:documentId/access-url` | Auth + `DocumentAccessPolicy` | Short-lived (≤ 5 min) signed URL; **audited** | §18 |

## 7. Companies: public directory & search (Phase 1)

| Method | Path | Access | Description | PRD |
|---|---|---|---|---|
| GET | `/companies` | Public | Search: `q`, `company_type` (any of the company's types), `industry` (any, BQ-63), `category`, `service`, `city`, `coverage`, `verified`, `languages`, `certification`, `capacity`, `updated_within`, `sort=relevance\|newest\|most_complete`, cursor | §7.4 |
| GET | `/companies/:slug` | Public | Public profile core: information, about, `company_type`, services, contacts (only PUBLIC fields). Other sections have **their own endpoints** so they evolve independently (rules §3). Verification (`is_verified`, `verification_signals`) and any future paid placement (`promotion`) are **separate fields** (rules §12) | ORG-10 |
| GET | `/companies/:slug/opportunities` | Public | The company's published individual-facing opportunities | Rules §3 |
| GET | `/companies/:slug/team` | Public | Individual members with `show_on_company_profile = true` (default); data from their Individual profiles (name, headline, avatar, profile link) | BQ-64, BQ-74 |
| GET | `/companies/to-watch` | Public | **Companies to Watch**: admin picks + companies computed from activity, verification signals and completeness (BQ-70). Neutral section — **not paid**, **not** a verification statement, never labelled Featured | BQ-70 |
| GET / POST / DELETE | `/admin/companies-to-watch[/:selectionId]` | Staff:`admin.organizations.manage` | Manage admin picks (`starts_at`, `ends_at`, `reason`); audited | BQ-70 |
| GET | `/companies/:slug/projects` | Public | Published projects; client name only if disclosed | §7.3 |
| GET | `/companies/:slug/projects/:projectId` | Public | Published company project (portfolio item) | §7.3, rules §4 |
| POST | `/companies/:slug/contact-clicks` | Public | Logs `contact_clicked` (§16); returns contact value only if public | §16 |
| GET | `/seo/sitemap-entries` | Public | Canonical URLs for approved companies, categories, cities, news (web client confirmed, BQ-01) | §7.4, §17 |
| POST | `/analytics/events` | Public (rate-limited) | Batch: `profile_impression`, `profile_viewed`, … (§16 dictionary) | §16 |

## 8. Organizations: management (Phase 1)

| Method | Path | Access | Ownership / rules | PRD |
|---|---|---|---|---|
| POST | `/organizations/duplicate-check` | Auth | `legal_name`, `trade_name`, `cr_number`, `website` → candidate matches (public fields only) | §5.3, ORG-09 |
| POST | `/organizations` | Auth | Only for a Company Account that has no company yet: creates the DRAFT company (normally done by `/registration/company`); a second company needs a second Company Account (BQ-68) → 409 `COMPANY_ALREADY_LINKED` | §5.3, BQ-05, BQ-49 |
| POST | `/organizations/:organizationId/approval-requests` | Org | Submit the DRAFT for admin approval; mandatory fields checked (422); one open request (409 `APPROVAL_PENDING`) | BQ-05 |
| GET | `/organizations/:organizationId/approval-requests` | Org | Request history with admin reasons | BQ-05 |
| GET | `/organizations/:organizationId` | Org | Full record incl. private fields and status facts | ORG-01..10 |
| PATCH | `/organizations/:organizationId` | Org | Not while SUSPENDED/ARCHIVED; updates `last_confirmed_at` | ORG-01..08 |
| PUT | `/organizations/:organizationId/services` | Org | Replace set | ORG-03 |
| PUT | `/organizations/:organizationId/coverage` | Org | Replace set | ORG-03 |
| PUT | `/organizations/:organizationId/field-visibility` | Org | | ORG-10 |
| GET / POST | `/organizations/:organizationId/contacts` | read_private / profile.update | | ORG-04 |
| PATCH / DELETE | `/organizations/:organizationId/contacts/:contactId` | Org | | ORG-04 |
| GET / POST | `/organizations/:organizationId/credentials` | read_private / profile.update | | ORG-05 |
| PATCH / DELETE | `/organizations/:organizationId/credentials/:credentialId` | Org | Editing a verified credential clears `verified_at` | ORG-05 |
| PUT | `/organizations/:organizationId/media` | Org | Gallery order | ORG-02 |
| POST | `/organizations/:organizationId/confirm-data` | Org | "Data is still accurate": sets `last_confirmed_at`, clears NEEDS_UPDATE | ORG-08 |
| POST | `/organizations/:organizationId/verification-requests` | Org | Opens **one signal** case: `ORGANIZATION_REGISTRATION`, `ORGANIZATION_DOMAIN`, `ORGANIZATION_CREDENTIAL` (+ `credential_id`) or `ORGANIZATION_CONTACT` (+ `contact_id`). Only for approved companies | §8.3, BQ-47 |
| GET | `/organizations/:organizationId/verification-signals` | Org | Status of each signal (approved, in review, expired) | BQ-47 |
| GET | `/organizations/:organizationId/correction-suggestions` | Org | | §4 |
| POST | `/organizations/:organizationId/correction-suggestions/:id/accept` · `/dismiss` | Org | Accept applies the change through the normal update path | §4 |

**Claims (§5.2)**

| Method | Path | Access | Rules |
|---|---|---|---|
| POST | `/companies/:organizationId/claims` | Company | Organization must be UNCLAIMED; one open claim per claimant; creates claim + verification case (NOT_STARTED) |
| GET | `/me/claims` | Self | |
| GET | `/me/claims/:claimId` | Self | Status + applicant-visible decision reasons |

Evidence upload and submission use the verification endpoints (§10).

**Admin: organizations (§13)**

| Method | Path | Access | Rules |
|---|---|---|---|
| GET | `/admin/organizations` | Staff:`admin.organizations.manage` or `verification.review` | Filters by status, approval, verification signals, staleness |
| GET | `/admin/organization-approvals` | Staff:`organization.approval.decide` | Approval queue (`status=PENDING`, oldest first) |
| POST | `/admin/organization-approvals/:approvalId/approve` · `/request-changes` · `/reject` | Staff:`organization.approval.decide` | Reason required for request-changes and reject; approve runs T-29 (publishes, no verification) |
| GET | `/admin/organizations/:organizationId` | same | Full record + history |
| POST | `/admin/organizations/:organizationId/suspend` · `/unsuspend` | Staff:`admin.organizations.manage` | `reason` |
| POST | `/admin/organizations/:organizationId/archive` | Staff:`admin.organizations.manage` | `reason` |
| POST | `/admin/organizations/:organizationId/correction-suggestions` | Staff:`organization.correction.suggest` | |
| GET | `/admin/organization-merges` | Staff:`admin.organizations.manage` | Duplicate candidates (system-proposed + manual) |
| POST | `/admin/organization-merges` | Staff:`admin.organizations.manage` | Propose `source`, `target` |
| POST | `/admin/organization-merges/:mergeId/approve` · `/reject` | Staff:`admin.organizations.manage` | `reason`; approve runs T-03 |
| PUT | `/admin/organizations/:organizationId/owner` | Staff:`admin.organizations.manage` | Replace the single owner (T-30); `user_id`, `reason`; audited. Owner-initiated transfer → BQ-56 |

## 9. Projects (Phase 1)

| Method | Path | Access | Rules | PRD |
|---|---|---|---|---|
| GET | `/organizations/:organizationId/projects` | Org | All statuses | §7.3 |
| POST | `/organizations/:organizationId/projects` | Org | DRAFT | §7.3 |
| GET | `/organizations/:organizationId/projects/:projectId` | Org | | |
| PATCH | `/organizations/:organizationId/projects/:projectId` | Org | Not while IN_REVIEW (409); editing PUBLISHED → BQ-54 | §7.3 |
| DELETE | `/organizations/:organizationId/projects/:projectId` | Org | DRAFT only (otherwise archive) | |
| PUT | `/organizations/:organizationId/projects/:projectId/services` · `/media` | Org | | §7.3 |
| POST | `/organizations/:organizationId/projects/:projectId/submit` | Org | Mandatory fields must be complete (422) | §7.3 |
| POST | `/organizations/:organizationId/projects/:projectId/archive` | Org | | §29.1 |
| GET | `/admin/projects` | Staff:`project.review` | Review queue (`status=IN_REVIEW`, SLA) | §13, §23 |
| POST | `/admin/projects/:projectId/approve` · `/request-changes` · `/reject` | Staff:`project.review` | Reason required for changes and reject | §13 |

## 10. Verification (Phase 1)

| Method | Path | Access | Rules | PRD |
|---|---|---|---|---|
| POST | `/me/verifications` | Auth | Open USER_IDENTITY / USER_EXPERIENCE case | §5.1 |
| GET | `/me/verifications` | Self | Includes organization cases the caller requested | §5.1 |
| GET | `/verifications/:verificationId` | Applicant, or Org member with `organization.verification.submit` on the subject organization | Applicant view (no internal notes) | |
| POST | `/verifications/:verificationId/documents` | Applicant | `document_id`, `document_role`; only while NOT_STARTED or NEEDS_INFO | §5.1, §5.2 |
| DELETE | `/verifications/:verificationId/documents/:documentId` | Applicant | same states | |
| POST | `/verifications/:verificationId/submit` | Applicant | NOT_STARTED → IN_REVIEW | |
| POST | `/verifications/:verificationId/respond` | Applicant | NEEDS_INFO → IN_REVIEW, with note | |
| GET | `/admin/verifications` | Staff:`verification.review` | Queue: `type`, `status`, `assigned=me`, `overdue` | §13, §23 |
| GET | `/admin/verifications/:verificationId` | Staff:`verification.review` | Full case, decisions, internal notes, automated checks | |
| POST | `/admin/verifications/:verificationId/assign` | Staff:`verification.review` | | |
| POST | `/admin/verifications/:verificationId/approve` · `/request-info` · `/reject` | Staff:`verification.review` | Human decision only (BQ-48); conflict-of-interest check; reason required for request-info and reject; runs T-06 | §5.2 |

## 11. Content & moderation (Phase 1)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/news` · `/news/:slug` | Public | Frontend already calls `/news` |
| GET | `/pages/:slug` | Public | |
| GET/POST/PATCH | `/admin/content-items[/:id]` | Staff:`content.manage` | |
| POST | `/admin/content-items/:id/publish` · `/archive` | Staff:`content.manage` | |
| POST | `/abuse-reports` | Auth | `target_type`, `target_id`, `category`, `description` |
| GET | `/admin/abuse-reports` | Staff:`moderation.reports.handle` | Ordered by SLA |
| POST | `/admin/abuse-reports/:id/assign` · `/resolve` | Staff:`moderation.reports.handle` | Resolution note; resulting actions are separate calls |
| POST | `/appeals` | Auth | `subject_type`, `subject_id`, `reason` (scope BQ-41) |
| GET | `/me/appeals` | Self | |
| GET | `/admin/appeals` | Staff:`admin.organizations.manage` (P1) / `admin.points.manage` (P2) | Depends on subject type |
| POST | `/admin/appeals/:id/uphold` · `/deny` | same | `decision_reason` |

## 12. Notifications (Phase 1)

| Method | Path | Access |
|---|---|---|
| GET | `/me/notifications` | Self (`?unread=true`, cursor) |
| POST | `/me/notifications/:notificationId/read` | Self |
| POST | `/me/notifications/read-all` | Self |
| GET | `/me/notification-preferences` | Self |
| PUT | `/me/notification-preferences` | Self (mandatory types are rejected with 422) |

## 13. Audit, imports, admin dashboard (Phase 1)

| Method | Path | Access | PRD |
|---|---|---|---|
| GET | `/admin/audit-logs` | Staff:`audit.read` | §13, §3 auditor |
| GET | `/admin/audit-logs/:id` | Staff:`audit.read` | |
| POST | `/admin/imports` | Staff:`admin.imports.manage` | Upload source document → batch UPLOADED (§22.1) |
| POST | `/admin/imports/:batchId/preview` | Staff:`admin.imports.manage` | Validate + duplicate detection, writes nothing |
| GET | `/admin/imports/:batchId` · `/rows` | Staff:`admin.imports.manage` | Errors, duplicates, quality report |
| POST | `/admin/imports/:batchId/commit` | Staff:`admin.imports.manage` | Async job |
| POST | `/admin/imports/:batchId/rollback` | Staff:`admin.imports.manage` | §22.1 |
| GET | `/admin/dashboard` | any Staff | Queue sizes, SLA breaches |

---

## 14. Membership & billing — ⏸ DEFERRED (business rules §11)

> Not built now: no checkout, webhooks, invoices or subscriptions. Kept as a compatibility reference for future monetization.

| Method | Path | Access | Rules | PRD |
|---|---|---|---|---|
| GET | `/membership-plans` | Public | Public, active plans + features | §7.5 |
| GET | `/organizations/:organizationId/subscription` | Org | | §7.5 |
| POST | `/organizations/:organizationId/subscription/checkout` | Org · `Idempotency-Key` | Start trial or payment; 409 if a live subscription exists | §7.5, §20.2 |
| POST | `/organizations/:organizationId/subscription/change-plan` | Org · `Idempotency-Key` | Upgrade now, downgrade at period end | §7.5 |
| POST | `/organizations/:organizationId/subscription/cancel` | Org | Cancel at period end | §7.5 |
| POST | `/organizations/:organizationId/subscription/coupon` | Org | | §7.5 |
| GET | `/organizations/:organizationId/invoices` | Org | | §7.5 |
| GET | `/organizations/:organizationId/invoices/:invoiceId/document-url` | Org | Signed URL, audited | §7.5 |
| GET | `/organizations/:organizationId/entitlements` | Org member | Effective features and limits | §14 |
| POST | `/webhooks/payments/:provider` | Public + **signature verification** | Deduplicated by provider event id | §15.1 |
| CRUD | `/admin/membership-plans[/:id]`, `/admin/membership-plans/:id/features` | Staff:`admin.billing.manage` | Editable without a deploy | §7.5 |
| CRUD | `/admin/coupons[/:id]` | Staff:`admin.billing.manage` | | §7.5 |
| POST | `/admin/entitlements` · DELETE `/admin/entitlements/:id` | Staff:`admin.billing.manage` | Exemptions and manual grants; `reason` | §7.5 |
| POST | `/admin/subscriptions` | Staff:`admin.billing.manage` | Manual approval for entities | §7.5 |
| GET | `/admin/subscriptions` · `/admin/invoices` | Staff:`admin.billing.manage` | | §13 |

Individual subscriptions (`/me/subscription`) are **not listed** until BQ-14 is decided.

## 15. Engagement: points, levels, badges, visibility (Phase 2)

| Method | Path | Access | Rules | PRD |
|---|---|---|---|---|
| GET | `/me/points` | Self | Totals per category, level, next-level progress (detail level BQ-13) | §8.2 |
| GET | `/me/level` · `/me/badges` | Self | | §9.1 |
| GET | `/organizations/:organizationId/points` | Org | Component totals vs caps (detail BQ-13) | §8.3 |
| GET | `/levels` · `/badges` | Public | Definitions | §9.1 |
| GET/POST | `/admin/point-rules`, `/admin/point-rules/:ruleId/versions` | Staff:`admin.points.manage` | New version only; never edit active history | §8.1, §13 |
| GET | `/admin/point-ledger` | Staff:`admin.points.manage` or `audit.read` | Filter by subject, rule, source | §13 |
| POST | `/admin/point-ledger/:entryId/reverse` | Staff:`admin.points.manage` · `Idempotency-Key` | `reason`; T-09 | §8.1 |
| POST | `/admin/point-adjustments` | Staff:`admin.points.manage` · `Idempotency-Key` | Manual credit/debit with `reason` | §13 |
| POST | `/admin/point-balances/freeze` · `/unfreeze` | Staff:`admin.points.manage` | §8.2 penalties | §8.2 |
| GET | `/admin/engagement-alerts` · POST `/:id/resolve` | Staff:`admin.points.manage` | §8.6 | §8.6 |
| GET | `/admin/level-assignments?status=PENDING_REVIEW` · POST `/:id/approve` · `/reject` | Staff:`admin.points.manage` | Upper-level review | §8.6, §9.1 |
| POST | `/admin/users/:userId/level` | Staff:`admin.points.manage` | Ambassador (nomination + admin) | §9.1 |
| CRUD | `/admin/badges[/:id]` · POST `/admin/badge-awards` · `/admin/badge-awards/:id/revoke` | Staff:`admin.points.manage` | | §14 |
| GET | `/admin/visibility/:subjectType/:subjectId` · POST `/recompute` | Staff:`admin.points.manage` | Breakdown for explainability | §8.4 |

## 16. Events (Phase 2)

| Method | Path | Access | Rules | PRD |
|---|---|---|---|---|
| GET | `/events` · `/events/:slug` | Public | Published events, ticket types, speakers, sponsors | §9.2 |
| POST | `/events/:eventId/registrations` | Auth · `Idempotency-Key` | `ticket_type_id`; eligibility (plan/level, BQ-16); CONFIRMED or WAITLISTED (T-11) | §9.2 |
| GET | `/me/event-registrations` · `/:registrationId` | Self | Includes entry code / QR when CONFIRMED | §9.2 |
| POST | `/me/event-registrations/:registrationId/cancel` | Self | T-12 promotes the waitlist | §9.2 |
| POST | `/me/event-registrations/:registrationId/transfer` | Self | Recipient user (rules RG-02) | §9.2 |
| POST | `/me/event-registrations/:registrationId/feedback` | Self | Attended registrations only | §9.2 |
| GET | `/me/event-registrations/:registrationId/certificate-url` | Self | When eligible (BQ-19) | §9.2 |
| CRUD | `/admin/events[/:id]` (+ `/ticket-types`, `/speakers`, `/sponsors`) | Staff:`admin.events.manage` | | §9.2, §13 |
| POST | `/admin/events/:eventId/publish` · `/cancel` · `/complete` | Staff:`admin.events.manage` | | §13 |
| GET | `/admin/events/:eventId/registrations` | Staff:`admin.events.manage` | | §9.2 |
| POST | `/admin/events/:eventId/check-ins` | Staff:`admin.events.manage` · `Idempotency-Key` | `{ entry_code }` or `{ registration_id, method: MANUAL }` (T-13) | §9.2 |
| GET | `/admin/events/:eventId/report` | Staff:`admin.events.manage` | Registration, attendance, no-show, satisfaction | §9.2 |

If companies can host events (BQ-17), organization-scoped `/organizations/:organizationId/events` routes will be added.

---

## 17. Talent (Phase 3)

| Method | Path | Access | Rules | PRD |
|---|---|---|---|---|
| CRUD | `/me/experiences[/:id]` | Self | | §10.1 |
| POST | `/me/experiences/:id/request-confirmation` | Self | Needs `organization_id` → PENDING | §10.1 |
| CRUD | `/me/educations[/:id]`, `/me/certifications[/:id]`, `/me/profile-projects[/:id]` | Self | | §10.1 |
| PUT | `/me/profile/media` | Self | | §10.1 |
| GET | `/organizations/:organizationId/employment-confirmations` | Org | PENDING requests | §10.1 |
| POST | `/organizations/:organizationId/employment-confirmations/:experienceId/confirm` · `/decline` | Org | T-24 | §10.1 |

## 18. Opportunities (Phase 3) — unified model (business rules §5–§9)

One set of endpoints for all opportunity types; responses include `type`, `audience` and `allowed_actions` so clients reuse one component set (rules §5, §14).

**Individual-facing (audience INDIVIDUAL: JOB, CO_OP, VOLUNTEERING)** — company projects are **not** opportunities (BQ-62); they are served by `/companies/:slug/projects`

| Method | Path | Access | Rules | Source |
|---|---|---|---|---|
| GET | `/opportunities` · `/opportunities/:id` | Public | Published, `audience = INDIVIDUAL` **only**; filters `type`, `city`, `skill`, `service`. Supplier requests never appear here | Rules §6 |
| POST | `/opportunities/:id/applications` | Individual | Opportunity must be INDIVIDUAL audience and PUBLISHED; one per applicant (T-17). Company accounts cannot apply (BQ-60). CO_OP student eligibility → BQ-72 | Rules §8 |
| GET | `/me/applications` · `/me/applications/:id` | Self | | Rules §8 |
| POST | `/me/applications/:id/withdraw` | Self | → WITHDRAWN | Rules §8 |

**Company-facing (audience COMPANY: SUPPLIER_REQUEST)**

| Method | Path | Access | Rules | Source |
|---|---|---|---|---|
| GET | `/supplier-requests` · `/supplier-requests/:id` | Company | Published supplier requests, for **Company Accounts only** (BQ-65). Individuals and visitors get 403 / 404, never read-only access | Rules §6, §7, BQ-65 |
| POST | `/supplier-requests/:id/responses` | Org (body `organization_id`) | **Any** company may respond; no company-type restriction (BQ-66); responding company ≠ buyer; one per company (T-31). **Individuals cannot respond** | Rules §7, BQ-66 |
| GET | `/organizations/:organizationId/supplier-responses` | Org | Responses the company has sent | Rules §7 |
| POST | `/organizations/:organizationId/supplier-responses/:responseId/withdraw` | Org | → WITHDRAWN | Rules §7 |

**Company opportunity management (both audiences)**

| Method | Path | Access | Rules | Source |
|---|---|---|---|---|
| GET / POST | `/organizations/:organizationId/opportunities` | Org | Create any type; the type policy map sets audience and required fields. JOB requires `employment_type` (PERMANENT \| TEMPORARY \| FREELANCE, BQ-73) | Rules §5, §9, BQ-73 |
| PATCH | `/organizations/:organizationId/opportunities/:id` | Org | DRAFT or PAUSED only | Rules §9 |
| POST | `…/:id/publish` · `/pause` · `/resume` · `/close` · `/archive` | Org | `close` needs `outcome`. **Publishing a JOB requires a verified company** → 409 `COMPANY_NOT_VERIFIED` (T-32, BQ-73) | Rules §9, BQ-73 |
| GET | `/organizations/:organizationId/opportunities/:id/applications` | Org | Individual applicants (individual audience only) | Rules §9 |
| POST | `…/applications/:applicationId/status` | Org | Body `{ status: REVIEWED \| SHORTLISTED \| CONTACT \| ACCEPTED \| REJECTED }`. **Any** of these from a non-final status (flexible, BQ-67). The company decides | Rules §8, BQ-67 |
| GET | `/organizations/:organizationId/opportunities/:id/supplier-responses` | Org | Responses to the company's supplier request | Rules §7 |
| GET | `/admin/opportunities` · POST `/:id/unpublish` | Staff:`admin.opportunities.moderate` | Moderation | §13 |

**⏸ Deferred (rules §9):** `/applications/:id/messages`, interview and offer endpoints, `/applications/:id/feedback` (surveys), matching.

## 19. Intelligence (Phase 4)

| Method | Path | Access | Rules | PRD |
|---|---|---|---|---|
| GET | `/organizations/:organizationId/performance` | Org 💳 | Metrics by group (§11.2), period | §11.2 |
| GET | `/organizations/:organizationId/benchmark-set` | Org | | §11.1 |
| PUT | `/organizations/:organizationId/benchmark-set/competitors` | Org 💳 | Max 3; one change per 90 days (T-19) | §11.1 |
| GET | `/organizations/:organizationId/comparisons/direct` | Org 💳 | Public data only | §11.1 |
| GET | `/organizations/:organizationId/comparisons/benchmark` | Org 💳 | Sample ≥ 5, else suppressed | §11.1, §11.3 |
| POST | `/organizations/:organizationId/reports` | Org 💳 | `type`, `period`, `purpose` → SCHEDULED | §11 |
| GET | `/organizations/:organizationId/reports[/:reportId]` | Org | | §29.1 |
| POST | `/organizations/:organizationId/reports/:reportId/exports` | Org 💳 | `format`, `purpose`; export log committed first (T-20) | §12.3 |
| GET | `/market-reports` · `/:id` | Org:`market.reports.read` 💳 or Staff | | §4 |
| CRUD | `/admin/metric-definitions` · POST `/admin/reports/:id/regenerate` | Staff:`admin.reports.manage` | New version on change | §13 |
| GET | `/admin/data-exports` | Staff:`audit.read` | | §18 |

## 20. Buyer features (Phase 4) — ⚠️ on hold, BQ-51

> Every organization is a company (BQ-06), so `:institutionId` below would be a **buyer company** and the `institution.*` permissions no longer exist. These routes are a placeholder until BQ-51 is answered.

| Method | Path | Access | PRD |
|---|---|---|---|
| GET | `/organizations/:institutionId/supplier-search` | Org:`institution.search.advanced` | §12.1 |
| CRUD | `/organizations/:institutionId/saved-lists[/:listId]` | Org:`institution.lists.manage` | §12.1 |
| CRUD | `/organizations/:institutionId/saved-lists/:listId/items[/:itemId]` | Org:`institution.lists.manage` (internal notes) | §12.1 |
| GET | `/organizations/:institutionId/compare?companies=a,b,c` | Org:`institution.compare` | §12.1 |
| CRUD | `/organizations/:institutionId/saved-searches[/:id]` | Org:`institution.search.advanced` | §12.1 |
| CRUD | `/organizations/:institutionId/rfis[/:rfiId]` · POST `/send` · `/close` | Org:`institution.rfi.send` | §12.1 |
| GET | `/organizations/:companyId/incoming-rfis` · POST `/:recipientId/respond` · `/decline` | Org | §12.1 |
| GET | `/organizations/:institutionId/access-log` | Org:`institution.access_log.read` | §12.1 |
| POST | `/organizations/:institutionId/exports` | Org 💳 · `purpose` | §12.3 |

## 21. Phase 5 (not designed)

`/partner/v1/*` (partner API with API clients) and outbound signed webhooks. RG-19.

---

## 22. Endpoint count by phase

| Phase | Groups | Approx. endpoints |
|---|---|---|
| 1 | identity, access, profiles, taxonomy, media, companies/search, organizations, claims, projects, verification, content, moderation, notifications, audit, imports, admin | ~120 |
| 2 | engagement, events (billing and entitlements ⏸ deferred) | ~35 |
| 3 | talent, opportunities (+ supplier responses), professionals | ~35 |
| 4 | intelligence, buyer features (on hold, BQ-51) | ~30 |

## 23. Frontend contract gaps (current Flutter app)

| Frontend expects | Backend plan | Action |
|---|---|---|
| `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password` | Supabase Auth from the client (ADR-003): password sign-up + OTP confirmation, password sign-in, OTP recovery (BQ-30) | Agree TQ-02 |
| `POST /auth/social` | Excluded (decision BQ-30) | Remove from the app |
| `GET /me` | ✅ `GET /me` | Align payload casing (TQ-05) |
| `GET /news`, `/news/:id`, `/news/categories` | ✅ `/news`, `/news/:slug`; categories RG-15 | Slug vs id |
| `GET /companies` | ✅ `/companies` | — |
| `GET /events` | ✅ `/events` (Phase 2) | Phase mismatch: frontend shows events now |
| `GET /courses` | ❌ Not in PRD | BQ-02 |
| Page-number pagination + `hasMore` | Cursor pagination + `has_more` | TQ-06 |
