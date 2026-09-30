# Back Of House — Business Rules & Implementation Constraints

Use the following decisions as **mandatory business rules and architecture constraints** for all future implementation, UI, frontend logic, API contracts, database models, permissions, and feature development.

Do not introduce alternative business rules or assumptions unless explicitly approved.

---

## 1. Account Types

Back Of House has only **two account types**:

* `INDIVIDUAL`
* `COMPANY`

Do NOT create separate account types such as:

* Supplier User
* Event Organizer User
* Agency User
* Venue User
* Service Provider User

These are **company classifications**, not account types.

---

## 2. Company Types

A Company has a `companyType` / classification.

Examples may include:

* `EVENT_ORGANIZER`
* `SUPPLIER`
* `VENUE`
* `PRODUCTION`
* `AGENCY`
* `SERVICE_PROVIDER`
* `OTHER`

Company type is primarily used for:

* Classification
* Discovery
* Filtering
* Profile presentation
* Business-specific UX

Company type must NOT automatically define all permissions.

A company can have multiple capabilities depending on the product rules.

---

## 3. Company Profile

A Company is not just an account that posts jobs.

The Company Profile is a professional business identity.

It should support, where applicable:

* Company information
* About
* Company type
* Services
* Industries
* Projects / portfolio
* Team
* Events
* Opportunities
* Jobs
* Supplier activity
* Contact information

The architecture must allow these sections to evolve independently.

---

## 4. Company Projects / Portfolio

Companies must be able to add projects they have previously worked on.

A project is **NOT** an Opportunity and is **NOT** a Job.

Create a separate Company Project / Portfolio domain.

Conceptually:

Company
→ Company Projects

A project may contain fields such as:

* Title
* Description
* Location
* Date / period
* Category
* Services provided
* Images / media
* Client name (optional)
* Other relevant metadata

Do not require a client name because some projects may be confidential.

Projects are part of the company's credibility and professional identity.

---

# 5. Opportunity Model

Use a unified Opportunity concept instead of creating separate unrelated systems for every opportunity type.

Supported opportunity types:

* `JOB`
* `PROJECT`
* `CO_OP`
* `VOLUNTEERING`
* `SUPPLIER_REQUEST`

The frontend should preferably use reusable Opportunity components and templates rather than creating completely separate screens for every type.

The content and available actions can change based on `opportunityType`.

---

## 6. Opportunity Audience

Opportunity visibility must respect the intended audience.

Examples:

### Individual-facing opportunities

* Jobs
* Co-op Training
* Volunteering
* Individual Projects where applicable

### Company-facing opportunities

* Supplier Requests

Do NOT show Supplier Requests as normal job opportunities to Individuals.

---

# 7. Supplier Requests

Supplier Requests are a **B2B workflow**.

The intended flow is:

Buyer Company
→ Supplier Request
→ Supplier Companies
→ Supplier Response

A Supplier Request is NOT an Individual Job Application.

Individuals must not be able to apply to Supplier Requests.

Do not model Supplier Requests as normal Individual Applications.

If the business later requires company responses, use a separate concept such as:

`SupplierResponse`

or an equivalent B2B response model.

---

# 8. Individual Applications

Individuals can apply to eligible individual-facing opportunities.

The application lifecycle must use ONE consistent status model across the application.

Use:

`SUBMITTED`
→ `REVIEWED`
→ `SHORTLISTED`
→ `CONTACT`
→ `DECISION`

Decision may then resolve to statuses such as:

* `ACCEPTED`
* `REJECTED`
* `WITHDRAWN`

Do not create competing status systems such as:

`SENT → REVIEW → SHORTLIST → INTERVIEW → OFFER`

unless this is explicitly approved as a future extension.

The Back Of House platform connects individuals and companies but does not make the employer's hiring decision.

The Company is responsible for reviewing applicants and making the final decision.

---

# 9. Company Opportunity Management

Companies must eventually be able to:

* Create opportunities
* Edit opportunities
* Publish opportunities
* View their opportunities
* View applicants / responses
* Review applicants
* Shortlist applicants where applicable

For the initial implementation, keep the workflow intentionally simple.

Do NOT implement unnecessary advanced recruitment functionality unless explicitly requested.

Examples of features that should remain future scope unless approved:

* Interview scheduling
* Full messaging system
* Offer management
* Advanced recruitment pipelines
* Recruitment analytics

The architecture should remain extensible without implementing these systems now.

---

# 10. Verification, Points and Monetization Must Remain Separate

These concepts must never be treated as the same thing.

### Verification

Represents a company's or professional's verification state.

