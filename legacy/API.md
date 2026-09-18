# API Reference

Base URL: `https://<host>/api/v1`. The interactive OpenAPI UI is at `/docs` in non-production environments and is the authoritative schema for request and response bodies.

## Conventions

### Authentication

Send the Supabase access token from login/signup on every protected request:

```
Authorization: Bearer <access_token>
```

When a request returns `401`, call `POST /auth/refresh` with the stored refresh token; if that also fails, send the user back to login. The app never needs, and must never contain, the Supabase service-role key.

### Success responses

```json
{ "data": { "id": "…", "name": "…" } }
```

Collections are paginated:

```json
{
  "data": [ … ],
  "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

`204 No Content` responses (deletes, logout) have no body.

### Errors

Every error has the same shape:

```json
{
  "statusCode": 400,
  "error": "ValidationException",
  "code": "VALIDATION_FAILED",
  "message": "Validation failed",
  "timestamp": "2026-09-18T10:00:00.000Z",
  "path": "/api/v1/companies",
  "details": [{ "property": "slug", "constraints": ["slug must be lowercase words separated by single hyphens"] }]
}
```

Branch on `code`, not on `message`:

| `code` | HTTP | Meaning |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Body or query failed validation; see `details` |
| `BAD_REQUEST` | 400 | Business rule refused (e.g. insufficient points, invalid UUID) |
| `UNAUTHORIZED` | 401 | Missing, malformed or expired token |
| `FORBIDDEN` | 403 | Signed in, but not allowed |
| `NOT_FOUND` | 404 | Does not exist, or is not visible to you |
| `CONFLICT` | 409 | Duplicate, out of stock, already done |
| `TOO_MANY_REQUESTS` | 429 | Rate limit hit; back off and retry |
| `INTERNAL_ERROR` | 500 | Server fault; safe to retry idempotent calls |

### Validation rules

- Unknown body properties are **rejected** (400), not ignored.
- Path ids must be UUIDs, otherwise 400.
- Dates are ISO 8601 strings (`2026-11-04T09:00:00.000Z`).
- URLs (`logo_url`, `avatar_url`, …) must be absolute `http(s)` URLs — use the URL returned by `POST /files`.

### Pagination, search and sorting

All collection endpoints accept:

| Query | Default | Rules |
| --- | --- | --- |
| `page` | 1 | integer ≥ 1 |
| `limit` | 20 | integer 1–100; above 100 is rejected |
| `search` | — | free text, up to 100 characters |
| `sortBy` | per endpoint | must be one of the endpoint's sortable fields; anything else falls back to the default |
| `sortOrder` | per endpoint | `asc` or `desc` |

### Rate limits

100 requests per minute per client by default. Credential endpoints (`signup`, `login`, `refresh`, `password/reset`, `password`, `email/resend-verification`) allow 5 per minute.

---

## Auth

| Method | Path | Auth | Body | Result |
| --- | --- | --- | --- | --- |
| POST | `/auth/signup` | — | `email`, `password`, `first_name?`, `last_name?` | 201 `{ user, session \| null, email_verification_required }` |
| POST | `/auth/login` | — | `email`, `password` | 200 `{ user, session }` |
| POST | `/auth/refresh` | — | `refresh_token` | 200 session |
| POST | `/auth/logout` | ✓ | — | 204 |
| POST | `/auth/password/reset` | — | `email` | 202 (same response whether or not the email exists) |
| POST | `/auth/password` | ✓ | `password` | 200 |
| POST | `/auth/email/resend-verification` | — | `email` | 202 |
| GET | `/auth/me` | ✓ | — | `{ id, auth_user_id, email, role, email_verified }` |

Passwords: 10–128 characters with upper case, lower case and a digit.

`session` is `{ access_token, refresh_token, expires_in, token_type: "bearer" }`. When the Supabase project requires email confirmation, signup returns `session: null` and the user logs in after verifying.

`user.id` is the **profile id** — the id used everywhere else in this API (members, authors, registrations).

## Users

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/users/me` | Own full profile, including email and phone |
| PATCH | `/users/me` | `first_name`, `last_name`, `phone`, `bio`, `location`, `job_title`, `years_of_experience`, `avatar_url` |
| GET | `/users` | Member directory. Public fields only (no email/phone). Search: name, job title, location. Sort: `created_at`, `last_name`, `years_of_experience` |
| GET | `/users/:id` | Public profile |

## Companies

| Method | Path | Who |
| --- | --- | --- |
| POST | `/companies` | Any member; the creator becomes the company's first admin |
| GET | `/companies` | Any member. Search: name, industry, location. Sort: `created_at`, `name` |
| GET | `/companies/:id` | Any member |
| PATCH | `/companies/:id` | Admins **of this company**. `slug` cannot change |
| DELETE | `/companies/:id` | Admins of this company |
| GET | `/companies/:id/members` | Members of this company |
| POST | `/companies/:id/members` | Admins of this company. Body `{ user_id, role: "admin" \| "member" }` |
| PATCH | `/companies/:id/members/:userId` | Admins of this company. Body `{ role }` |
| DELETE | `/companies/:id/members/:userId` | Admins, or the member removing themselves |

A company always keeps at least one admin (409 otherwise).

