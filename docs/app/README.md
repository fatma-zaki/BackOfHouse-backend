# Back Of House — API contract

What the mobile app needs from the backend. The endpoints and payloads are in
[contracts/app/openapi.yaml](../../contracts/app/openapi.yaml) (OpenAPI 3.1, the
source of truth for the app surface `/api/app/v1`, ADR-031); this page covers
the conventions, the rules the server must enforce, and what is still open.

> **Changed 2026-10-11:** the base URL is now `https://backofhouse.space/api/app/v1`;
> Google sign-in (`/auth/social`) is removed (BQ-78); errors carry `trace_id`
> and 5xx is `SERVER_ERROR` (docs/error-codes.md); `GET /meta/app-version` is
> new and must be called on launch before the first store release (D11).

The product rules behind everything here are in
[../business-rules.md](../business-rules.md). Where this contract and that
document disagree, the business rules win. Tell the app team so this file
gets fixed.

**Status.** The app currently runs on in-memory mocks (`USE_MOCK_DATA=true`).
Only auth has a real HTTP client so far. Each mock already enforces the rules
below, so it shows the expected behaviour: see `lib/features/*/data/`.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Base URL | `https://backofhouse.space/api/app/v1` (the app reads it from `config/*.json`; ADR-031) |
| Format | JSON, UTF-8. Field names in `snake_case`. Enum values in `UPPER_SNAKE_CASE`, never localised. |
| Single resource | `{ "data": { ... } }` |
| List | `{ "data": [ ... ], "meta": { "page": 1, "page_size": 20, "has_more": true, "total": 134 } }`. `total` is optional. |
| Paging | `?page=1&page_size=20`. Pages are 1-based. The app asks for 20 and stops when `has_more` is false. Endpoints marked unpaged in the spec return the whole list. |
| Search | `?q=` for free text, case-insensitive, matching the fields named per endpoint |
| IDs | Opaque strings |
| Timestamps | ISO 8601 in UTC, e.g. `2026-09-28T14:30:00Z`. Date-only fields (`started_at` on projects, experience `start`/`end`) use `YYYY-MM-DD`. |
| Nulls | Optional fields may be `null` or absent. Lists are never `null`; send `[]`. |
| Images | Absolute HTTPS URLs in `*_url` fields. The app never uploads images, except verification documents. |
| Money and durations | Display strings, not numbers (`"SAR 28k – 34k / mo"`, `"4 months"`, `"2 days on site"`) |
| Toggles | `PUT` turns a toggle on and `DELETE` turns it off (follow, like, save, registration, connection). Both are idempotent and return the updated resource. |

### Headers the app sends

```
Authorization: Bearer <access_token>   (all endpoints except the auth ones marked security: [])
Accept-Language: en | ar               (every request)
Accept: application/json
Content-Type: application/json         (multipart/form-data for the one upload)
```

### Localisation

The app is bilingual (English and Arabic). The server returns content
strings in the language from `Accept-Language`: titles, descriptions, city
names, categories, notification text, reward steps and so on. Enum values
are never translated; the app labels them itself.

The one exception is application status notifications. The app writes that
copy itself from `application_update`, so the server's `title`/`body` are
only a fallback.

---

## 2. Auth and session

- **Two ways to sign in, one account (BQ-78):** email and password, and a
  phone code (`/auth/phone/code` then `/auth/phone/verify`). A matching email
  or phone reaches the same account. Both return a **Session**: `access_token`,
  `refresh_token`, `expires_in`, `user`. There is no Google or social login at
  launch. Phone codes are rate-limited per phone and per IP, expire, and have
  an attempt cap (429 `RATE_LIMITED`, 422 `INVALID_CODE`).
- **`GET /me`** restores the session on launch. `AppUser` carries
  `account_type`, `profile_status` (individuals) and `membership`
  (companies: company summary and role).
- **Two account types only:** `INDIVIDUAL` and `COMPANY`.
  - Students are individuals with `profile_status = STUDENT`.
  - Supplier, venue, organiser and so on are a company's `company_type`,
    never an account type.
- **Company membership:** one `OWNER` per company in the MVP. The server
  checks a *permission* (`EDIT_PROFILE`, `MANAGE_PROJECTS`,
  `MANAGE_OPPORTUNITIES`, `REVIEW_APPLICANTS`,
  `RESPOND_TO_SUPPLIER_REQUESTS`), never the role name, so more roles can
  come later without API changes.