### Points

Represent user activity / engagement and are used for Rewards.

### Paid Visibility / Monetization

Represents commercial features purchased by companies.

Never grant verification automatically because:

* A user has many points
* A company pays
* A company is featured
* A company has high activity

Likewise, points must not automatically grant verification.

---

# 11. Future Monetization Architecture

Back Of House is intended to become a commercial platform.

However, monetization must NOT make the MVP unnecessarily complex.

The product architecture should leave room for future monetization such as:

### Company subscriptions

Possible future features:

* Enhanced company profile
* More portfolio projects
* Advanced visibility
* Company analytics
* Premium business tools

### Featured Opportunities

Companies may eventually pay to promote:

* Jobs
* Projects
* Supplier Requests

### Featured Companies

Companies may eventually pay for increased visibility in discovery areas.

### Sponsored Industry Content

The News ecosystem may eventually support clearly identified sponsored content.

### B2B / Supplier monetization

Supplier Requests may eventually support:

* Paid visibility
* Lead generation
* Premium supplier tools
* Other B2B commercial features

These are **future monetization capabilities**.

Do NOT implement a full payment/subscription/commission system now unless explicitly requested.

Do NOT add Stripe, payment gateways, invoices, wallets, commissions, or billing infrastructure simply because these features may be needed later.

The current architecture should remain compatible with adding monetization later.

---

# 12. Paid Visibility Must Be Separate From Trust

If monetization is introduced later:

`Featured` / `Sponsored` / `Promoted`

must remain completely separate from:

`Verified`

A paid company is not automatically verified.

A featured company is not automatically more trustworthy.

The UI must clearly distinguish commercial placement from verification.

---

# 13. Product Philosophy

Back Of House is NOT intended to become:

* Only a job board
* Only a social network
* Only a company directory
* Only an advertising platform

It is an ecosystem for professionals and companies in the events industry.

The product should connect:

Individuals
+
Companies
+
Professional Profiles
+
Company Portfolios
+
Services
+
Jobs
+
Projects
+
Co-op Training
+
Volunteering
+
Supplier Requests
+
Events
+
News
+
Courses
+
Rewards

The implementation should remain simple and focused while preserving this ecosystem architecture.

---

# 14. MVP Principle

Do not over-engineer the product.

Implement the business rules that are required now.

Prepare clean domain boundaries for future functionality without implementing unnecessary complexity.

Prefer:

* Reusable domain models
* Reusable UI components
* Clear enums
* Clear permissions
* Clear API boundaries
* Strong typing
* Explicit relationships
* Extensible architecture

Avoid:

* Duplicated models
* Duplicated opportunity screens
* Fake functionality
* Hardcoded business rules scattered throughout the UI
* Premature payment infrastructure
* Premature messaging infrastructure
* Unnecessary abstractions

---

# 15. Required Domain Separation

At minimum, keep these concepts logically separate:

```text
Account
Company
CompanyType
CompanyProject
Opportunity
Application
SupplierResponse
Verification
Points
Reward
```

Future monetization concepts should also remain separate:

```text
Subscription
Promotion
FeaturedListing
SponsoredContent
Payment
```

These future entities should NOT be implemented unless required, but existing architecture must not prevent them.

---

# 16. Implementation Rule

Before implementing any new feature, determine:

1. Is this an Account concern?
2. Is this an Individual concern?
3. Is this a Company concern?
4. Is this Company classification?
5. Is this a Company Project?
6. Is this an Opportunity?
7. Is this an Individual Application?
8. Is this a Supplier Response?
9. Is this Verification?
10. Is this Points / Rewards?
11. Is this future Monetization?

Do not merge unrelated concepts just to reduce the number of database tables or frontend screens.

At the same time, do not create separate systems when a reusable domain model is sufficient.

---

## Final implementation principle

Build the current product as a **simple, professional MVP**, but make the domain model strong enough that Back Of House can later evolve into a real commercial events-industry ecosystem without requiring a major rewrite.

---

## Product decisions already made

