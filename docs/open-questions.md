# Open Questions & Ambiguities

> **Source:** `Back_Of_House_Technical_Product_Requirements_AR_v1.0.docx` (v1.0, 27 Aug 2026), cited as **PRD §x**.
> This register collects everything the PRD leaves unclear. **None of these have been silently resolved** in the architecture. Where the architecture needs a working assumption to continue, it is labelled **ASSUMPTION** and points back to the question ID.
> Business answers are recorded in the **Decision log** (§0) and applied across all documents. Resolved rows stay in place, marked ✅, so existing references keep working.

Legend

| Tag | Meaning |
|---|---|
| `NEEDS BUSINESS DECISION` | Product/business/legal must decide. |
| `REQUIRES TECHNICAL DECISION` | Engineering can decide; a recommendation is given. |
| `REQUIREMENT GAP` | Feature is mentioned but not specified enough to build. |
| **Blocks** | Earliest phase whose build is blocked or at risk. |

---

## 0. Decision log

### 2026-10-11 (later): D5, D11, BQ-76 … BQ-80

Source: `execution-plan.md` v2.2.
- ADRs: ADR-032 (accepted), ADR-003, ADR-014 and ADR-031 (amended).
- Rules: `business-rules.md` §21.

**Still open (top of the list)**

| ID | Question | Blocks |
|---|---|---|
| **BQ-31** (D10) | **Hosting region and PDPL:** region for personal data, consent records, retention per data type (BQ-33), breach procedure | **Phase 1** only |
| **TQ-04** | **SMS provider** for Saudi numbers, with sender-ID registration, for phone-code sign-in (BQ-78) | Phase 2 |
| **BQ-81** | **Is PROJECT an opportunity type?** Both contracts list `PROJECT` (Flutter `OpportunityType`, hand-off listing type `project`), and BQ-80 names "projects" among the types unverified companies may submit. BQ-62 says PROJECT is **not** an opportunity type, only company portfolio work. (a) PROJECT is an opportunity type (reverses BQ-62) · (b) remove `PROJECT` from both contracts | Phase 5 |

**Decided**

| ID | Decision |
|---|---|
| **D5 / TQ-28** | Staff sign in with **Google Workspace via OIDC** (ADR-032). Only our Workspace domain: the server checks the `hd` claim **and** the email domain. 2-Step Verification is enforced in the Workspace admin console (runbook control); there is no TOTP of our own. `staff_accounts` holds role and status; an active Google account without an active row gets 403 `NOT_STAFF`. Invite = a `staff_accounts` row with status `invited`, activated by the first Google sign-in with that email; no passwords and no invite tokens. Session = opaque httpOnly cookie, 30-min idle, 12 h max; role change or disable ends sessions immediately |
| **D11 / TQ-29** | **No legacy alias.** No store build calls the real API and nothing is live at `backofhouse.space/api`. `GET /api/app/v1/meta/app-version` (`min_supported_version`, `latest_version`) ships before the first store release |
| **BQ-78** | Members sign in with **email + password** and with **phone + SMS one-time code**. **No Google or social login at launch** (BQ-30 stands for social). `/auth/social` is removed from `contracts/app`. Phone-code sign-in has rate limits per phone and per IP, code expiry and an attempt cap. Answers BQ-58 |
| **BQ-79** | **Keep students** (reverses BQ-72): a `STUDENT` flag at sign-up; CO_OP opportunities are students-only (eligibility check, `STUDENTS_ONLY`); a student ID is accepted as a verification document |
| **BQ-76** | **Points are spent on redeem** (reverses BQ-08 and BQ-59). Balance = sum of the ledger. Level comes from lifetime earned points only, so spending never lowers a level. Redemption is atomic: `INSUFFICIENT_POINTS`, `LEVEL_TOO_LOW`, `OUT_OF_STOCK`. Answers BQ-09 (level basis) |
| **BQ-77** | **Design points scale**, seeded as earning rules: event registration 0 (locked); verified event attendance +150 (editable per event); confirmed volunteer shift +200; profile completed +50 (once); friend joins and attends +50 (max 10 a month). Levels 0 / 100 / 500 / 1,500. Reward prices as in the designs (300–1,500; Profile Highlight 500). Replaces the repo's 10 / 15 values; answers part of BQ-10 |
| **BQ-80** | Only **verified** companies can publish a **JOB** (BQ-73 stands). Unverified companies can still submit volunteering, co-op and supplier requests, reviewed as usual (PROJECT depends on BQ-81). Submitting a JOB from an unverified company returns **422 `COMPANY_NOT_VERIFIED`**; for JOBs the automated check is a hard rule, not a warning |

### 2026-10-11: Execution plan v2 (D1 … D13, P1 … P4)

Source: `execution-plan.md` v2 §2 and §0.3.
- Amended ADRs: ADR-003, ADR-008, ADR-016, ADR-019, ADR-030.
- New ADRs: ADR-031, ADR-032, ADR-033.

**Decided**

| ID | Decision |
|---|---|
| **D1** | The Flutter contract (now `contracts/app/openapi.yaml`) wins for app routes; the admin hand-off's member ops only add missing features. One vocabulary on both surfaces: **"opportunities"**. 8 admin hand-off routes renamed from `/listings` (list in `execution-plan.md` D1), plus permission keys, export dataset, audit actions and settings keys (ADR-031) |
| **D2** | snake_case JSON on both surfaces (ADR-019 accepted; answers TQ-05) |
| **D3** | Keep `{code, message, trace_id, errors}`; one shared error-code catalog in `docs/error-codes.md`; the Flutter code wins on conflicts (ADR-008 amended; answers TQ-07) |
| **D4** | Prefixes `/api/app/v1` and `/api/admin/v1`; health at `/api/health`. App surface paging follows the Flutter contract (`page`, `page_size`, `has_more`) (ADR-008, ADR-031; answers TQ-06) |
| **D6** | Keep pg-boss (ADR-010), the storage port (ADR-009) and the separate `worker` process (ADR-022) |
| **D7** | Keep the repo's entity names (`organizations`, `opportunities` …); the gap report maps them to the hand-off names |
| **D8** | Phase 5 (opportunities marketplace) before Phase 6 (events, points, rewards). Each phase ships its app and admin lanes together |
| **D9** | Profile completion **+50** points. Support working hours **Sunday–Thursday 09:00–17:00 Asia/Riyadh**. **No review skip** for verified companies. Levels **L1 0 · L2 100 · L3 500 · L4 1,500** points (Flutter table). *Pending product owner sign-off* |
| **D11** (part) | Build `GET /api/app/v1/meta/app-version` (`min_supported_version`, `latest_version`) before the first store release. Whether a legacy alias is needed → **TQ-29** |
| **D12** | No audit hash chain at launch; revisit if a regulator or partner requires it (ADR-016 amended) |
| **D13** | App reads p95 < 300 ms; app writes p95 < 800 ms; admin tables p95 < 1 s; uptime 99.5 % at launch → 99.9 %; RPO 15 min (PITR); RTO 4 h (ADR-033; answers BQ-32) |
| **P2** | A live opportunity stays live. Edits are reviewed as a pending **revision** that replaces the live version on approval. The admin review queue shows them as "Revision" |
| **P3** | Keep ADR-030 (one Company Account per company) for launch. The domain `Actor`'s `company` variant carries a permissions list so roles can be added later. Admin company detail shows the single account instead of a team list (ADR-030 confirmed) |
| *(consequence of D1)* | The app surface keeps the API's `/auth/*` routes (ADR-003 option b, Supabase Auth behind a facade). Answers **TQ-02** |

