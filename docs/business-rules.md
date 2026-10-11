# Business Rules & Implementation Constraints

> **Status: MANDATORY.** Received from the product owner on 2026-09-17.
> These rules apply to every implementation, API contract, database model, permission and feature.
> **Do not introduce alternative business rules or assumptions unless they are explicitly approved.**
>
> **Precedence:** these rules → business decisions in `open-questions.md` §0 → PRD text. Where a rule changes an earlier document, the change is listed in §17 ("Impact on the architecture") and the documents have been updated.
> Where a rule leaves something open, a question is filed in `open-questions.md`. Nothing was silently resolved.
> **Clarifications added 2026-09-17** (BQ-59 … BQ-67 and further decisions) are marked **✅ Decided** in the sections below and summarised in §18 and §19.

---

## Contents

1. [Account types](#1-account-types)
2. [Company types](#2-company-types)
3. [Company profile](#3-company-profile)
4. [Company projects / portfolio](#4-company-projects--portfolio)
5. [Opportunity model](#5-opportunity-model)
6. [Opportunity audience](#6-opportunity-audience)
7. [Supplier requests](#7-supplier-requests)
8. [Individual applications](#8-individual-applications)
9. [Company opportunity management](#9-company-opportunity-management)
10. [Verification, points and monetization are separate](#10-verification-points-and-monetization-are-separate)
11. [Future monetization](#11-future-monetization)
12. [Paid visibility is separate from trust](#12-paid-visibility-is-separate-from-trust)
13. [Product philosophy](#13-product-philosophy)
14. [MVP principle](#14-mvp-principle)
15. [Required domain separation](#15-required-domain-separation)
16. [Implementation rule: classify before building](#16-implementation-rule-classify-before-building)
17. [Impact on the architecture](#17-impact-on-the-architecture)
18. [Clarifications and additional decisions](#18-clarifications-and-additional-decisions-2026-09-17)
19. [Decisions BQ-62 … BQ-67](#19-decisions-bq-62--bq-67)
20. [Single Company Account, Companies to Watch, JOB rules, industries list](#20-single-company-account-companies-to-watch-job-rules-industries-list)
21. [Decisions of 2026-10-11 (execution plan v2)](#21-decisions-of-2026-10-11-execution-plan-v2)

---

## 1. Account types

**Rule.** Back Of House has exactly **two** account types:

```text
AccountType
├── INDIVIDUAL
└── COMPANY
```

Do **not** create account types such as Supplier User, Event Organizer User, Agency User, Venue User or Service Provider User. Those are **company classifications** (§2), not account types.

**Architecture mapping**
- `users.account_type` is `AccountType = INDIVIDUAL | COMPANY`. It replaces the PRD §5.1 list (interested, student, professional, company representative, entity representative) and resolves **BQ-29**.
- Permissions still come **only** from `organization_members` (company roles) and `user_platform_roles` (staff). The account type never grants a permission by itself.
- ✅ **Decided (BQ-60):** at registration the user chooses **Individual** or **Company**. Each type has its **own registration flow and data**. Individual and Company accounts are **separate security contexts**. The Company Account has **its own RBAC**, independent of Individual accounts. An individual who owns a company gets **no** Company Account permissions; ownership never inherits permissions.
- ~~✅ **Decided (BQ-72):** the **student** concept is **removed** entirely (no account type, no profile attribute). **CO_OP** remains an opportunity type.~~
- ✅ **Decided (BQ-79, 2026-10-11), reverses BQ-72:** students are kept, as a `STUDENT` flag on an Individual account set at sign-up (`profile_status = STUDENT`). It is not an account type. CO_OP opportunities are students-only (`STUDENTS_ONLY`), and a student ID is accepted as a verification document.
- ✅ **Decided (BQ-78, 2026-10-11):** members sign in with email + password, or with phone + SMS one-time code. No social login at launch.
- ✅ **Decided (BQ-68, BQ-74):** a company has **exactly one user — its Company Account**. Members and employees use **Individual accounts**, related to the company by **membership only**, which grants no company permissions.
- ✅ **Decided (BQ-69):** ownership is created or changed **only** through the company creation / ownership flow and admin rules. No separate individual-ownership record.

## 2. Company types

**Rule.** A company has a `companyType` (classification). Initial values:

```text
CompanyType
├── EVENT_ORGANIZER
├── SUPPLIER
├── VENUE
├── PRODUCTION
├── AGENCY
├── SERVICE_PROVIDER
└── OTHER
```

Company type is used for **classification, discovery, filtering, profile presentation and business-specific UX**.
Company type must **not** automatically define all permissions. A company can have several capabilities depending on product rules.

**Architecture mapping**
- ✅ **Decided (BQ-61):** a company can have **several** company types. Stored in `organization_company_types (organization_id, company_type)`. Compatible with **BQ-06** ("no organization types"): BQ-06 removed *institution vs company* kinds; company types classify companies.
- Company type is a search filter and a profile field. **No permission check reads `company_type`** unless a product rule explicitly says so.
- Company type is separate from the service taxonomy (`categories` / `services`).
- ✅ **Decided:** company **classification** and company **verification** are separate. Choosing a type (e.g. `SUPPLIER`) verifies nothing and grants nothing.

## 3. Company profile

**Rule.** A company is a professional business identity, not just an account that posts jobs. Where applicable, the profile supports: company information, about, company type, services, industries, projects / portfolio, team, events, opportunities, jobs, supplier activity, contact information. **These sections must be able to evolve independently.**

**Architecture mapping**

| Profile section | Source (owning module) | Status |
|---|---|---|
| Company information, about, company type, contact | `organizations`, `organization_contacts` (organizations) | Designed |
| Services | `organization_services` (organizations + taxonomy) | Designed |
| Industries | `organization_industries` → `industries` (taxonomy) | ✅ **BQ-63:** multi-select; classification, filtering, discovery; no permissions; independent of company type |
| Projects / portfolio | `company_projects` (projects) | Designed (§4) |
| Team | `organization_members` (Individual accounts) + `show_on_company_profile` | ✅ **BQ-64 / BQ-74:** members are Individual accounts shown by default; the company can hide specific members; displayed data comes from their Individual profiles |
| Events | `events.host_organization_id` (events) | Depends on **BQ-17** (who hosts events) |
| Opportunities, jobs | `opportunities` (opportunities) | Designed (§5) |
| Supplier activity | `opportunities` of type SUPPLIER_REQUEST + `supplier_responses` | ✅ **BQ-65:** visible to **Company Accounts only**; never on the public or individual view |

Each section is served by its **own module and endpoint** (e.g. `/companies/:slug/projects`, `/companies/:slug/opportunities`), not by one large profile model, so sections can change independently.

## 4. Company projects / portfolio

**Rule.** Companies can add projects they have previously worked on. A company project is **not** an Opportunity and **not** a Job. It is a separate Company Project / Portfolio domain:

```text
Company → Company Projects
```

Fields may include: title, description, location, date / period, category, services provided, images / media, client name (**optional**), other metadata. **Client name is never required** (projects may be confidential). Projects are part of the company's credibility and professional identity.

**Architecture mapping**
- Table renamed **`projects` → `company_projects`** (Prisma model `CompanyProject`), with `company_project_services` and `company_project_media`. The rename keeps company portfolio work clearly apart from opportunities.
- Field mapping: title → `name_ar/_en` · description → `scope_description_ar/_en` · location → `location_id` · date / period → `start_date` / `end_date` · category → `project_type` · services → `company_project_services` · media → `company_project_media` · client name → `client_name` (nullable, protected by `client_disclosure`).
- The module stays `projects` (Company Projects domain). It has no dependency on `opportunities`, and `opportunities` has none on it.

## 5. Opportunity model

**Rule.** One unified **Opportunity** concept, not separate systems per type:

```text
OpportunityType
├── JOB
├── CO_OP
├── VOLUNTEERING
└── SUPPLIER_REQUEST
```

✅ **Decided (BQ-62):** `PROJECT` is **not** an opportunity type. A project is a piece of the company's work, shown in **Company Profile → Projects / Portfolio**. There is no project application, and projects are not listed among opportunities. `CompanyProject` stays a separate domain and model (§4).

The frontend should reuse Opportunity components and templates; content and available actions change with `opportunityType`.

**Architecture mapping**
- One `opportunities` table and one `opportunities` module. Type-specific behaviour lives in a single **type policy map** in code (audience, who may respond, which fields are required), not in scattered conditionals.
- This replaces the PRD §10.2 list. PRD `FREELANCE` has no equivalent. Whether JOB carries an employment type (permanent, temporary) and whether it requires a verified publisher → **BQ-73**.
- ✅ **Decided (BQ-80, 2026-10-11):** only a **verified** company can submit a JOB. Otherwise the API returns 422 `COMPANY_NOT_VERIFIED`, and the automated check is a hard rule for JOBs. Unverified companies may submit CO_OP, VOLUNTEERING and SUPPLIER_REQUEST, which are reviewed as usual.
- ⚠️ **Open (BQ-81):** both client contracts list `PROJECT` as an opportunity type, which contradicts BQ-62.

## 6. Opportunity audience

**Rule.** Visibility respects the intended audience.

| OpportunityType | Audience |
|---|---|
| `JOB` | INDIVIDUAL |
| `CO_OP` | INDIVIDUAL |
| `VOLUNTEERING` | INDIVIDUAL |
| `SUPPLIER_REQUEST` | COMPANY |

Supplier requests must **never** be shown to individuals as normal job opportunities.

**Architecture mapping**
- `OpportunityAudience = INDIVIDUAL | COMPANY`, derived from the type and stored as `opportunities.audience` (generated column) for filtering.
- Individual-facing listings (`GET /opportunities`) return only `audience = INDIVIDUAL`. Supplier requests are listed separately (`GET /supplier-requests`).
- ✅ **Decided (BQ-65):** supplier requests are visible to **Company Accounts only**. Individuals cannot see them, not even read-only; visitors cannot see them; they never appear among individual opportunities. All handling happens in the Company Account context.

## 7. Supplier requests

**Rule.** A supplier request is a **B2B** workflow:

```text
Buyer Company → Supplier Request → Supplier Companies → Supplier Response
```

It is **not** an individual job application. Individuals must not be able to apply. Company responses use a separate concept: **`SupplierResponse`**.

**Architecture mapping**
- A supplier request is an `opportunities` row with `type = SUPPLIER_REQUEST`, published by a **buyer company** (a normal company, BQ-06).
- Responses are rows in **`supplier_responses`** (responding company + responding user), **never** in `applications`. `applications` has no organization applicant.
- This answers part of **BQ-51**: buyers of supplier requests are companies. Institutional workspaces, supplier lists and RFIs (§12) stay on hold.
- ✅ **Decided (BQ-66):** **any** Company Account can respond to **any** supplier request. There is **no** restriction by company type. Individuals cannot respond. A response is linked to the responding company and to the specific supplier request.

```text
Supplier Request
   ├── Company A → Response ✅
   ├── Company B → Response ✅
   ├── Company C → Response ✅
   └── Individual → ❌
```

- Response content and statuses can be defined later if needed; the MVP keeps a message, an optional attachment, and SUBMITTED / WITHDRAWN.

## 8. Individual applications

**Rule.** Individuals apply to eligible individual-facing opportunities. There is **one** application status model:

```text
SUBMITTED → REVIEWED → SHORTLISTED → CONTACT → DECISION
                                                 ├── ACCEPTED
                                                 ├── REJECTED
                                                 └── WITHDRAWN
```

Do not create competing status systems (e.g. `SENT → REVIEW → SHORTLIST → INTERVIEW → OFFER`) unless explicitly approved as a future extension.
Back Of House connects individuals and companies but **does not make the hiring decision**. The company reviews applicants and decides.

**Architecture mapping**
- `ApplicationStatus = SUBMITTED | REVIEWED | SHORTLISTED | CONTACT | ACCEPTED | REJECTED | WITHDRAWN`. `DECISION` is the **stage** whose outcomes are ACCEPTED, REJECTED and WITHDRAWN. This resolves the status part of **BQ-25**.
- The publishing company's members change statuses (except WITHDRAWN, which the applicant sets). No platform user or automation makes a decision.
- ✅ **Decided (BQ-67):** the workflow is **flexible, not sequential**. The company simply chooses the appropriate status, e.g. `SUBMITTED → ACCEPTED`, `SUBMITTED → SHORTLISTED → ACCEPTED`, or `SUBMITTED → REJECTED`. The company decides the application's status. The individual can set `WITHDRAWN` under a withdrawal rule still to be fixed → **BQ-67** (remaining part), together with whether a final decision can be changed.

## 9. Company opportunity management

**Rule.** Companies must eventually be able to create, edit, publish and view their opportunities, view applicants or responses, review applicants and shortlist where applicable. **Keep the initial workflow simple.**

✅ **Decided (P2, 2026-10-11):**
- Every opportunity is reviewed before it goes live; verified companies get no review skip (D9).
- A published opportunity **stays live** when edited. The edit becomes a pending **revision**, and approval replaces the live version. The admin review queue labels these "Revision".

**Future scope unless approved:** interview scheduling, full messaging system, offer management, advanced recruitment pipelines, recruitment analytics. The architecture must stay extensible without building them.

**Architecture mapping**
- MVP: `opportunities`, `opportunity_skills`, `opportunity_services`, `applications`, `supplier_responses`.
- **Deferred (not built unless approved):** `application_messages` (the PRD's "controlled messaging"), opportunity matching and match notifications, post-closure surveys (`opportunity_feedback`), recruitment analytics. Their designs stay in the docs as reference only.

## 10. Verification, points and monetization are separate

**Rule.**
- **Verification** is a company's or professional's verification state.
- **Points** are user activity and engagement, and are used for **Rewards**.
- **Paid visibility / monetization** are commercial features bought by companies.

Never grant verification automatically because of many points, payment, being featured or high activity. Points never grant verification.

**Architecture mapping**
- Already enforced by module boundaries: only `verification` creates verification facts; `engagement` owns points; billing and promotions (future) never write to either (see `auth-architecture.md` §0).
- ~~✅ **Decided (BQ-59):** points are **not a currency** and are **never deducted** when a Reward is used. Points **unlock** Levels, Rewards and Benefits.~~
- ✅ **Decided (BQ-76, 2026-10-11), supersedes BQ-08 and BQ-59:**
  - **Points are spent when a reward is redeemed.**
  - Balance = the sum of the ledger.
  - **Level** comes from lifetime **earned** points only, so spending never lowers a level. Levels: L1 0 · L2 100 · L3 500 · L4 1,500 (D9).
  - Redemption is atomic and fails with `INSUFFICIENT_POINTS`, `LEVEL_TOO_LOW` or `OUT_OF_STOCK`.
  - Points still never grant verification.
- ✅ **Decided (BQ-77, 2026-10-11): earning rules** (seed values):

  | Rule | Points |
  |---|---|
  | Event registration | 0 (locked) |
  | Verified event attendance | +150, editable per event |
  | Confirmed volunteer shift | +200 |
  | Profile completed | +50, once |
  | Friend joins and attends | +50, max 10 a month |

- **Reward prices** are as in the designs: 300–1,500, with Profile Highlight at 500.
- ✅ **Decided:** the **Profile Highlight** benefit is separate from **Verification** and from **Featured / Promoted** (paid placement). It is shown with its own label.

## 11. Future monetization

**Rule.** Back Of House will become a commercial platform, but monetization must **not** make the MVP complex. Possible future features:

| Area | Possible features |
|---|---|
| Company subscriptions | Enhanced profile, more portfolio projects, advanced visibility, company analytics, premium business tools |
| Featured opportunities | Paid promotion of jobs, projects, supplier requests |
| ~~Featured companies~~ → see §12 | "Featured" is reserved for future **paid** placement |
| Sponsored industry content | Clearly identified sponsored news |
| B2B / supplier monetization | Paid visibility, lead generation, premium supplier tools |

**Do not** build payment, subscription or commission systems now. **Do not** add Stripe, payment gateways, invoices, wallets, commissions or billing infrastructure because they may be needed later. The architecture must remain compatible with adding them.

**Architecture mapping**
- The `billing` and `entitlements` modules and their tables (`membership_plans`, `plan_features`, `subscriptions`, `invoices`, `payments`, `coupons`, `coupon_redemptions`, `payment_provider_events`, `entitlements`) are **DEFERRED — future monetization reference design**. They are not in any MVP stage.
- Features that referenced entitlements before (event ticket eligibility by plan, plan limits on invitations or exports) have **no plan checks** in the MVP.
- Future concepts `Promotion`, `FeaturedListing`, `SponsoredContent` have **no tables**. Extension points kept: `search_documents.is_sponsored` (label only), a module boundary for a future `promotions` module, and the rule that sponsored placement never feeds trust or organic ranking.

## 12. Paid visibility is separate from trust

✅ **Decided (2026-09-17):** the discovery section formerly called *Featured Companies* is now **Companies to Watch**. The words **Featured** and **Promoted** are **reserved** for future paid placement only. Selection criteria for Companies to Watch → **BQ-70**.

**Rule.** `Featured`, `Sponsored` and `Promoted` are completely separate from `Verified`. A paid company is not automatically verified; a featured company is not automatically more trustworthy. The UI must clearly distinguish commercial placement from verification.

**Architecture mapping**
- API responses expose **separate fields**, never one combined badge: `is_verified` / `verification_signals` (trust), `highlight` (Profile Highlight reward, BQ-59), `companies_to_watch` (discovery section, BQ-70), and a future `promotion` object (`{ type: FEATURED | PROMOTED | SPONSORED }`, paid).
- Paid placement never changes `visibility_score`, trust points or verification state (PRD §7.5, §8.1).

## 13. Product philosophy

**Rule.** Back Of House is **not** only a job board, a social network, a company directory or an advertising platform. It is an ecosystem for events-industry professionals and companies, connecting:

```text
Individuals + Companies + Professional Profiles + Company Portfolios + Services + Jobs + Projects
+ Co-op Training + Volunteering + Supplier Requests + Events + News + Courses + Rewards
```

The implementation stays simple and focused while preserving this ecosystem architecture.

**Architecture mapping**
- **Courses** are part of the ecosystem → **BQ-02** is resolved on scope. Their model and phase are still open (no tables designed).
- **Rewards** → see BQ-76 (supersedes BQ-59).

## 14. MVP principle

**Rule.** Implement what is required now; prepare clean domain boundaries for later.

| Prefer | Avoid |
|---|---|
| Reusable domain models | Duplicated models |
| Reusable UI components | Duplicated opportunity screens |
| Clear enums | Fake functionality |
| Clear permissions | Business rules hardcoded across the UI |
| Clear API boundaries | Premature payment infrastructure |
| Strong typing | Premature messaging infrastructure |
| Explicit relationships | Unnecessary abstractions |
| Extensible architecture | |

**Architecture mapping:** business rules live in the backend's domain services and type policy maps, exposed through explicit API fields (e.g. `audience`, `allowed_actions`), so clients do not duplicate rules.

## 15. Required domain separation

**Rule.** These concepts stay logically separate:

| Concept | Where it lives |
|---|---|
| Account | `users` + Supabase Auth; Individual and Company accounts are separate security contexts (BQ-60); one Company Account per company (`organizations.account_user_id`, BQ-68) |
| Company | `organizations` (organizations) |
| CompanyType | `organization_company_types` — one or more per company (BQ-61) |
| Industry | `organization_industries` → `industries` — one or more per company, independent of company type (BQ-63) |
| CompanyProject | `company_projects` (projects) |
| Opportunity | `opportunities` — JOB, CO_OP, VOLUNTEERING, SUPPLIER_REQUEST (opportunities) |
| Application | `applications` — individuals only (opportunities) |
| SupplierResponse | `supplier_responses` — companies only (opportunities) |
| Verification | `verifications` + `verified_at` facts (verification) |
| Points | `point_ledger`, `point_balances` (engagement) |
| Reward | `rewards` catalog, redeemed by spending points with level and stock checks (BQ-76), e.g. Profile Highlight (500) |

Future monetization concepts, **not implemented**, must stay possible:

| Concept | Placeholder |
|---|---|
| Subscription | Deferred `billing` design |
| Payment | Deferred `billing` design |
| Promotion | Future `promotions` module (no tables) |
| FeaturedListing | Future `promotions` module (no tables) |
| SponsoredContent | Future flag on `content_items` + `promotions` (no columns yet) |

## 16. Implementation rule: classify before building

Before implementing any feature, answer:

1. Is this an **Account** concern?
2. Is this an **Individual** concern?
3. Is this a **Company** concern?
4. Is this **company classification**?
5. Is this a **Company Project**?
6. Is this an **Opportunity**?
7. Is this an **Individual Application**?
8. Is this a **Supplier Response**?
9. Is this **Verification**?
10. Is this **Points / Rewards**?
11. Is this future **Monetization**?

Do not merge unrelated concepts to reduce tables or screens. Do not create separate systems when a reusable domain model is enough.

**Final principle:** build a **simple, professional MVP** whose domain model is strong enough to grow into a commercial events-industry ecosystem without a major rewrite.

---

## 17. Impact on the architecture

Changes applied across the reference docs on 2026-09-17:

| # | Change | Rule | Documents |
|---|---|---|---|
| 1 | `AccountType` = INDIVIDUAL \| COMPANY (was 5 PRD values) | 1 | enums, entities, open-questions |
| 2 | New `CompanyType` enum + `organization_company_types` (one or more, BQ-61) | 2 | enums, entities, ERD, api-map, search |
| 3 | `projects` → `company_projects` (+ services, media) | 4 | entities, ERD, module map, transactions, dev order |
| 4 | `OpportunityType` = JOB, CO_OP, VOLUNTEERING, SUPPLIER_REQUEST (PROJECT removed by BQ-62); new `OpportunityAudience` | 5, 6 | enums, entities, ERD, api-map, workflows |
| 5 | New `supplier_responses` table; `applications` individuals only | 7, 8 | entities, ERD, api-map, transactions (T-17, T-31), events, auth |
| 6 | `ApplicationStatus` = SUBMITTED, REVIEWED, SHORTLISTED, CONTACT, ACCEPTED, REJECTED, WITHDRAWN | 8 | enums, transactions, workflows |
| 7 | Messaging, matching, surveys → deferred | 9 | entities, module map, api-map, dev order |
| 8 | Billing and entitlements → deferred future monetization | 11 | module map, dev order, status, api-map, points |
| 9 | Paid placement fields separate from verification in API responses | 12 | api-map |
| 10 | Courses in scope (BQ-02 scope resolved); Rewards meaning → BQ-59 | 10, 13 | open-questions, points |
| 11 | ADR-026 (account & company types), ADR-027 (unified opportunities + supplier responses), ADR-028 (monetization deferred) | all | architecture-decisions |

**Table count:** 96 designed tables (added `supplier_responses`, `organization_company_types`, `rewards`, `industries`, `organization_industries`, `companies_to_watch_selections`; removed `member_permission_grants`). Of these, 9 are deferred monetization designs and 2 are deferred Phase 3 features (`application_messages`, `opportunity_feedback`).

---

## 18. Clarifications and additional decisions (2026-09-17)

| ID | Decision | Applied as |
|---|---|---|
| **BQ-59** | Points are not a currency and are never deducted when a Reward is used. Points unlock Levels, Rewards and Benefits. The **Profile Highlight** benefit is separate from Verification and from Featured / Promoted | `rewards` catalog (no spending); `highlight` is its own API field |
| **BQ-60** | At registration the user chooses Individual or Company, each with its own flow and data. The accounts are **separate security contexts**. Owning a company as an individual grants **no** Company Account permissions | `AccountContextGuard`; company RBAC members must be COMPANY accounts; ADR-029 |
| **BQ-61** | A company may have **several** company types (Event Organizer, Supplier, Venue, Production, Agency, Service Provider, Other). Classification never grants permissions | `organization_company_types` join table |
| — | Account types are only `INDIVIDUAL` and `COMPANY` | unchanged |
| — | ~~Student attribute~~ — removed later by BQ-72 | — |
| — | **CO_OP** is an opportunity type, not an account type | unchanged |
| — | Unified opportunity model. SUPPLIER_REQUEST is for companies, not an individual job. (PROJECT removed by BQ-62, see §19) | unchanged |
| — | `CompanyProject` is a separate domain; table `company_projects` | unchanged |
| — | *Featured Companies* renamed **Companies to Watch**; **Featured / Promoted** reserved for future paid placement | §11, §12 (criteria → BQ-70) |
| — | Company **verification** and company **classification** are separate | §2 |
| — | **Ownership** is not a way to inherit Company Account permissions | ADR-029 |
| — | The Company Account's permissions are independent of any Individual account (refined by BQ-68: a single company user, no roles) | ADR-029, ADR-030 |

New open questions: **BQ-68** (company account logins and team), **BQ-69** (individual ownership record), **BQ-70** (Companies to Watch criteria), **BQ-71** (Profile Highlight mechanics), **BQ-72** (student attribute details).

---

## 19. Decisions BQ-62 … BQ-67

| ID | Decision | Applied as |
|---|---|---|
| **BQ-62** | `PROJECT` is **not** an opportunity. It is company work shown in Company Profile → Projects / Portfolio. No project application; not listed among opportunities. `CompanyProject` stays a separate domain | `OpportunityType` = JOB, CO_OP, VOLUNTEERING, SUPPLIER_REQUEST |
| **BQ-63** | Industries are **multi-select**; a company can belong to several. Used for classification, filtering and discovery. No permissions, no RBAC effect. Independent of company type | `industries` lookup + `organization_industries`; search filter `industry` |
| **BQ-64** | Company members are shown on the Company Profile **by default**. The company can hide specific members. Hiding does not end the membership and does not change internal permissions; it affects public visibility only | `organization_members.show_on_company_profile` (default `true`); `GET /companies/:slug/team` |
| **BQ-65** | Supplier requests are visible to **Company Accounts only**. Individuals cannot see them, even read-only. Never among individual opportunities. Handled from the Company Account | `/supplier-requests` requires a COMPANY account; excluded from public and individual endpoints |
| **BQ-66** | **Any** Company Account can respond to **any** supplier request. No company-type restriction. Individuals cannot respond. A response is tied to the company and the specific request. Response statuses and content can be defined later | `supplier_responses`; permission `supplier_response.submit` in the responding company's RBAC |
| **BQ-67** | Statuses SUBMITTED, REVIEWED, SHORTLISTED, CONTACT, ACCEPTED, REJECTED, WITHDRAWN. Transitions are **flexible, not sequential**; the company chooses the status. The individual can withdraw under a rule to be fixed | Any company-set status from any non-final status; withdrawal rule and decision changes remain open (BQ-67) |

New open items: **BQ-73** (JOB employment type and verified publisher), **BQ-74** (which member data appears on the public team section), **RG-28** (initial industries list).

---

## 20. Single Company Account, Companies to Watch, JOB rules, industries list

| ID | Decision | Applied as |
|---|---|---|
| **BQ-68** | A company has **only one user — its Company Account**. Members and employees have **Individual accounts**; their relation to the company is **membership** | `organizations.account_user_id` (unique); `organization_members` holds Individual accounts only; company roles and `member_permission_grants` removed; ADR-030 |
| **BQ-69** | Ownership is created or changed **only** through the company creation / ownership flow and the admin rules already decided | T-01 claim, T-02 creation, T-30 admin ownership flow; no individual ownership record |
| **BQ-70** | **Companies to Watch** is a **mix of factors**: manual selection by a Back Of House admin, an activity-based algorithm, and verification / completeness. It is a neutral replacement for "Featured": **not paid placement** and **not** a verification statement | `companies_to_watch_selections` (admin picks) + computed candidates from activity, verification signals and completion; label never "Featured" / "Verified". Weights, slot count and refresh cadence → BQ-70 (remaining) |
| **BQ-71** | Profile Highlight — **not decided yet** | Stays open |
| **BQ-72** | ~~The **student** concept is **removed** entirely~~ ⚠️ reversed by BQ-79 (§21) | ~~`profiles.is_student` removed~~; students kept |
| **BQ-73** | A JOB has an **employment type** (permanent, temporary, freelance). Publishing a JOB **requires a verified company** | `JobEmploymentType` enum + `opportunities.employment_type` (required for JOB); publish check (T-32) uses the VERIFIED rule (BQ-53) |
| **BQ-74** | The company has only one account (the Company Account) | Public team shows member Individual accounts with data from their Individual profiles |
| **RG-28** | Initial industries list prepared from research (below) | Seed for `industries` after business review |

### Draft initial industries (RG-28)

**Draft initial list (RG-28, 2026-09-17) — needs business review before seeding.** Based on common events-industry and MICE segmentation (corporate events & seminars, conferences, exhibitions, incentives, concerts, festivals, sports, social events) and Saudi market context (seasons, esports, government events). Industries describe the **market a company serves**; company types describe **what the company is** (BQ-61, BQ-63).

| # | slug | Arabic | English |
|---|---|---|---|
| 1 | `corporate-events` | فعاليات الشركات والندوات | Corporate Events & Seminars |
| 2 | `conferences-forums` | المؤتمرات والمنتديات والقمم | Conferences, Forums & Summits |
| 3 | `exhibitions-trade-shows` | المعارض التجارية والمعارض | Exhibitions & Trade Shows |
| 4 | `meetings-incentives` | الاجتماعات ورحلات الحوافز | Meetings & Incentive Travel |
| 5 | `brand-activations` | إطلاق المنتجات والتفعيل التسويقي | Product Launches & Brand Activations |
| 6 | `concerts-live-entertainment` | الحفلات الموسيقية والترفيه الحي | Concerts & Live Entertainment |
| 7 | `festivals-seasons` | المهرجانات والمواسم | Festivals & Seasons |
| 8 | `sports-events` | الفعاليات الرياضية | Sports Events |
| 9 | `esports-gaming` | الرياضات الإلكترونية والألعاب | Esports & Gaming |
| 10 | `government-national-events` | الفعاليات الحكومية والوطنية | Government & National Events |
| 11 | `culture-arts-heritage` | الثقافة والفنون والتراث | Culture, Arts & Heritage |
| 12 | `weddings-private-events` | الأعراس والمناسبات الخاصة | Weddings & Private Events |
| 13 | `education-training-events` | الفعاليات التعليمية والتدريبية | Education & Training Events |
| 14 | `community-charity-events` | الفعاليات المجتمعية والخيرية | Community & Charity Events |
| 15 | `tourism-destination-events` | السياحة وفعاليات الوجهات | Tourism & Destination Events |
| 16 | `other` | أخرى | Other |

New open question: **BQ-75** (how individuals become company members, and whether members can hide themselves).

## 21. Decisions of 2026-10-11 (execution plan v2)

Recorded with `open-questions.md` §0 and the ADRs named below.

| ID | Decision | Applied as |
|---|---|---|
| **D9** | Profile completion **+50** points. Support first-reply deadline counts working hours **Sunday–Thursday 09:00–17:00 Asia/Riyadh**. **No review skip** for verified companies. Levels **0 / 100 / 500 / 1,500**. *Pending product owner sign-off* | `settings` defaults; `support/domain/working-hours`; earning-rule seed |
| **P2** | A published opportunity stays live while an edit is reviewed as a pending **revision**. Approval replaces the live version. The admin queue labels it "Revision" | `opportunities` state machine (§9) |
| **P3** | One Company Account per company for launch (ADR-030). The domain `Actor` for a company carries a permissions list so roles can be added later. Admin company detail shows the single account, not a team list | ADR-030 confirmed |
| **BQ-76** | Points are spent on redeem. Balance = ledger sum; level from lifetime earned points; atomic redemption | §10; ADR-014 amended |
| **BQ-77** | Design points scale (attendance 150, volunteer shift 200, profile 50, referral 50 × 10/month); reward prices 300–1,500 | §10; earning-rule seed; replaces `points-architecture.md` 10/15 |
| **BQ-78** | Email + password and phone SMS-code sign-in; no social login at launch | §1; ADR-003 amended; SMS provider → TQ-04 |
| **BQ-79** | Students kept (reverses BQ-72): `STUDENT` flag at sign-up, CO_OP students-only, student ID as a verification document | §1 |
| **BQ-80** | JOB requires a verified company (BQ-73 stands); 422 `COMPANY_NOT_VERIFIED`; other types allowed for unverified companies | §5 |

New open item: **BQ-81** (is PROJECT an opportunity type?).