* **No member posts.** There is no community feed or discussion threads. News is published by the Back Of House editorial desk; members read, save and share.
* **Article likes and comments** *(approved 2026-09-18)*: individual members may like an article and leave comments on it. Comments are flat (no replies, reactions or edits), 1–500 characters, carry an author snapshot, and only their author may delete them. Companies read articles and comments but cannot like or comment. Rules live in `ArticleEngagementRules`; the data layer enforces them.
* **Bottom navigation:** Home · Discover · News · Rewards · Profile.
* **Students** are `INDIVIDUAL` accounts with `profileStatus = STUDENT` (a profile attribute, extensible to other states). Co-op Training eligibility does not depend on a separate account type. *(Approved 2026-09-17.)*
* **Profile Highlight** is a points-funded Rewards benefit that temporarily raises an individual's visibility. It never grants verification and is not paid advertising. Keep the three concepts separate: `Verified` (trust) · `Profile Highlight` (rewards) · `Featured` / `Promoted` (future paid placement). *(Approved 2026-09-17.)*
* **Free editorial company lists** use neutral names such as "Companies to Watch"; `Featured` is reserved for paid placement. *(Approved 2026-09-17.)*
* **"Tier" labels** (e.g. "Tier-1 Contractor", "Tier 1") had no defined business rule and were removed so they cannot be read as verification. *(Approved 2026-09-17.)*

### Applications and eligibility *(approved 2026-09-17)*

* **Co-op eligibility:** only `INDIVIDUAL` accounts with `profileStatus = STUDENT` may apply to `CO_OP`. Companies and non-student individuals cannot. The rule lives in `Opportunity.eligibilityFor` and is enforced by the data layer, not only the UI.
* **Applying again:** an active application blocks a new one; a rejected (or accepted) application blocks re-applying to the same listing; only a withdrawn application allows applying again. Never create duplicate active applications. The rule lives in `ApplicationRules`.
* **Application contents (MVP):** applicant profile snapshot, selected experience (**at least one item**, revised 2026-09-28), selected portfolio projects (optional), optional message (≤ 500 characters), and a listing snapshot for history. **No CV upload.** Selected items must belong to the applicant's own profile. The company later views: applicant profile + selected experience + selected projects + message.
* **Match score:** optional. Calculated by the backend only; the app never computes, invents or placeholders it. Co-op and volunteering show none unless a defined backend matching rule exists. No recommendation engine in the MVP.
* **Status notifications:** the individual is notified on each official status change (`SUBMITTED`, `REVIEWED`, `SHORTLISTED`, `CONTACT`, and the decision `ACCEPTED` / `REJECTED` / `WITHDRAWN`), naming the opportunity and the new status. Edits to the opportunity never notify. No preference/automation system yet.

### Account-aware experience *(approved 2026-09-17)*

* `INDIVIDUAL` → individual experience; `COMPANY` → company experience. The company workspace lives under `/company` and individuals never open it. Companies share only **News** with individuals; everything else individual — Home, Discover and its directories, opportunities and applying, applications, notifications, Rewards/points, the member profile — stays out of reach (enforced by `AuthGuard`). *(Shared tabs revised 2026-09-28; previously Discover was shared too.)*
* **Company MVP scope:** Company Dashboard, Company Profile, Company Projects / Portfolio, My Opportunities, Create Opportunity, Edit / Publish Opportunity, Opportunity Details, Applicants, Applicant Details, Applicant status management, Supplier Requests, Supplier Request Details, Supplier Response.
* **Out of scope for now:** interview scheduling, full messaging, offer management, advanced recruitment analytics, payments, subscriptions, advertising, advanced matching.

### Company MVP *(approved 2026-09-17)*