**Still open**

| ID | Question | Options | Blocks |
|---|---|---|---|
| **TQ-28** (D5) | ✅ **RESOLVED 2026-10-11 (later):** Google Workspace via OIDC (ADR-032). *Original:* **Staff identity provider** (ADR-032) | (A) company IdP via OIDC (Google Workspace or Microsoft Entra), MFA enforced by the IdP · (B) separate Supabase project for staff, TOTP required | Phase 0 (admin auth contract), Phase 2 |
| **TQ-29** (D11) | ✅ **RESOLVED 2026-10-11 (later):** no alias needed. *Original:* **Legacy `/api/v1` alias.** Is any store build calling the real API, and is anything live at `backofhouse.space/api`? | (a) no alias needed (no store build calls the real API) · (b) alias for N weeks after the first `/api/app/v1` store build | Phase 0 (alias middleware) |
| **BQ-31** (D10) | **Hosting region and PDPL.** Region for personal data; consent records; retention per data type (BQ-33); breach procedure | — | Phase 1 (environments), production |
| **BQ-76** (P1) | ✅ **RESOLVED 2026-10-11 (later):** points are spent on redeem; level from lifetime earned. *Original:* **Are points spent on redeem?** Conflicts with BQ-08 / BQ-59 (decided: never spent) | (a) spent on redeem; level = lifetime earned points, so spending never lowers a level; supersedes BQ-08 / BQ-59 · (b) never spent; the Rewards and Points screens (app and admin) are flagged for redesign | Phase 6 |
| **BQ-77** (P4) | ✅ **RESOLVED 2026-10-11 (later):** design scale. *Original:* **Points scale.** Hand-off: attendance +150, volunteer shift +200, profile +50. Repo (`points-architecture.md`): meetup 10, workshop 15 | (a) design scale, reward prices as in the designs · (b) repo scale; rescale reward prices and levels to match | Phase 6 |
| **BQ-78** | **Social and phone-code ✅ **RESOLVED 2026-10-11 (later):** email + password and phone SMS code; no social login. *Original:* sign-in.** The Flutter contract (D1) has `/auth/social` (Google) and `/auth/phone/code` + `/auth/phone/verify`; BQ-30 says social login is excluded and BQ-58 (code sign-in) is open | (a) keep both, as in the Flutter contract (supersedes part of BQ-30, answers BQ-58) · (b) remove them from the Flutter contract | Phase 0 (app contract), Phase 2 |
| **BQ-79** | **Students.** ✅ **RESOLVED 2026-10-11 (later):** keep students. *Original:* The Flutter contract (`profile_status = STUDENT`, `STUDENTS_ONLY` for co-op) and the hand-off (`isStudent`, co-op for students only) use students; BQ-72 removed the student concept | (a) restore students (supersedes BQ-72) · (b) remove `STUDENT` and co-op eligibility from both contracts | Phase 0 (app contract), Phase 2, Phase 5 |
| **BQ-80** | **Unverified companies ✅ **RESOLVED 2026-10-11 (later):** JOB needs a verified company, `COMPANY_NOT_VERIFIED`. *Original:* and JOB opportunities.** BQ-73: publishing a JOB requires a verified company. Hand-off: an unverified company only gets a *warning* in automated checks | (a) BQ-73 holds: block submit of a JOB by an unverified company · (b) warning only (supersedes BQ-73) | Phase 5 |

### 2026-09-17 (final): Single Company Account, BQ-68 … BQ-74, RG-28

Full table in `business-rules.md` §20.

| ID | Decision |
|---|---|
| **BQ-68** | A company has one user only (the Company Account); employees and members are Individual accounts related by membership |
| **BQ-69** | Ownership is created / changed only through the company creation / ownership flow and admin rules |
| **BQ-70** | Companies to Watch mixes admin selection, activity-based algorithm and verification / completeness; neutral, not paid, not verification |
| **BQ-71** | Not decided yet |
| **BQ-72** | Student concept removed entirely | ⚠️ **Reversed by BQ-79 (2026-10-11): students are kept.**
| **BQ-73** | JOB has an employment type (confirmed by BQ-80, 2026-10-11) (permanent, temporary, freelance); publishing a JOB requires a verified company |
| **BQ-74** | The company has only one account; the public team shows member Individual accounts |
| **RG-28** | Draft industries list prepared from research; needs business review |

Questions raised:

| ID | Question | Raised by | Blocks |
|---|---|---|---|
| **BQ-75** | **Company membership flow.** How does an individual become a member: the Company Account invites, the individual requests to join, or both? Must the other side confirm? Can a member hide themselves from the public team (their own privacy) in addition to the company hiding them? | BQ-68, BQ-74 | Stage 8 |


### 2026-09-17 (latest): BQ-62 … BQ-67

Full table in `business-rules.md` §19.

| ID | Decision |
|---|---|
| **BQ-62** | PROJECT is not an opportunity; (⚠️ questioned by BQ-81, 2026-10-11) projects are company portfolio work (`company_projects`). Opportunity types: JOB, CO_OP, VOLUNTEERING, SUPPLIER_REQUEST |
| **BQ-63** | Industries are multi-select, for classification / filtering / discovery; no permissions; independent of company type |
| **BQ-64** | Members appear on the public company profile by default; the company can hide specific members (`show_on_company_profile`); public visibility only |
| **BQ-65** | Supplier requests are visible to Company Accounts only; individuals never see them |
| **BQ-66** | Any Company Account can respond to any supplier request; no company-type restriction; individuals cannot respond |
| **BQ-67** | Flexible (non-sequential) application statuses chosen by the company; individual withdrawal under a rule still to be fixed |

Questions raised:

| ID | Question | Raised by | Blocks |
|---|---|---|---|
| **BQ-73** | ✅ **RESOLVED 2026-09-17:** employment type PERMANENT / TEMPORARY / FREELANCE; publishing a JOB requires a verified company (rule BQ-53). *Original:* **JOB details** (left open by BQ-62): does a JOB carry an employment type (permanent, temporary, freelance)? Does publishing a JOB require a verified company (PRD §10.2)? | BQ-62 | Phase 3 |
| **BQ-74** | ✅ **RESOLVED 2026-09-17:** the company has one account; team members are Individual accounts shown from their profiles. *Original:* **Public team section data.** Company team members are COMPANY accounts without an individual profile (BQ-60). What is shown for each visible member (name, job title, photo), and where is it entered? | BQ-64 | Phase 1 |


### 2026-09-17 (later): Clarifications BQ-59, BQ-60, BQ-61 and additional decisions

Full list in `business-rules.md` §18.

