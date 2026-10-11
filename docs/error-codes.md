# Error codes

One catalog for both surfaces (D3, ADR-008). Every error response has the body `{ code, message, trace_id, errors }`. `errors` appears only with `VALIDATION_FAILED`.
- **Clients act on `code`.** `message` is English, for logs only.
- **Codes are stable.** Renaming one is a breaking change on the surface that uses it.

Where the Flutter contract and the admin hand-off used different codes for the same case, the Flutter code won (D3). Examples: `NOT_EDITABLE`, not `LISTING_NOT_EDITABLE`; `SERVER_ERROR`, not `INTERNAL_ERROR`.

**Where codes are declared:**
- **In code:** `src/common/errors/error-codes.ts` (`ErrorCode`). A unit test, `src/common/errors/error-codes.catalog.spec.ts`, fails if a value is missing from this page.
- **In the app contract:** the `ErrorCode` enum in `contracts/app/openapi.yaml`.
- **In the admin contract:** `code` is a string documented here.

**Surface column:** `both`, `app` or `admin`.
**Phase column:** the phase that first raises the code. `built` means it already exists in `ErrorCode`.

## Generic (any route)

| Code | HTTP | Surface | When | Phase |
|---|---|---|---|---|
| `BAD_REQUEST` | 400 | both | Malformed request | built |
| `VALIDATION_FAILED` | 422 | both | Field errors in `errors` | built |
| `UNAUTHENTICATED` | 401 | both | Missing, expired or revoked token (app) or session (admin); also the wrong surface's credential | built |
| `FORBIDDEN` | 403 | both | Caller lacks the permission or account context | built |
| `NOT_FOUND` | 404 | both | Missing, or not visible to the caller (never leak existence) | built |
| `CONFLICT` | 409 | both | Generic state conflict when no specific code applies | built |
| `PAYLOAD_TOO_LARGE` | 413 | both | Body over the JSON limit | built |
| `RATE_LIMITED` | 429 | both | With `Retry-After` | built |
| `SERVER_ERROR` | 5xx | both | Unexpected failure; no details exposed | built |
| `SERVICE_UNAVAILABLE` | 503 | both | A dependency is down (readiness) | built |
| `IDEMPOTENCY_KEY_REUSED` | 422 | both | Same `Idempotency-Key`, different body | 1 |

## Identity and access

| Code | HTTP | Surface | When | Phase |
|---|---|---|---|---|
| `INVALID_CREDENTIALS` | 401 | app | Wrong email or password | 2 |
| `INVALID_CODE` | 422 | app | Wrong or expired SMS code (BQ-78) | 2 |
| `EMAIL_TAKEN` / `PHONE_TAKEN` | 409 | app | Registering with an identifier in use | 2 |
| `WRONG_ACCOUNT_CONTEXT` | 403 | app | Individual token on a company route, or the reverse (ADR-029) | 2 |
| `PERMISSION_DENIED` | 403 | app | Company Account lacks a company permission | 2 |
| `NOT_STAFF` | 403 | admin | Google account outside the Workspace domain, or without an active `staff_accounts` row (ADR-032) | 2 |
| `EMAIL_DOMAIN_NOT_ALLOWED` | 422 | admin | Inviting a staff member outside the Workspace domain | 2 |
| `LAST_SUPER_ADMIN` | 409 | admin | Removing or demoting the last active Super admin | 2 |

## Opportunities, applications, supplier responses

| Code | HTTP | Surface | When | Phase |
|---|---|---|---|---|
| `COMPANY_NOT_VERIFIED` | 422 | app | Submitting a JOB from an unverified company (BQ-80) | 5 |
| `NOT_EDITABLE` | 409 | both | Editing an opportunity that is not `DRAFT` / `CHANGES_REQUESTED` (was `LISTING_NOT_EDITABLE`) | 5 |
| `REVISION_EXISTS` | 409 | app | Starting a second revision (P2) | 5 |
| `INVALID_TRANSITION` | 409 | both | Status change not allowed from the current status | 5 |
| `NOT_ELIGIBLE` | 403 | app | Applying or responding when not allowed; `reason` says why (e.g. `STUDENTS_ONLY`, BQ-79) | 5 |
| `ALREADY_APPLIED` | 409 | app | Second application to the same opportunity | 5 |
| `ALREADY_RESPONDED` | 409 | app | Second supplier response to the same request | 5 |
| `CAPABILITY_REQUIRED` | 403 | app | Creating a `SUPPLIER_REQUEST` without `CREATE_SUPPLIER_REQUEST` | 5 |

## Verification, moderation, content

| Code | HTTP | Surface | When | Phase |
|---|---|---|---|---|
| `VERIFICATION_LOCKED` | 409 | app | Uploading after submitting | 3b |
| `VERIFICATION_INCOMPLETE` | 409 | app | Submitting without both documents | 3b |
| `FILE_TOO_LARGE` | 413 | app | Upload over the size limit | 1 |
| `ENGAGEMENT_NOT_ALLOWED` | 403 | app | A company likes or comments on news, or deletes someone else's comment | 7 |
| `TRANSLATION_MISSING` | 422 | admin | Publishing or scheduling news without both languages | 7 |

## Events, points, rewards

| Code | HTTP | Surface | When | Phase |
|---|---|---|---|---|
| `ALREADY_REGISTERED` | 409 | app | Second registration for an event | 6 |
| `EVENT_FULL` | 409 | app | No capacity left | 6 |
| `INSUFFICIENT_POINTS` | 409 | app | Redeeming with too few points (BQ-76) | 6 |
| `LEVEL_TOO_LOW` | 409 | app | Redeeming below the reward's level (BQ-76) | 6 |
| `OUT_OF_STOCK` | 409 | app | Reward out of stock (BQ-76) | 6 |
| `REWARD_UNAVAILABLE` | 409 | app | Reward inactive or withdrawn | 6 |
| `MONTHLY_CAP_REACHED` | 422 | admin | Support adding more than 500 points per member per Riyadh month | 6 |
| `RULE_LOCKED` | 422 | admin | Editing the locked event-registration earning rule | 6 |

## Exports

| Code | HTTP | Surface | When | Phase |
|---|---|---|---|---|
| `PERSONAL_DATA_FORBIDDEN` | 403 | admin | Export asks for email or phone columns without `exports.personal_data` | 8 |

## Open points

- **Reward error codes.** The Flutter contract has `INSUFFICIENT_POINTS` and `REWARD_UNAVAILABLE`. BQ-76 adds `LEVEL_TOO_LOW` and `OUT_OF_STOCK`, so `contracts/app` gains both when Phase 6 adds redemption, and all four are 409 there. The hand-off used 422 for the points and level failures; that changes to 409 (the Flutter status wins, D3).