- **401:** on any 401 the app clears its tokens and returns to sign in.
  Return 401 only for a missing, expired or revoked token (and for
  `INVALID_CREDENTIALS` on sign-in). The app will use `POST /auth/refresh`
  once refresh is wired (see section 8).
- **Password reset:** `/auth/forgot-password` always answers 204, so it
  never reveals whether an email exists. The emailed link opens the website,
  which calls `/auth/reset-password`.

### Who may call what

The server scopes every request by the token's account type, and the app
never relies on hiding screens alone.

| Area | Individuals | Companies |
|---|---|---|
| `/me/*` (profile, verification, applications, points, notifications) | ✓ | 403 `FORBIDDEN` |
| Discover: `/events`, `/opportunities`, `/companies`, `/professionals`, `/discover/counts` | ✓ | 403 `FORBIDDEN` |
| `/rewards/*` | ✓ | 403 `FORBIDDEN` |
| `/news` read, comments read | ✓ | ✓ |
| `/news` like, comment | ✓ | 403 `ENGAGEMENT_NOT_ALLOWED` |
| `/company/*` (own workspace, suppliers) | 403 `FORBIDDEN` | ✓, per permission |

`/opportunities` never returns `SUPPLIER_REQUEST` to anyone. Supplier
requests only appear under `/company/supplier-requests/*` and in the buyer's
own `/company/opportunities`.

---

## 3. Errors

```json
{
  "code": "NOT_ELIGIBLE",
  "message": "Co-op training is for students.",
  "reason": "STUDENTS_ONLY",
  "errors": { "experience_ids": ["Select at least one experience item."] }
}
```

`code` and `message` sit at the top level. The app already reads `message`
and `errors` from there. `message` is for logs; the app shows its own
localised copy chosen from `code` (and `reason`). `errors` holds field
errors keyed by request field name.

| HTTP | `code` | When |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Missing, expired or revoked token |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 403 | `FORBIDDEN` | Wrong account type for the endpoint |
| 403 | `PERMISSION_DENIED` | Company member lacks the permission |
| 403 | `CAPABILITY_REQUIRED` | Creating a `SUPPLIER_REQUEST` without `CREATE_SUPPLIER_REQUEST` |
| 403 | `ENGAGEMENT_NOT_ALLOWED` | A company likes or comments on news, or someone deletes another person's comment |
| 403 | `NOT_ELIGIBLE` + `reason` | Applying or responding when not allowed (see section 4) |
| 404 | `NOT_FOUND` | Missing, or not visible to this account (do not leak existence) |
| 409 | `INVALID_TRANSITION` | Status change not allowed from the current status |
| 409 | `NOT_EDITABLE` | Editing a listing that is not `DRAFT` / `CHANGES_REQUESTED` |
| 409 | `REVISION_EXISTS` | Starting a second revision |
| 409 | `ALREADY_APPLIED` | An earlier application to the listing blocks a new one |
| 409 | `ALREADY_RESPONDED` | Second supplier response to the same request |
| 409 | `INSUFFICIENT_POINTS` / `REWARD_UNAVAILABLE` | Redeeming |
| 409 | `VERIFICATION_LOCKED` / `VERIFICATION_INCOMPLETE` | Uploading after submitting / submitting without both documents |
| 409 | `EMAIL_TAKEN` / `PHONE_TAKEN` | Registering |
| 413 | `FILE_TOO_LARGE` | Verification upload over 10 MB |
| 422 | `VALIDATION_FAILED` | Field errors in `errors` |
| 422 | `INVALID_CODE` | Wrong or expired phone code |
| 429 | `RATE_LIMITED` | With `Retry-After`; used on the auth and phone-code endpoints |
| 5xx | `SERVER_ERROR` | |

---

## 4. Rules the server must enforce

The app explains these rules in the UI, but the server is the authority.
Each has a matching rule class in the app (named in brackets) and a mock
that shows the behaviour.

### Listings (`OpportunityLifecycle`)

```
DRAFT ──submit──▶ IN_REVIEW ──(Back Of House)──▶ PUBLISHED ──close──▶ CLOSED (final)
  ▲                 │   └──(Back Of House)──▶ CHANGES_REQUESTED + reviewer_note
  └─return-to-draft─┘                              │
                                                   └──submit──▶ IN_REVIEW
```

- **Transitions:**
  - The company may only submit, return to draft, and close.
  - Only Back Of House publishes or requests changes, from its own back
    office, which is outside this contract.
  - Every listing is reviewed, whether or not the company is verified.
- **Changes requested:** a failed review sets `CHANGES_REQUESTED` with a
  `reviewer_note`. It never falls back to `DRAFT` on its own. Resubmitting
  clears the note.