| ID | Decision |
|---|---|
| **BQ-59** | Points are not a currency and are never deducted when a Reward is used; points unlock Levels / Rewards / Benefits. Profile Highlight is separate from Verification and Featured / Promoted |
| **BQ-60** | Registration chooses Individual or Company; separate flows and data; **separate security contexts**; the Company Account has its own RBAC; owning a company as an individual grants no Company Account permissions |
| **BQ-61** | A company can have several company types; classification grants no permissions |
| — | Student is an Individual profile attribute; CO_OP is an opportunity type; Featured Companies → **Companies to Watch**; Featured / Promoted reserved for paid placement; verification ≠ classification |

Questions raised:

| ID | Question | Raised by | Blocks |
|---|---|---|---|
| **BQ-68** | ⚠️ **MOSTLY RESOLVED 2026-09-17:** one Company Account per company; members are Individual accounts. **Still open:** can one email or phone hold both an Individual and a Company account? Can an account's type change? Which account type holds Back Of House staff roles? *Original:* **Company Account logins.** Does each company team member have their **own** COMPANY-type login (current design), or is there one shared login per company? Can one COMPANY login manage **several** companies (this reinterprets BQ-03 / BQ-49 for company contexts)? Can the same email or phone hold both an Individual and a Company account? Can an account's type ever change? Which account type holds Back Of House staff roles? | BQ-60 | Stages 4, 6, 8 |
| **BQ-69** | ✅ **RESOLVED 2026-09-17:** ownership only through the creation / ownership flow and admin rules; no individual ownership record. *Original:* **Individual ownership record.** Should "this individual owns company X" be recorded or shown on the individual profile at all (it grants no permissions)? If so, how is it confirmed? | BQ-60 | Phase 1 / 3 |
| **BQ-70** | ⚠️ **MOSTLY RESOLVED 2026-09-17:** mix of admin selection, activity algorithm and verification / completeness; not paid. **Still open:** weights, number of slots, refresh cadence, how long an admin pick lasts. *Original:* **Companies to Watch.** Who selects them (editorial, algorithm), on what criteria, how are they labelled, and is it guaranteed never to be paid? | Decision 2026-09-17 | Phase 1 discovery |
| **BQ-71** | **Profile Highlight benefit.** Which level or points unlock it; automatic or activated by the user; duration; does it change search ranking or only presentation? Does it apply to companies too? | BQ-59 | Phase 2 |
| **BQ-72** | ✅ **RESOLVED 2026-09-17:** ⚠️ **Reversed by BQ-79 (2026-10-11).** student concept removed; CO_OP remains an opportunity type. *Original:* **Student attribute.** What data (institution, expected graduation), is it verified, and does it gate CO_OP applications? | Decision 2026-09-17 | Phase 1 / 3 |


### 2026-09-17: Mandatory business rules received

The full rules are in **`business-rules.md`** (they take precedence over PRD text). Questions they resolve:

| ID | Resolution | Rule |
|---|---|---|
| **BQ-29** | Account types are exactly `INDIVIDUAL` and `COMPANY` | Rules §1 |
| **BQ-02** | Courses are part of the ecosystem (scope resolved). Model and phase still open | Rules §13 |
| **BQ-25** | Application statuses: SUBMITTED → REVIEWED → SHORTLISTED → CONTACT → DECISION (ACCEPTED / REJECTED / WITHDRAWN). Company members decide; the platform never decides | Rules §8 |
| **BQ-51** (partly) | Supplier requests are a B2B workflow between companies (buyer company → supplier companies → `SupplierResponse`). Institutional workspaces, lists and RFIs remain on hold | Rules §7 |
| **BQ-24** (partly) | Opportunities are published by companies; supplier requests by a buyer company | Rules §5, §7 |

Questions raised by the rules:

| ID | Question | Raised by | Blocks |
|---|---|---|---|
| **BQ-59** | ⚠️ **Superseded by BQ-76 (2026-10-11): points are spent on redeem.** ✅ **RESOLVED 2026-09-17:** points are never deducted; they unlock Levels / Rewards / Benefits. *Original:* **Rewards vs BQ-08.** Rule §10 says points "are used for Rewards"; decision BQ-08 says points are "not a redemption currency". Are rewards benefits unlocked by points/levels without spending (current interpretation), or redeemed by spending points? | Rules §10, §13 | Phase 2 |
| **BQ-60** | ✅ **RESOLVED 2026-09-17:** separate security contexts and registration flows; company RBAC independent; ownership grants nothing. Details → BQ-68, BQ-69. *Original:* **Account type meaning.** Is a COMPANY account a person who manages companies (compatible with BQ-03/BQ-49)? May a COMPANY account apply to individual opportunities, or an INDIVIDUAL account create or join a company? Can the account type change later? | Rules §1 | Phase 1 (onboarding) |
| **BQ-61** | ✅ **RESOLVED 2026-09-17:** several types per company; no automatic permissions. *Original:* **Company type.** One type per company or several ("a company can have multiple capabilities")? Is the list fixed in code or admin-managed? | Rules §2 | Phase 1 |
| **BQ-62** | ✅ **RESOLVED 2026-09-17:** PROJECT is not an opportunity (company portfolio only). JOB details → BQ-73. *Original:* **Opportunity type mapping.** PRD `PERMANENT_JOB` / `TEMPORARY_CONTRACT` → `JOB` with an employment-type field? `FREELANCE` → `PROJECT`? Does a JOB still require a verified publisher (PRD §10.2)? | Rules §5 | Phase 3 |
| **BQ-63** | ✅ **RESOLVED 2026-09-17:** multi-select classification, no permissions, independent of company type. *Original:* **Industries** on the company profile: what is an industry, and how does it differ from service categories and company type? | Rules §3 | Phase 1 |
| **BQ-64** | ✅ **RESOLVED 2026-09-17:** shown by default, hideable per member (`show_on_company_profile`). Displayed data → BQ-74. *Original:* **Public team section.** Which members appear on the public company profile, and with whose consent? | Rules §3 | Phase 1 |
| **BQ-65** | ✅ **RESOLVED 2026-09-17:** Company Accounts only. *Original:* **Supplier request visibility.** Can visitors or individual accounts see supplier requests read-only? What "supplier activity" is public on a company profile? | Rules §6, §7 | Phase 3 |
| **BQ-66** | ✅ **RESOLVED 2026-09-17:** any Company Account, no type restriction, no individuals; content and statuses later if needed. *Original:* **Supplier response.** Contents (message, attachments, price?), statuses, whether the buyer shortlists or selects, and whether responding is limited by company type | Rules §7 | Phase 3 |
| **BQ-67** | ⚠️ **PARTLY RESOLVED 2026-09-17:** transitions are flexible; the company chooses any status. **Still open:** the individual's withdrawal rule (from which statuses?), whether ACCEPTED / REJECTED can later be changed, and what happens to undecided applications when an opportunity closes. | Rules §8 | Phase 3 |


### 2026-09-15: Business decisions received