* **Membership:** each company has one Owner in the MVP. Accounts act for a company through a `CompanyMembership` (company + `CompanyRole`); screens and data sources check a `CompanyPermission`, never a role. No invitations, delegated roles or RBAC yet — members are added later as new roles.
* **Opportunity publishing:** every company-created opportunity starts as `DRAFT` → `IN_REVIEW` → `PUBLISHED`. Back Of House reviews every listing, whether or not the company is verified. The company may pull a listing back from review to edit it, and close a published listing; only drafts are editable. Rules live in `OpportunityLifecycle`. Company verification ≠ opportunity review.
* **Unverified companies** may edit their profile, add company projects, create drafts, submit for review and respond to eligible supplier requests. Verification is not a prerequisite for MVP company features.
* **Applicant status (company):** one step at a time `SUBMITTED → REVIEWED → SHORTLISTED → CONTACT → ACCEPTED`; `REJECTED` from any active stage; no jumps (e.g. `SUBMITTED → ACCEPTED`); `ACCEPTED` only from `CONTACT`. Final decisions are immutable — no undo. Companies never withdraw for the applicant. Rules live in `ApplicationRules.nextStatuses`.
* **Supplier requests:** creating one requires the `CompanyCapability.createSupplierRequest` capability (granted by default to Event Organizer, Agency, Venue, Production; extensible; the API may grant it explicitly). Each request names the invited supplier company types; only those types see it and may respond. Buyers never respond to their own requests. The backend enforces this.
* **Supplier responses** are a separate domain (`SupplierResponse`): message (required), optional proposed price, optional company projects as evidence, and the responder's company reference. No file attachments. One response per company per request. Buyer lifecycle: `SUBMITTED → REVIEWED → SHORTLISTED → SELECTED`, with `REJECTED` from any open step; `SELECTED` and `REJECTED` are final. Rules live in `SupplierResponseRules`.
* **CONTACT stage** is not messaging. Before `CONTACT` the company sees only public profile information, selected experience, selected portfolio projects and the message. From `CONTACT` (and after acceptance) contact details may be released, limited to what the applicant's `ContactPrivacy` shares. Opening an application never reveals contact data. The backend redacts; rules live in `ApplicantPrivacy`.
* **Individual `ProfileProject` ≠ `CompanyProject`.** Company projects can be attached to supplier responses.
* **Company navigation** *(revised 2026-09-28, supersedes 2026-09-18)*: one bottom bar for both account types. Companies get **Dashboard · Listings · Suppliers · News · Profile** (no Rewards — points are for individuals). Listings is My Opportunities; Suppliers holds Invited requests, My responses and My requests. The company portfolio sits inside Company Profile. Companies no longer see Discover.
* **Not yet:** team management, complex RBAC, messaging, interview scheduling, offer management, payments/subscriptions, advanced matching, advanced analytics, file attachments (except Get-verified documents).

### Company MVP — settled decisions *(approved 2026-09-18)*

1. **Review outcome:** a review that does not pass moves the listing to `CHANGES_REQUESTED` with a `reviewerNote`; it never drops back to `DRAFT` on its own. The company edits (which clears the note) and resubmits. Only Back Of House sets `PUBLISHED`.
2. **Editing published listings:** never edited in place. The company starts a revision (`OpportunityRevision`), the published version stays live, and the revision goes through the same review. Approval replaces the live content; changes requested leave it untouched. No edit bypasses review.
3. **Closing:** `CLOSED` is final in the MVP — no reopening, and no transition leaves it.
4. **Contact privacy:** `ContactPrivacy` defaults to sharing **nothing**. From `CONTACT` the company sees only the fields the individual turned on. Opening an applicant never reveals contact data. The individual's privacy settings belong in Profile Settings later, never inside a company flow.
5. **Supplier request capability:** no request-access workflow. A company without `CompanyCapability.createSupplierRequest` simply has no create action; the backend capability is the source of truth.
6. **Supplier selection:** selecting a response sets it `SELECTED`, rejects every other open response and closes the request. Final — no reopening and no changing supplier.
7. **Applicant notifications:** part of the API contract. Company-side status changes raise the applicant's notification server-side; the app never delivers one and the mock only records the event.
8. **Company verification:** handled outside the app. The company sees its verification state read-only, and verification grants no publishing rights — the review lifecycle is independent of it.

### App redesign decisions *(approved 2026-09-28)*

The visual redesign (reference files in `docs/design/`) brought these product decisions with it. Everything not listed here is unchanged.

1. **Points levels are numbered** ("Level 3 · 250 pts to Level 4"). A points level is a Rewards concept only: it never grants, implies or displays verification, and uses its own labels (never the verification level wording).
2. **Sign-in** offers email and password, **Continue with Google** and **Continue with a phone code** (one-time code sent by SMS). All three reach the same account.
3. **Get verified (individuals):** an individual may submit a verification request with an identity document (ID or Iqama) and proof of experience. Back Of House reviews it; submitting never grants verification, and points, payments or activity never do either. These uploads are the only file attachments in the app; applications and supplier responses still have none. Company verification stays outside the app.
4. **Listing fields:** an opportunity may carry a closing date (`closesAt`) and a work setup (`ON_SITE`, `HYBRID`, `REMOTE`).
5. **Supplier response** may carry an optional setup time next to the proposed price.
6. **Company stats (basic):** the Dashboard shows new applicants, supplier invites, profile views (with change) and recent applicants across listings; Company Profile shows a follower count. These are backend-provided counts, not advanced analytics.
7. **Registering for an event earns no points.** Points come from verified attendance and other verified activity.
8. **Profile editing:** individuals edit their profile, interests, student status and contact-privacy settings (all off by default) from Edit profile. Changing student status re-evaluates co-op eligibility in the data layer.
9. **Directories:** Companies and Professionals directories are part of Discover (individuals only). "Companies to Watch" stays an editor's pick, never "Featured". A highlighted professional is a Profile Highlight reward, never verification.