- **Editing:** only `DRAFT` and `CHANGES_REQUESTED` can be edited, and the
  type never changes.
- **Published listings** change only through a **revision**:
  1. `POST /revision` copies the live content into a revision.
  2. The company edits it and submits it.
  3. The live listing stays up throughout.
  4. On approval the revision replaces the live content and `revision`
     becomes `null`. If changes are requested, the live content is
     untouched.
  5. Only one revision can be pending at a time.
- **`CLOSED` is final:** a listing is never reopened.
- **Validation at submit:**
  - `title`, `city`, `summary` and `description` are required.
  - `employment_type` is required for `JOB`.
  - `SUPPLIER_REQUEST` needs at least one `supplier_types` entry and the
    `CREATE_SUPPLIER_REQUEST` capability.
  - `closes_at`, when set, must be in the future.
  - Saving a draft may be incomplete.
- **Open for applications:** a listing is open only while it is `PUBLISHED`
  and before `closes_at`.

### Applications (`Opportunity.eligibilityFor`, `ApplicationRules`)

- **Eligibility**, checked in this order, with the `reason` in the error:
  1. `COMPANY_FACING`: the listing is a supplier request.
  2. `INDIVIDUALS_ONLY`: the caller is a company.
  3. `CLOSED`: the listing is not open.
  4. `STUDENTS_ONLY`: `CO_OP` requires `profile_status = STUDENT`, read
     from the profile at the time of applying.
- **Applying again:**
  - An active application blocks a new one.
  - So does an `ACCEPTED` or `REJECTED` one.
  - Only a `WITHDRAWN` application allows applying again.
  - There are never two active applications to the same listing.
- **Contents:**
  - At least one `experience_ids` entry is required.
  - `project_ids` and `message` (≤ 500 characters) are optional.
  - Every id must belong to the applicant's own profile.
  - No CV upload.
- **Snapshots:** the server stores an applicant snapshot (public profile
  only, never contact details) and a listing snapshot at submission, so
  later edits don't rewrite history.
- **Company moves:**
  - One step at a time: `SUBMITTED → REVIEWED → SHORTLISTED → CONTACT →
    ACCEPTED`. No skipping ahead.
  - `REJECTED` is allowed from any active status.
  - `ACCEPTED` only from `CONTACT`.
  - `ACCEPTED`, `REJECTED` and `WITHDRAWN` are final.
  - Only the applicant withdraws.
- **Notifications:** every official status change (including `SUBMITTED`
  and `WITHDRAWN`) creates a notification for the applicant, server-side.
  Include `application_update`. Edits to the listing never notify.
- **Contact privacy (`ApplicantPrivacy`):** `ApplicantView.contact` is
  `null` before `CONTACT`. From `CONTACT` (and `ACCEPTED` after it) it
  holds only what the applicant's `contact_privacy` shares, which defaults
  to nothing. Opening an applicant never changes status or releases
  contact. Redact on the server; never send and hide.
- **Match score:** optional and backend-only. Send `null` when no rule
  applies; the app never invents one. There is no recommendation engine in
  the MVP.

### Supplier requests (`SupplierResponseRules`)

- **Who sees and responds:**
  - Only company types listed in `supplier_types` see a request and may
    respond.
  - The buyer never responds to its own request.
  - One response per company per request.
  - The request must be open.
  - Refusals return `NOT_ELIGIBLE` with `reason` `NOT_SUPPLIER_REQUEST` /
    `OWN_REQUEST` / `NOT_INVITED` / `CLOSED`, or `ALREADY_RESPONDED`.
- **Response contents:**
  - `message` is required (≤ 1000 characters).
  - `proposed_price` and `setup_time` are optional free text.
  - `project_ids` must be the responder's own company projects.
  - No attachments.
- **Buyer moves:**
  - One step at a time: `SUBMITTED → REVIEWED → SHORTLISTED → SELECTED`.
  - `REJECTED` is allowed from any open status.
  - **Selecting** a response, in one transaction, also rejects every other
    open response and closes the request. It is final, with no reopening
    and no switching supplier.
- **`/company/stats.supplier_invites`** counts open requests that invite
  this company's type and that it hasn't answered yet.

### News (`ArticleEngagementRules`)

- Articles come from the Back Of House editorial desk; there are no member
  posts.
- Individuals may like and comment. Companies only read.
- Comments are flat (no replies, reactions or edits), 1–500 characters
  after trimming, and store an author snapshot.
- Only the author may delete a comment, and `mine` tells the app which ones
  are theirs.