| ID | Question | Decision | How it is applied in the architecture |
|---|---|---|---|
| **BQ-01** | Which clients does the backend serve? | **Web + Flutter mobile, through one backend/API** | One REST API serves both. SEO data endpoints (slugs, sitemap entries) are in Phase 1 scope. Mobile keeps tokens in secure storage; web keeps the session in HttpOnly cookies. Push notifications remain open (RG-14) |
| **BQ-30** | Authentication method | **OTP + Password** | Sign-up with email or phone **and** a password; the identifier is confirmed by a one-time code before the account is active (AUTH-01). Sign-in with password. Password recovery by one-time code. AUTH-04 password policy applies. Social login is **excluded**. Whether OTP-only sign-in is also allowed → **BQ-58** |
| **BQ-03** | Can a user work with more than one company? | **Yes.** A user can be a member of several companies | Many-to-many `organization_members`; the company is always explicit in the URL |
| **BQ-04** | How many owners per company? | **Exactly one owner** | Refined by BQ-68: the owner is the company's single Company Account (`organizations.account_user_id`). OWNER is never assigned through invitations or role changes. Ownership transfer → **BQ-56** |
| **BQ-05** | Who creates a company? | **The company owner creates it** | The creator becomes the single OWNER at creation (T-02) |
| **BQ-05** | Who approves a company? | **An admin reviews and approves** | New `organization_approvals` review (T-29), decided by `SYSTEM_ADMIN`. Approval publishes the listing. Approval criteria and resubmission → **BQ-57** |
| **BQ-06** | Organization types | **No types. Every organization is a company** | `organizations.type` and `OrganizationType` removed; institution roles (BUYER, READER, AUDITOR) removed. The PRD's buyer and government entity features (§5.4, §12, Phase 4) must be re-scoped → **BQ-51** |
| **BQ-07** | What is a "verified professional"? | **Verification is independent of points and levels** | "Verified professional" comes only from approved verifications. Levels are purely points-based; the §9.1 verification gate is removed. Naming of the 500–799 level → **BQ-52** |
| **BQ-08** | Points and rewards | **Points serve levels and benefits only; they are not a redemption currency** | No rewards catalog, redemption tables or point spending, now by decision |
| **BQ-46** | Approval vs. verification | **Separate. Approval does not mean verification** | An approved new company is published as CLAIMED (it has an owner). Verification runs separately through signals |
| **BQ-47** | Company verification | **Several independent verification signals** | Separate verification types for commercial registration, website domain, licenses/certifications and contact details, each with its own lifecycle. Which signals make a company show as VERIFIED → **BQ-53** |
| **BQ-48** | Who performs verification? *(new question supplied with the decisions)* | **Admin / Reviewer only, in Phase 1** | No automated verification decisions in Phase 1; automated checks only assist reviewers. `verification.review` = `VERIFICATION_REVIEWER`, `SYSTEM_ADMIN` |
| **BQ-49** | Can a user own more than one company? *(new question supplied with the decisions)* | **Yes** — ⚠️ superseded by BQ-68: each company has its own single Company Account | No per-user limit on OWNER memberships. The one-owner rule applies per company, not per user |

> **Renumbering.** Two IDs in the decision list named different questions from the ones filed earlier under those numbers. Your numbering is kept:
> the earlier **BQ-48** (editing published projects) is now **BQ-54**, and the earlier **BQ-49** (competing claims) is now **BQ-55**.

### New questions raised by these decisions

| ID | Question | Raised by | Blocks |
|---|---|---|---|
| **BQ-51** | **Buyer and government entities without organization types.** The PRD's buyer journey (§5.4), institutional membership for government and contracting entities (§12), the `SUPPLIER_REQUEST` opportunity publisher (§10.2), MFA for "entities" (AUTH-03), the `ENTITY_REPRESENTATIVE` account type (§5.1) and the pilot buyers (§1.2, §22, BQ-26) all assume non-company organizations. Now that every organization is a company: are buyer features used **by companies** (e.g. contractors and organizers)? Are government entities out of scope? Or will they be modelled differently later? | BQ-06 | Phase 4 (and the Phase 1 pilot scope) |
| **BQ-52** | **The 500–799 level** is named "محترف موثّق" (verified professional) in §9.1 and gated on verification. With verification independent of levels, what is this level called? | BQ-07 | Phase 2 |
| **BQ-53** | **Company VERIFIED status.** With independent signals, which signal or combination makes a company show as `VERIFIED` (and match the "verified" search filter)? Or is `VERIFIED` replaced by per-signal badges? When is a company `UNDER_VERIFICATION`? | BQ-47 | Phase 1 |
| **BQ-56** | **Ownership transfer.** With exactly one owner: how is ownership transferred (by the owner, admin-only, with verification)? What happens when the owner leaves, is suspended or deletes the account? | BQ-04 | Phase 1 |
| **BQ-57** | **Company approval details.** What does the admin check before approving (duplicates, sector fit, mandatory fields, documents)? Can a rejected company be edited and resubmitted? Do imported companies and approved claims skip this approval? | BQ-05, BQ-46 | Phase 1 |
| **BQ-58** | **Sign-in options.** ✅ **RESOLVED 2026-10-11 by BQ-78:** password sign-in, plus phone SMS-code sign-in; no code as a second step. *Original:* With OTP + password: is sign-in by password only, or may users also sign in with a one-time code? Is a code required at every sign-in as a second step? | BQ-30 | Phase 1 |

---

## 1. Business decisions

### 1.1 Scope and phasing conflicts (highest priority)

| ID | Question | Evidence | Blocks | Architectural impact |
|---|---|---|---|---|
| **BQ-01** | ✅ **RESOLVED 2026-09-15:** Web + Flutter mobile through one API (see §0). *Original question:* The existing frontend (`BackOfHouse-frontend`) is a **native Flutter mobile app** (Android/iOS). PRD §2.2 puts a native mobile app *out of scope* for the first launch, and PRD §19 describes an SSR/SEO web frontend. Which clients does the backend serve in Phase 1: mobile, web, or both? | PRD §2.2, §17 (SEO), §19; frontend README | Phase 1 | SEO endpoints (sitemaps, slugs, canonical data) are needed only if there is a web client. Push notifications are needed only for mobile. Auth token handling differs (secure storage vs. cookies). |
| **BQ-02** | ✅ **Scope resolved 2026-09-17** (courses are part of the ecosystem, rules §13); model and phase still open. *Original question:* The frontend has **Courses** screens and a `/courses` endpoint. The PRD never defines courses. It mentions workshops as events (§8.2, "ورشة") and training as a contribution (§8.2, §8.3). Are courses in scope? In which phase? Are they events, content, or a new domain? | Frontend `ApiEndpoints.courses`; PRD has no match | Phase 1 (frontend expectation) | **Not modelled.** No table or endpoint exists until decided. |
| **BQ-26** | PRD §1.2 targets **3 pilot buyer entities by day 90**, and §22 runs a closed pilot with **2 buyer entities** before the public launch. But institutional workspaces, supplier lists and RFIs are **Phase 4** (§6, §26). Which buyer capabilities exist in the Phase 1 pilot? | §1.2, §22, §6 Phase 4 | Phase 1 | Organization types were removed (BQ-06), so this now depends on **BQ-51**. |
| **BQ-27** | The professional directory is in **Phase 3** (§6), but the quarterly roadmap puts it in **Q2** next to memberships, points and events (§29.3). The "verified professionals: 300 at 6 months" KPI (§1.2) also suggests Q2. Which is authoritative? | §6, §29.3, §1.2 | Phase 2/3 | Moves the `talent` module earlier or later. |
| **BQ-28** | The observatory is "ongoing after month 10" (Phase 5, §6), but Q4 lists an "initial observatory" (§29.3). | §6, §29.3 | Phase 4/5 | Planning only. |