## Professionals

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/professionals` | Create your own profile (one per account; 409 if it exists) |
| GET | `/professionals` | Public profiles only. Search: profession, location. Sort: `created_at`, `experience`, `profession` |
| GET | `/professionals/me` | Your own profile, whatever its visibility |
| GET | `/professionals/user/:userId` | By profile id |
| GET | `/professionals/:id` | Private profiles return 404 to anyone but the owner |
| PATCH | `/professionals/:id` | Owner only |
| DELETE | `/professionals/:id` | Owner only |

`availability`: `available`, `busy`, `unavailable`. `profile_visibility`: `public`, `private`, `connections`.

## Events

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/events` | Created as `draft`. `company_id` optional; you must belong to that company |
| GET | `/events` | Published, cancelled and completed events. Sort: `start_date` (default asc), `created_at`, `title` |
| GET | `/events/:id` | Drafts are visible only to organisers |
| PATCH | `/events/:id` | Creator or an admin of the hosting company. Publish with `{ "status": "published" }` |
| DELETE | `/events/:id` | Same |
| POST | `/events/:id/registrations` | Register yourself. 409 when full or already registered |
| GET | `/events/:id/registrations/me` | Your registration, or `null` |
| DELETE | `/events/:id/registrations/me` | Cancel your registration |
| GET | `/events/:id/registrations` | Attendee list — organisers only |

## Opportunities

One endpoint set for jobs, projects and supplier requests.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/opportunities` | `type`: `job`, `project`, `supplier_request`. `status`: `draft` (default) or `open` |
| GET | `/opportunities` | Filters: `type`, `status` (`open`/`closed`/`archived`), `company_id`. Sort: `created_at`, `deadline`, `title` |
| GET | `/opportunities/:id` | Drafts visible only to the author and the company's admins |
| PATCH | `/opportunities/:id` | Author or company admin |
| DELETE | `/opportunities/:id` | Same |

## News

Articles are published by the platform; members read, comment and react.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/news` | Members — published articles. Sort: `published_at`, `title` |
| GET | `/news/:id` | Members |
| POST / PATCH / DELETE | `/news`, `/news/:id` | Platform editors only |
| GET | `/news/:id/comments` | Members — visible comments |
| POST | `/news/:id/comments` | Members — `{ body }`, published articles only |
| DELETE | `/news/comments/:commentId` | Author, or a moderator |
| PATCH | `/news/comments/:commentId/moderation` | Moderators — `{ status: visible \| hidden \| flagged }` |
| PUT | `/news/:id/reactions/me` | `{ type: like \| love \| insightful \| celebrate }` — one reaction per member, replaced on repeat |
| DELETE | `/news/:id/reactions/me` | Remove your reaction |

## Courses

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/courses` | Published courses. Search: title, instructor |
| GET | `/courses/:id` | |
| GET | `/courses/enrollments` | Your enrolments |
| POST | `/courses/:id/enroll` | 409 if already enrolled |
| POST | `/courses/:id/complete` | Marks your enrolment complete and credits `points_reward` once; 409 if already completed |
| POST / PATCH / DELETE | `/courses`, `/courses/:id` | Platform administrators |

## Points

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/points/balance` | `{ user_id, balance, updated_at }` |
| GET | `/points/transactions` | Your ledger, newest first |
| POST | `/points/adjustments` | Platform administrators only — `{ user_id, amount, description }` |

There is no endpoint through which a member can credit themselves. Points are earned through server-side events such as course completion.

## Rewards

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/rewards` | Active rewards. Sort: `points_cost` (default asc), `created_at`, `expires_at` |
| GET | `/rewards/:id` | |
| POST | `/rewards/:id/redeem` | 201 redemption. 400 insufficient points / unavailable / expired; 409 out of stock / already pending |
| GET | `/rewards/redemptions` | Your redemptions |
| PATCH | `/rewards/redemptions/:redemptionId/fulfil` | Platform administrators |
| PATCH | `/rewards/redemptions/:redemptionId/cancel` | Platform administrators — refunds points and restores stock |
| POST / PATCH / DELETE | `/rewards`, `/rewards/:id` | Platform administrators |

Redemption is atomic: the points debit, stock decrement and redemption record either all happen or none do. Retrying after a network error is safe — a duplicate returns 409 rather than charging twice.

## Notifications

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/notifications?unread=true` | Your notifications |
| PATCH | `/notifications/:id/read` | |
| PATCH | `/notifications/read-all` | `{ updated }` |
| DELETE | `/notifications/:id` | |

## Files

Upload first, then save the returned `url` on the resource (e.g. `PATCH /users/me { avatar_url }`).

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/files?category=<category>` | `multipart/form-data`, field `file`. Categories: `avatar`, `company-logo`, `company-cover`, `event-cover`, `course-thumbnail` |
| DELETE | `/files?category=<category>&path=<path>` | Your own uploads only |

JPEG, PNG and WebP only, up to 5 MiB by default. The file's actual bytes must match its type. Response: `{ bucket, path, url, content_type }`.

## Audit and health

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/audit-logs` | Platform administrators. Filters: `action`, `entity_type`, `actor_id` |
| GET | `/health` | Unauthenticated liveness probe — `{ "data": { "status": "ok" } }` |