### Points, rewards, verification: three separate things

- **Points:**
  - Only the server awards them, for verified activity (attendance verified
    at the venue, completed volunteer shifts, and the other
    `PointsActivity` values).
  - **Registering for an event earns nothing.**
  - Redeeming is atomic and writes a negative `REDEEMED_REWARD`
    transaction.
- **Points levels** are numbered Rewards levels:

  | Level | Starts at |
  |---|---|
  | 1 | 0 pts |
  | 2 | 100 pts |
  | 3 | 500 pts |
  | 4 | 1500 pts |

  A level never grants, implies or displays verification.
- **Profile Highlight** (`RewardKind.HIGHLIGHT`, `Professional.highlighted`)
  is a points reward. It sorts a member first in the directory and is
  labelled "Highlighted". It is not verification and not paid placement.
- **Verification is never automatic:**
  - An individual uploads an identity document and proof of experience,
    then submits. The request moves to `IN_REVIEW`.
  - Back Of House decides outside the app, and the result shows as
    `is_verified` / `verified`.
  - Points, payments and activity never grant it.
  - Company verification is handled outside the app too, and grants no
    publishing rights.
- **"Featured" / "Sponsored"** is reserved for future paid placement and is
  never sent as a trust signal.
  - The editorial lists are "Companies to Watch" (`editors_pick`) and the
    Home "Flagship" event (`flagship`). Both are free and neutral.

### Profile

- `PATCH /me/profile`:
  - `name` must be at least 2 characters and `about` at most 600.
  - A `profile_status` change applies to every later eligibility check.
- `contact_privacy` defaults to `{ share_email: false, share_phone: false }`
  for every new account.

---

## 5. Endpoint index

`🔓` needs no token. Everything else needs a Bearer token. Full request and
response schemas are in `contracts/app/openapi.yaml`.

### Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` 🔓 | Individual or company sign-up (a company is created with the caller as `OWNER`) |
| POST | `/auth/login` 🔓 | Email and password |
| POST | `/auth/phone/code` 🔓 | Send SMS code |
| POST | `/auth/phone/verify` 🔓 | Sign in with the code |
| POST | `/auth/refresh` 🔓 | New session from a refresh token |
| POST | `/auth/logout` | Revoke the session |
| POST | `/auth/forgot-password` 🔓 | Email a reset link (always 204) |
| POST | `/auth/reset-password` 🔓 | Used by the website |
| GET | `/me` | Current account |

### Individual

| Method | Path | Purpose |
|---|---|---|
| GET, PATCH | `/me/profile` | Profile / edit |
| GET | `/me/verification` | Verification request |
| POST | `/me/verification/documents` | Upload `IDENTITY` or `EXPERIENCE` (multipart) |
| POST | `/me/verification/submit` | Send for review |
| GET, POST | `/me/applications` | My applications / apply |
| POST | `/me/applications/{id}/withdraw` | Withdraw |
| GET | `/me/points` | Balance and level |
| GET | `/me/points/transactions` | History (`filter=ALL/EARNED/REDEEMED`) |
| GET | `/me/notifications` | Inbox |
| POST | `/me/notifications/{id}/read`, `/me/notifications/read-all` | Mark read |
| GET | `/discover/counts` | Directory counts |
| GET | `/events`, `/events/{id}` | Events |
| PUT, DELETE | `/events/{id}/registration` | Register / cancel |
| GET | `/opportunities`, `/opportunities/{id}` | Published individual-facing listings |
| GET | `/companies`, `/companies/{id}` | Directory / public profile (`editors_pick=true` for Companies to Watch) |
| GET | `/companies/{id}/projects`, `/companies/{id}/opportunities` | Portfolio / open listings |
| PUT, DELETE | `/companies/{id}/follow` | Follow / unfollow |
| GET | `/professionals` | Directory |
| PUT, DELETE | `/professionals/{id}/connection` | Connect / withdraw |
| GET | `/rewards`, `/rewards/{id}` | Catalog |
| POST | `/rewards/{id}/redeem` | Redeem |

### Shared

| Method | Path | Purpose |
|---|---|---|
| GET | `/news`, `/news/{id}`, `/news/{id}/related` | Briefings (`order=FOR_YOU/LATEST`, `topic`) |
| PUT, DELETE | `/news/{id}/save`, `/news/{id}/like` | Save / like (like is individuals only) |
| GET, POST | `/news/{id}/comments` | Read / comment (post is individuals only) |
| DELETE | `/news/{id}/comments/{commentId}` | Delete own comment |

### Company