### 1.2 Identity, accounts, and organizations

| ID | Question | Evidence | Blocks | Impact |
|---|---|---|---|---|
| **BQ-29** | ✅ **RESOLVED 2026-09-17:** `INDIVIDUAL` and `COMPANY` only (rules §1); meaning → BQ-60. *Original:* **Account types differ.** (`ENTITY_REPRESENTATIVE` also depends on BQ-51.) The PRD has interested, student, professional, company representative and entity representative (§5.1). The frontend has `professional`, `company`, `student` and `other`. Which list is canonical? Does the account type change **permissions**, or does it only drive onboarding? | §5.1; frontend `MemberType` | Phase 1 | `AccountType` enum. **ASSUMPTION:** onboarding and personalisation only; it never grants permissions. |
| **BQ-30** | ⚠️ **BQ-78 (2026-10-11): social login stays excluded; phone SMS-code sign-in added.** ✅ **RESOLVED 2026-09-15:** OTP + password; no social login; sign-in options → BQ-58. *Original question:* **Registration method differs.** The PRD specifies email **or** phone with a one-time code (AUTH-01); passwords are optional (AUTH-04: "*when* a password is used"). The frontend registers with full name + email + phone + **password**, and has `forgot-password` and **social login** endpoints. Is password login required? Is social login in scope? Must phone **and** email both be collected? | AUTH-01, AUTH-04; frontend `ApiEndpoints` | Phase 1 | Auth provider configuration and the frontend auth contract. |
| **BQ-03** | ✅ **RESOLVED 2026-09-15:** Yes. ⚠️ Refined by BQ-68: an **Individual** may be a member of several companies (membership grants no permissions); a Company Account manages exactly one company. *Original question:* Can one user belong to **multiple organizations** (e.g. a consultant working with two companies, or a company employee who is also a buyer-entity user)? | Not stated; §3, §4 | Phase 1 | Many memberships per user; the API always names the company explicitly. |
| **BQ-04** | ✅ **RESOLVED 2026-09-15:** Exactly one owner per company; transfer → BQ-56. *Original question:* How many **owners** can an organization have? The PRD calls the owner "the primary representative" (§3). Is there an **ownership transfer** process? | §3, §5.2 | Phase 1 | Partial unique index: one active OWNER per company. |
| **BQ-05** | ✅ **RESOLVED 2026-09-15:** The owner creates the company; an admin reviews and approves it. *Original question:* When a user **creates a new company** (§5.3), are they its owner **before** verification (so they can edit the draft), or only after approval? | §5.3 | Phase 1 | Creator = OWNER of the DRAFT; `organization_approvals` + T-29. |
| **BQ-06** | ✅ **RESOLVED 2026-09-15:** No types; every organization is a company. Consequences → BQ-51. *Original question:* **Organization kinds.** Is a buyer (procurement office, organizer, contractor, §3) a separate kind of organization, or can an event **company** also act as a buyer? Is the observer entity (جهة مطّلعة) an account at all? Is a research/data partner an organization? | §3, §12 | Phase 1 (schema) / Phase 4 (features) | `OrganizationType` removed. |
| **BQ-07** | ✅ **RESOLVED 2026-09-15:** Verification is independent of points and levels; level naming → BQ-52. *Original question:* **What is a "verified professional"?** §3 defines it as identity and experience verified. §9.1 defines it as a **level**: 500–799 points **plus** verification. Can someone with 120 points and verified identity appear as a verified professional? | §3, §9.1 | Phase 2/3 | Decides whether "verified professional" is a verification state, a level, or both. The architecture keeps verification facts and levels separate either way. |
| **BQ-31** | ⚠️ **Still open, now D10 (2026-10-11), blocks Phase 1:** also covers consent records, retention per data type (BQ-33) and the breach procedure. *Original:* **Data residency.** PDPL compliance is required (§18). Is the Supabase region you choose acceptable for personal data under PDPL cross-border transfer rules? | §18 | Production | Supabase project region; may affect the whole hosting choice. |
| **BQ-45** | Which **legal entity** owns contracts, data and invoices? The PRD says this must be decided before production (§27). | §27 | Phase 2 (invoices), production | Terms and consent versions, invoice issuer. |
| **BQ-43** | ⚠️ **Superseded by BQ-51** (no institution organizations). *Original question:* Institutional accounts need **automatic expiry and periodic review** (§12.3). What durations and review cadence? | §12.3, §18 | Phase 4 | `organization_members.expires_at`, review jobs. |
| **BQ-42** | ⚠️ **Superseded by BQ-51** (institution roles removed with BQ-06). *Original question:* The **institutional roles** (owner, buyer, analyst, reader, auditor, §12.1) have no permission matrix. §4 covers only company roles plus one "buyer entity" column. | §4, §12.1 | Phase 4 | Permission catalog for institution roles. |

### 1.3 Directory, projects, verification

