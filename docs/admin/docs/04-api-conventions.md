# 04 · API conventions

These apply to every endpoint in `openapi/openapi.yaml`.

## Base paths and versioning

| Area | Prefix | Used by |
|---|---|---|
| Member app | `/v1/...` | Flutter app (members) |
| Company workspace | `/v1/company/...` | Flutter app (company accounts) |
| Back-office | `/v1/admin/...` | Admin web app |
| Public metadata | `/v1/meta/...` | Both |

The backend already serves the Flutter app. **Don't change or remove an existing route the app uses.** If an existing route conflicts with the contract, keep it working, add the contract route next to it, and list both in the gap report. Breaking changes go to `/v2`.

## Authentication

- **Members:** `POST /auth/login` → access token (JWT, 15 min) + refresh token (30 days, rotated on every refresh, stored hashed, revoked on logout and password change).
- **Admins:** separate identity, signing key and audience (`aud: "admin"`).
  1. `POST /admin/auth/login` (email + password) → `mfaToken` (5 min).
  2. `POST /admin/auth/mfa/verify` (6-digit TOTP) → session token.
  - Idle timeout 30 min (sliding), absolute lifetime 12 h. Changing an admin's role or disabling them revokes their sessions.
  - Rate limit: 5 failed attempts per email + IP per 15 min.
- A member token must be rejected on `/admin/*`, and an admin token on member routes.

## Languages and time

- Send `Accept-Language: en | ar`. Member responses come back in that language; error `title`/`detail` too.
- Admin endpoints exchange bilingual content as `LocalizedText { en, ar }`.
- All timestamps are ISO 8601 in UTC (`2026-10-01T07:00:00Z`). Scheduling inputs that a person picks (publish time, broadcast time, scheduled exports) are shown and chosen in **Asia/Riyadh** and converted to UTC by the backend.
- Use Western digits in both languages.

## Pagination

- **Member feeds** use cursors: `?cursor=&limit=` → `{ items, meta: { nextCursor, hasMore } }`.
- **Admin tables** use pages because the screens show "Showing 1–7 of 4,870": `?page=&pageSize=&sort=` → `{ items, meta: { page, pageSize, total, totalPages } }`. `sort` takes a field name, `-` prefix for descending.
- Max `pageSize` 100, max `limit` 50.

## Errors

`application/problem+json` (RFC 7807) with a stable `code`:

```json
{ "type": "https://api.backofhouse.sa/errors/listing-not-editable", "title": "This listing is waiting for review and can't be edited.", "status": 409, "code": "LISTING_NOT_EDITABLE", "traceId": "…" }
```

Validation errors use 422 with `errors: [{ field, code, message }]`.

| Code | Status | When |
|---|---|---|
| `FORBIDDEN` | 403 | Role lacks the permission |
| `PERSONAL_DATA_FORBIDDEN` | 403 | Export asked for email/phone without `exports.personal_data` |
| `ALREADY_APPLIED`, `ALREADY_REGISTERED`, `EVENT_FULL`, `OUT_OF_STOCK` | 409 | Duplicate or capacity |
| `LISTING_NOT_EDITABLE`, `INVALID_TRANSITION` | 409 | State machine |
| `LAST_SUPER_ADMIN` | 409 | Removing the last Super admin |
| `NOT_ELIGIBLE`, `LISTING_CLOSED` | 422 | Applying |
| `INSUFFICIENT_POINTS`, `LEVEL_TOO_LOW` | 422 | Redeeming |
| `MONTHLY_CAP_REACHED` | 422 | Support points cap |
| `RULE_LOCKED` | 422 | Editing the event-registration rule |
| `TRANSLATION_MISSING` | 422 | Publishing news without both languages |
| `EMAIL_DOMAIN_NOT_ALLOWED` | 422 | Inviting an admin outside the company domain |

## Idempotency

Endpoints marked with the `Idempotency-Key` header (apply, register, redeem, respond, points adjustment, award points) store the first response for 24 h per caller + key. A repeat with the same key returns the stored response; the same key with a different body returns 422 `IDEMPOTENCY_KEY_REUSED`.

## Uploads

1. `POST /uploads` with purpose, mime and size → `uploadId` + pre-signed `putUrl` (S3-compatible storage).
2. Client PUTs the file.
3. Client sends `uploadId` in the related request (avatar, verification documents, import file…).

Images: jpg/png/webp up to 10 MB. Documents: pdf/jpg/png up to 20 MB. Import files: csv/xlsx up to 20 MB. Private purposes (`verification_doc`, `import_file`, `ticket_attachment`) are never public; they are served by signed URLs valid 5 minutes.

## Long-running work

Exports, imports, bulk actions and data requests return **202** with a job id. Poll `GET` on the resource (or listen for an admin notification). Statuses: `queued → processing → ready | failed` (imports: `validating → preview_ready → processing → done | done_with_errors`).

## Audit

Every admin write and every sensitive read (verification document view, user contact view, export download) writes an `AuditLog` row with actor, role, action, target, details, IP and user agent. Use one interceptor, not ad-hoc calls. Action names are dotted: `listing.approve`, `listing.request_changes`, `verification.approve`, `points.adjust`, `export.create`, `export.download`, `admin.sign_in`, `team.invite`, `settings.update`.

## Security

- Passwords: Argon2id. TOTP secrets: encrypted with a key from the secrets manager.
- Rate limits: auth endpoints, `POST /reports`, `POST /support/tickets`, uploads.
- Sanitize rich text (article bodies) on write; allow a small HTML subset.
- Strip phone numbers and emails from listing descriptions on display when `hideContactDetailsInListings` is on (and flag them in checks).
- Never log tokens, passwords, documents or full contact details.