| Method | Path | Purpose |
|---|---|---|
| GET, PATCH | `/company` | Own profile |
| GET | `/company/stats` | Dashboard counts |
| GET, POST | `/company/projects` | Portfolio |
| PATCH, DELETE | `/company/projects/{id}` | Edit / delete project |
| GET, POST | `/company/opportunities` | Own listings (all statuses, including own supplier requests) / create draft |
| GET, PATCH | `/company/opportunities/{id}` | One listing / edit draft |
| POST | `/company/opportunities/{id}/submit`, `/return-to-draft`, `/close` | Lifecycle |
| POST, PATCH | `/company/opportunities/{id}/revision` | Start / edit revision |
| POST | `/company/opportunities/{id}/revision/submit` | Submit revision |
| GET | `/company/opportunities/{id}/applicants` | Applicants to a listing |
| GET | `/company/applicants/recent?limit=5` | Dashboard |
| GET | `/company/applicants/{id}` | One applicant |
| POST | `/company/applicants/{id}/status` | Move, accept, reject |
| GET | `/company/supplier-requests/invited` | Requests open to my company type |
| GET | `/company/supplier-requests/{id}` | One request |
| GET | `/company/supplier-requests/{id}/responses` | Responses to my request (buyer) |
| GET, POST | `/company/supplier-responses` | My responses / respond |
| GET | `/company/supplier-responses/{id}` | One response |
| POST | `/company/supplier-responses/{id}/status` | Buyer moves (select settles the request) |

---

## 6. Fields beyond what the app reads today

The spec includes these so the backend can ship them now. They are optional,
and the app will start using them without any contract change.

| Field / endpoint | Why |
|---|---|
| `Session.expires_in` | Proactive token refresh |
| `CompanySummary.logo_url`, `Company.cover_url` | The app shows initials and a placeholder cover today |
| `CompanyMembership.permissions` | The app derives permissions from the role today |
| `Event.flagship` | Home's "Flagship event" is the first upcoming event today |
| `Redemption.valid_until` | Shown on the redeemed-reward screen in the design |
| `GET /discover/counts` | Replaces four separate count calls |
| `GET /companies?editors_pick=true` | Companies to Watch is the first directory page today |
| `PageMeta.total` | Optional counts on list screens |
| Paging on `/me/notifications` | The app loads one list today |

---

## 7. Not in this contract

- **Back office:** listing review (publish or request changes), the
  verification decision, company verification, editorial content, points
  awards. These are Back Of House tools, not app endpoints.
- **Out of scope for the MVP:** messaging, interview scheduling, offers,
  payments, subscriptions, advertising or paid placement, CV upload, file
  attachments on applications or supplier responses, member posts, team
  roles beyond `OWNER`, advanced analytics and matching.

## 8. App-side work to switch off the mocks

1. Add a remote data source per feature next to each mock
   (`lib/features/*/data/`). Every `TODO(api)` marks one.
2. Send `Accept-Language` on every request (a Dio interceptor reading the
   app's content language).
3. Map the error `code` (and `reason`) to `ApiErrorType` before the HTTP
   status. Add 409 handling; it maps to `unknown` today.
4. Wire token refresh with `/auth/refresh` instead of signing out on the
   first 401.
5. Add wire values to the enums that don't have them yet: `EventType`,
   `NewsTopic`, `NewsOrder`, `RewardCategory`, `RewardKind`,
   `PointsActivity`, `ProfileInterest`, `Availability`,
   `ProfessionalField`, `ProfessionalFilter`, `NotificationCategory`,
   `NotificationTargetType`, `VerificationDocument`, and
   `VerificationRequestStatus`. Use the values in `contracts/app/openapi.yaml`.
6. Upload verification documents as multipart.

## 9. Open questions for the backend team

1. **Profile content editing:** the app edits name, headline, city, about,
   status, interests and privacy. Experience, skills and portfolio projects
   are read-only today. Where are they entered: the website, or new
   `/me/experience` and `/me/projects` endpoints?
2. **Verification outcome:** should a declined request come back as a new
   status with a note (e.g. `CHANGES_REQUESTED`) so the member can re-upload?
   The contract has only `DRAFT` and `IN_REVIEW` today.
3. **Push notifications:** is there a device-token endpoint (FCM/APNs)? The
   app only reads the inbox today.
4. **Connections:** `PUT /professionals/{id}/connection` sends a request.
   Does it need acceptance by the other member, and is there a pending
   state?
5. **Token lifetimes** for access and refresh tokens, and whether
   `remember_me` changes them.