| ID | Question | Evidence | Blocks | Impact |
|---|---|---|---|---|
| **BQ-20** | After how long does a profile count as **stale** (ORG-08 last-update alert → `NEEDS_UPDATE`)? | ORG-08, §29.1 | Phase 1 | Scheduler rule. |
| **BQ-21** | Value lists are not defined for: **company size ranges**, **operational capacity dimensions and ranges** (ORG-06), **legal entity types** (ORG-01), **coverage scope**, **project types**, the **company's role in a project**, and **project size**. | ORG-01/03/06, §7.3 | Phase 1 | Lookup data / enums. **ASSUMPTION:** stored as admin-managed codes until defined. |
| **BQ-22** | **Client confirmation** for projects (`CONFIRMED` client state, §7.3): who confirms, and how? The client may not be on the platform. | §7.3 | Phase 1 | A verification type `PROJECT_CLIENT` is reserved; the workflow is undefined. |
| **BQ-23** | **Verification expiry.** How long is each type of verification valid (the `EXPIRED` state, §29.1)? Is verification free, or tied to a plan? | §29.1, §27 | Phase 1 | `verifications.expires_at` rules. |
| **BQ-14** | ⏸ **Deferred with monetization** (rules §11). *Original:* **Pricing vs. trust conflict.** §27 recommends the plans "free listing + **verified** + featured + institutional". If "verified" is a *paid tier*, that conflicts with §7.5 and §8.1: paid status must not affect trust, and sponsorship must not buy credibility. Is verification a paid product? Also: who subscribes, organizations only or individuals too (§21 says "100 **paid members**")? | §27, §7.5, §8.1, §21 | Phase 2 | Subscriber model (organization vs. user) and a firm rule that `entitlements` never write trust. |
| **BQ-46** | ✅ **RESOLVED 2026-09-15:** Approval and verification are separate. *Original question:* **Approval vs. verification.** When a reviewer approves a *new* company's documents (§5.3: "publish the basic listing after acceptance"), is the company **VERIFIED**, or only published as CLAIMED, with verification as a later step? The same question applies to claim approval (§5.2), which also checks the commercial registration. | §5.2, §5.3, §29.1 | Phase 1 | Approved new company → CLAIMED; approved claim → CLAIMED; VERIFIED rule → BQ-53. |
| **BQ-47** | ✅ **RESOLVED 2026-09-15:** Several independent signals. *Original question:* **Company trust signals** (§8.3: commercial registration, domain, licenses, contact confirmation) versus the single company verification. Is each signal verified separately (and does each earn its own trust points), or is there one combined company verification? | §8.3 | Phase 1 (verification types) | Signal types `ORGANIZATION_REGISTRATION`, `ORGANIZATION_DOMAIN`, `ORGANIZATION_CREDENTIAL`, `ORGANIZATION_CONTACT`. |
| **BQ-54** | *(formerly BQ-48)* Does editing a **PUBLISHED project** send it back to review? Can a **REJECTED** project be resubmitted? | §7.3, §29.1 | Phase 1 | Project state machine. |
| **BQ-55** | *(formerly BQ-49)* **Competing claims.** If several users claim the same company and one claim is approved, are the other open claims rejected automatically, or left for a reviewer? | §5.2 | Phase 1 | T-01. **ASSUMPTION:** left open for reviewer rejection with a reason. |
| **BQ-50** | **Merging memberships.** When two companies merge (ORG-09) and a user is a member of both, which role wins? Each company has exactly one owner (BQ-04): which owner keeps the merged company? | ORG-09 | Phase 1 | T-03. |
| **BQ-39** | Who reviews **projects**: verification reviewers or content moderators? §13 and §23 say "content/verification". (BQ-48 covers verification cases only.) | §13, §23 | Phase 1 | Permission `project.review` assignment. |
| **BQ-41** | What can be **appealed** (§13 companies: "objections"; §8.6 points appeals)? Verification decisions, status changes, merges, point entries, comparisons? | §8.6, §13, §24 | Phase 1/2 | `appeals.subject_type` values. |
| **BQ-35** | The company report metric **"saves"** (§11.2): who can save a company? Any signed-in user (bookmarks), or only institution supplier lists (§12.1)? | §11.2, §12.1 | Phase 1 (to capture the data early) | A possible `bookmarks` feature. **Not modelled** until decided. |
| **BQ-34** | **User-generated community content.** "Accepted content 8 points", "helpful answer", "interaction" and "mutual recommendations" (§3, §8.2, §8.6) imply posts, Q&A or endorsements. None are specified. In scope? Which phase? | §3, §8.2, §8.6 | Phase 2+ | **Not modelled.** |
| **BQ-33** | **Retention periods** for soft-deleted records, audit logs, analytics events, verification documents and generated reports (§14.1, §18). | §14.1, §18 | Production | Purge jobs, partitioning. |
| **BQ-32** | ✅ **RESOLVED 2026-10-11 (D13):** RPO 15 min (PITR), RTO 4 h (ADR-033). *Original:* **RPO/RTO targets**, which must be defined before production (§17). | §17 | Production | Supabase PITR vs. daily backups. |

### 1.4 Membership, points, events

| ID | Question | Evidence | Blocks | Impact |
|---|---|---|---|---|
| **BQ-08** | ⚠️ **Superseded by BQ-76 (2026-10-11): points are spent on redeem.** ✅ **RESOLVED 2026-09-15:** Points serve levels and benefits only; never redeemable. ⚠️ Rules §10 mention "Rewards" → **BQ-59**. *Original question:* **Rewards and redemption.** The PRD has no concept of *spending* points. Levels give benefits (§9.1), and Phase 2 lists "coupons & perks" (قسائم ومزايا). Are points ever redeemable? Are "perks" partner benefits unlocked by level, or billing coupons only? | §6 Phase 2, §7.5, §9.1 | Phase 2 | No rewards catalog, redemption tables or point spending (by decision). |
| **BQ-09** | Which balance ✅ **RESOLVED 2026-10-11 by BQ-76:** level from lifetime earned points. *Original:* determines a member's **level** (§9.1)? All categories combined, or activity only? §8.1 says activity and trust have separate balances. Do penalties lower a level? | §8.1, §9.1 | Phase 2 | Level evaluation query. |
| **BQ-10** | Point values ⚠️ **Partly answered by BQ-77 (2026-10-11):** design scale for attendance, volunteer shift, profile and referral. *Original:* and caps not given: **contribution** activities (volunteering, training, helpful answer, initiative), the **weekly cap** for activity, **daily caps**, and the 15–30 range for a documented project. | §8.2, §8.6 | Phase 2 | Seed data for `point_rule_versions`. |
| **BQ-11** | The **professional visibility formula** (§8.4) has weights but no maximums per component. For companies, the maximums come from §8.3. How are individual components normalised? | §8.3, §8.4 | Phase 2 | Visibility calculator. |
| **BQ-12** | **Top-10 projects** in visibility: what are the recency and verification weights (§7.3)? | §7.3 | Phase 2 | Visibility calculator. |
| **BQ-13** | **Who can see detailed points?** §18.1 classifies "detailed points" as **Internal** (authorised staff only). What do members and companies see: total, level, badges, or the breakdown? | §18.1 | Phase 2 | Response shape of `/me/points`. **ASSUMPTION:** users see totals, level and badges only. |
| **BQ-40** | **Ambassador** level requires "nomination + administrative approval" (§9.1). Who nominates? | §9.1 | Phase 2 | Level assignment workflow. |
| **BQ-15** | ⏸ **Deferred with monetization** (rules §11). *Original:* Billing details: billing **intervals**, **proration** for immediate upgrades, **grace period** length, **trial** length, and **suspension**. §7.5 mentions suspension, but the subscription status list in §29.1 has no suspended state. | §7.5, §29.1 | Phase 2 | Subscription state machine. |
| **BQ-16** | Tickets: are events **paid**? "Eligibility linked to membership" (§9.2): does membership mean a **subscription plan** or a **member level**? | §9.2 | Phase 2 | `event_ticket_types` eligibility fields; payments for tickets. |
| **BQ-17** | **Who creates events?** §13 places event management in the admin panel (staff). Can companies or partners host events ("hosting" counts as contribution, §8.3)? Which **staff role** runs check-in? Only four staff roles exist (§3). | §3, §8.3, §13 | Phase 2 | Permission catalog; event ownership columns. |
| **BQ-18** | **Event lifecycle states** are not defined (§29.1 has no event row). | §29.1 | Phase 2 | `EventStatus`; a proposal is in `enums-and-statuses.md`. |
| **BQ-19** | **Attendance certificate** eligibility (§9.2) and the post-event **survey** questions. | §9.2 | Phase 2 | Certificate issuance rule. |
| **BQ-36** | ⏸ **Deferred with monetization** (rules §11, §12: always separate from verification). *Original:* **Paid visibility / sponsored placement**: where does it appear, how is it labelled, and how is it sold (§7.5, §8.3)? | §7.5, §8.3, §24 | Phase 2 | Kept out of trust and organic ranking; mechanics undefined. |

### 1.5 Opportunities, intelligence, institutional

| ID | Question | Evidence | Blocks | Impact |
|---|---|---|---|---|
| **BQ-24** | **Who may publish opportunities** inside an organization (not in the §4 matrix)? What is an **"approved partner"** for volunteering opportunities (§10.2)? Who publishes `SUPPLIER_REQUEST` now that buyer entities are not organizations (→ BQ-51)? | §4, §10.2 | Phase 3 | Permission `opportunity.manage`. |
| **BQ-25** | ✅ **Statuses resolved 2026-09-17** (rules §8); outcomes and applicant-data visibility still open. *Original:* **Application statuses** and **closure outcomes** are not listed. Who inside a company can see applicant data? What makes messaging "controlled" (§6 Phase 3)? | §6, §10.3 | Phase 3 | `ApplicationStatus`, `OpportunityOutcome`, message rules. |
| **BQ-37** | **Benchmark sets:** can the 3 competitors be *any* listed company? Is the compared company notified? What happens to the set when the plan is downgraded? | §11.1 | Phase 4 | Benchmark rules. |
| **BQ-38** | **Export limits:** "limited" and "limited & monitored" (§4) have no numbers. What watermark format (§20.2)? | §4, §12.3, §20.2 | Phase 4 (Phase 1 for any company export) | Export quotas stored as plan features. |

---

## 2. Technical decisions

Recommendations are provisional until recorded as **Accepted** in `architecture-decisions.md`.

| ID | Decision needed | Recommendation | ADR |
|---|---|---|---|
| **TQ-01** | Supabase Auth vs. custom NestJS authentication | **Supabase Auth** for authentication. NestJS owns all authorization. | ADR-003 |
| **TQ-02** | ✅ **RESOLVED 2026-10-11 (D1):** NestJS `/auth/*` facade over Supabase Auth, as in the Flutter contract (ADR-003 amended). *Original:* Where auth flows run: Flutter talks to Supabase Auth directly, or NestJS proxies `/auth/*` (the frontend currently expects `/auth/login`, `/auth/register`, `/auth/refresh`) | Client-direct Supabase SDK; NestJS provides `/me` and onboarding. Needs a frontend change; confirm with the frontend team. | ADR-003 |
| **TQ-03** | MFA factor for sensitive roles (AUTH-03) | TOTP (Supabase MFA). Enforce `aal2` in NestJS for staff roles. MFA for "entities" (AUTH-03) → BQ-51. | ADR-003 |
| **TQ-04** | SMS provider for Saudi numbers (OTP) | ⚠️ **Required at launch by BQ-78 (2026-10-11):** must serve Saudi numbers with sender-ID registration. Open. Saudi-registered sender via the Supabase *Send SMS* auth hook. Provider chosen by business. | ADR-003 |
| **TQ-05** | ✅ **RESOLVED 2026-10-11 (D2):** snake_case on both surfaces (ADR-019). *Original:* API JSON casing: the frontend parses `snake_case` (`full_name`, `access_token`, `is_verified`) | Agree one casing with the frontend **before the first endpoint**. | ADR-019 (Open) |
| **TQ-06** | ✅ **RESOLVED 2026-10-11 (D4):** app surface `page` / `page_size` / `has_more` (Flutter contract); admin `page` / `page_size` / `sort` with `total`. *Original:* Pagination: PRD asks for "stable pagination" (§15.1); the frontend uses page numbers + `hasMore` | Cursor (keyset) pagination for public and user lists; offset for admin tables. | ADR-008 |
| **TQ-07** | ✅ **RESOLVED 2026-10-11 (D3):** `{code, message, trace_id, errors}` + catalog `docs/error-codes.md`. *Original:* Response and error envelope | `{ data, meta }` for success; `{ code, message, trace_id, errors }` for errors (fits the frontend's parser); HTTP 422 for validation. | ADR-008 |
| **TQ-08** | Background job runner | **pg-boss** (queue inside Postgres; no Redis). Revisit if throughput requires it. | ADR-010 |
| **TQ-09** | Hosting platform for the NestJS service | Undecided. Affects IPv4/IPv6 database connectivity, secrets manager, WAF/CDN (§19). | ADR-023 (Open) |
| **TQ-10** | Malware scanning of uploads (§18) | Quarantine bucket + scanner worker (ClamAV container or a managed scanning API). | ADR-009 |
| **TQ-11** | Encryption of sensitive documents beyond storage-level encryption at rest | Private bucket + short-lived signed URLs from day 1. App-level envelope encryption for identity documents is decided before the identity-verification launch. | ADR-009 |
| **TQ-12** | Arabic search (alef/hamza normalisation, §7.4) | PostgreSQL FTS + `pg_trgm` + custom normalisation function on a **public-only projection table**. Check that the PostgreSQL `arabic` text-search configuration exists on the Supabase version. | ADR-012 |
| **TQ-13** | Company point components that are *computed* (profile completion ≤100, projects ≤300) vs. a ledger that must record every movement (§8.1) | Recompute the score, then write the **difference** to the ledger as an entry. | ADR-014 |
| **TQ-14** | Visibility score recompute cadence | On relevant events (debounced) + nightly full recompute for decay. | ADR-014 |
| **TQ-15** | Analytics event storage volume | First-party `analytics_events` table, partitioned by month, forwarded to a product-analytics provider. | ADR-017 |
| **TQ-16** | Rate-limit storage with more than one API instance | Start with a single instance + in-memory throttler; Postgres-backed store when scaling out. | ADR-013 |
| **TQ-17** | Organization status: one PRD enum vs. separate claim/verification flags | Store the PRD enum; derive it from stored facts (approved, owner, verification signals per BQ-53, stale). | ADR-018 |
| **TQ-18** | ⏸ Deferred (rules §11: no payment infrastructure now). Saudi payment gateway + ZATCA e-invoicing (§15.2) | Provider selection is a management decision (§27). Integrate behind a `PaymentGateway` port. | Phase 2 |
| **TQ-19** | Metric store for Phase 4 reports | Postgres tables first (`metric_facts`); analytics warehouse only when volume demands (§19). | Phase 4 |
| **TQ-20** | PDF/Excel generation (§15.2 Phase 4) | Decide in Phase 4. | Phase 4 |
| **TQ-21** | Idempotency key storage and time-to-live (§15.1) | `idempotency_records` table, 24 h time-to-live, scoped per user + route. | ADR-008 |
| **TQ-22** | UUID v7 support in the pinned Prisma + Postgres versions | Check at project setup; fall back to `gen_random_uuid()`. | ADR-005 |
| **TQ-23** | Prisma major-version specifics (config file, driver adapter, pooler parameters) | Pin the version at setup and record it in ADR-002. | ADR-002 |
| **TQ-24** | Outbound webhook signing (Phase 5, §15.1) | HMAC-SHA256 with timestamp. | Phase 5 |
| **TQ-25** | Field-level visibility (ORG-10, §10.1 per-section privacy) | Per-row `is_public` on child records + a validated `field_visibility` JSONB on the parent. | database-design-rules |
| **TQ-26** | Error-message localisation | Backend returns stable **codes**; clients localise (the frontend already does). | ADR-008 |
| **TQ-27** | Unique-visitor identifier (§16.1) | Random time-limited ID (cookie or app-install ID); no fingerprinting. | ADR-017 |
| **TQ-28** | Staff identity provider (D5) | ✅ **RESOLVED 2026-10-11:** Google Workspace via OIDC. (A) company IdP via OIDC, MFA by the IdP (preferred) · (B) separate Supabase project with TOTP. Never the member pool. | ADR-032 (Open) |
| **TQ-29** | Legacy `/api/v1` alias for installed app builds (D11) | ✅ **RESOLVED 2026-10-11:** not needed. Skip if no store build calls the real API; otherwise alias for N weeks with `Deprecation`/`Sunset` headers. | ADR-031 |

---

## 3. Requirement gaps

| ID | Feature | What is missing | PRD | Phase |
|---|---|---|---|---|
| **RG-01** | Event schedule, speakers, sponsors | Agenda structure; whether speakers and sponsors are platform users and organizations | §9.2 | 2 |
| **RG-02** | Waitlist and ticket transfer ("استبدال") | Promotion order, deadline, whether a transfer needs approval | §9.2 | 2 |
| **RG-03** | ⏸ Deferred (rules §9). Matching (Phase 3) and match notifications (§26) | Matching criteria, scoring, frequency | §6, §26 | 3 |
| **RG-04** | RFIs (طلبات المعلومات) | Contents, response format, deadlines, statuses | §5.4, §12.1 | 4 |
| **RG-05** | Surveys (event, opportunity for both parties) | Questions, anonymity, satisfaction scale | §9.2, §10.3 | 2/3 |
| **RG-06** | Anti-abuse: "mutual recommendations" and "linked accounts" | No recommendation feature exists; account-linking signals undefined | §8.6 | 2 |
| **RG-07** | User merge (admin → users → "merge") | When users are merged and what happens to memberships, points and verifications | §13 | 1 |
| **RG-08** | Duplicate detection (ORG-09) | Matching rules and thresholds (legal name, trade name, CR, domain, §5.3) | ORG-09, §5.3 | 1 |
| **RG-09** | Data import (§22) | Source file format, column mapping, source system identifiers | §22.1 | 1 |
| **RG-10** | ⏸ Deferred (rules §11). Plan features and limits | Concrete feature keys and semantics (users, reports, competitors, export, opportunities) | §7.5 | 2 |
| **RG-11** | ⏸ Deferred (rules §11). Coupons | Type (percentage/fixed), scope, usage limits, stacking | §7.5 | 2 |
| **RG-12** | Metric definitions | Formulas for each indicator in §11.2 | §11.2 | 4 |
| **RG-13** | Anonymous benchmarks | Definitions of "size" and "region" groups; the "top 25%" calculation | §11.1 | 4 |
| **RG-14** | Notification catalog | Which events notify whom, on which channel; push notifications for the Flutter app (mobile confirmed by BQ-01) | §6, §13 | 1 |
| **RG-15** | Content management | Content types beyond pages/news, fields, workflow, news categories (frontend has `/news/categories`) | §13 | 1 |
| **RG-16** | Badges | Catalog and award criteria | §6 Phase 2 | 2 |
| **RG-17** | Account suspension, deletion and data export (AUTH-06, "later") | Grace periods, anonymisation rules, export format | AUTH-06, §18 | Later |
| **RG-18** | Institutional access log (§12.1) | Which reads are logged (profile views? searches?). Scope depends on BQ-51 | §12.1 | 4 |
| **RG-19** | Partner API (Phase 5) | Everything | §15.2 | 5 |
| **RG-20** | "Invite a company to update its data" (§12.1) | Workflow and whether it is a kind of RFI | §12.1 | 4 |
| **RG-21** | Reviewer "suggest correction" (§4) | Workflow, and what happens when the owner ignores it | §4 | 1 |
| **RG-22** | Level benefits | "Priority for some activities" and "highlighting contributions" are not defined | §9.1 | 2 |
| **RG-23** | Contribution evidence | How volunteering, training and initiatives are confirmed ("review or confirmation") | §8.2 | 2 |
| **RG-24** | Company "recent activity" component | Time window; how "responsiveness" is measured | §8.3 | 2 |
| **RG-25** | Consent purposes | List of processing purposes requiring consent (§5.1, §18) | §5.1, §18 | 1 |
| **RG-26** | Abuse reports (بلاغات) | Report categories, resolution actions, penalties | §13, §23 | 1 |
| **RG-28** | Industries list | ⚠️ Draft list prepared 2026-09-17 (`business-rules.md` §20); needs business review before seeding | BQ-63 | 1 |
| **RG-27** | Export watermark | What the watermark contains and where it is applied | §20.2 | 4 |

---

## 4. Internal inconsistencies in the PRD (recorded, not resolved)

| # | Inconsistency | Where | Architecture stance |
|---|---|---|---|
| I-1 | Company statuses: ORG-07 lists 6 states; §29.1 lists 8 (adds *needs update*, *archived*). | §7.2 vs §29.1 | Use the §29.1 superset. |
| I-2 | Project statuses: §7.3 has no *rejected*; §29.1 does. | §7.3 vs §29.1 | Use the §29.1 superset. |
| I-3 | Verification statuses: §5.1 says *draft / under review / needs changes / verified / rejected*; §29.1 says *not started / in review / needs info / approved / rejected / expired*. | §5.1 vs §29.1 | Use §29.1; map *draft* to `NOT_STARTED`. |
| I-4 | Subscription *suspension* mentioned (§7.5) but absent from subscription statuses (§29.1). | §7.5 vs §29.1 | Not added; see BQ-15. |
| I-5 | Directory timing (Phase 3 vs Q2) and observatory timing (Phase 5 vs Q4). | §6 vs §29.3 | See BQ-27, BQ-28. |
| I-6 | Buyer pilot in Phase 1 vs institutional features in Phase 4. | §1.2, §22 vs §6 | See BQ-26, BQ-51. |
| I-7 | API style: PRD §15.1 allows "REST or GraphQL"; this project chose REST. | §15.1 | Recorded in ADR-008. |
| I-8 | Business decisions deliberately override PRD text: native mobile app in launch scope (§2.2 vs BQ-01); no entity organizations (§12, §14 "companies **and entities**" vs BQ-06); no verification gate on levels (§9.1 vs BQ-07); verification decisions human-only in Phase 1 (§5.2 automated matching vs BQ-48). | §2.2, §5.2, §9.1, §12, §14 | Decisions win; PRD text kept for traceability. |
| I-10 | PRD §4 company roles (owner / editor / analyst, delegation) and AUTH-05 role-scoped team invitations are replaced by one Company Account per company with Individual members (BQ-68). | §4, AUTH-05 | Decision wins. |
| I-9 | Mandatory rules (2026-09-17) override PRD text: 2 account types (§5.1 has 5); opportunity types JOB/CO_OP/VOLUNTEERING/SUPPLIER_REQUEST (§10.2 has 6); billing and payments deferred (§6 Phase 2, §7.5); controlled messaging deferred (§6 Phase 3). | §5.1, §6, §7.5, §10.2 | `business-rules.md` wins. |
