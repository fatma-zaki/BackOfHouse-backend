# Security

This backend is designed following production security best practices, but it **requires independent security testing and review before production deployment**. This document states the model, the assumptions it rests on, and the risks that remain.

## Reporting a vulnerability

Do not open a public issue. Contact the project maintainers privately with reproduction steps; include the endpoint, request and observed response, but never real user data or live credentials.

## Authentication model

- **Supabase Auth owns credentials.** Password hashing, session issuance, refresh-token rotation, email verification and password reset are Supabase's. The `users` table stores no credential of any kind.
- **Every protected request is verified.** `AuthGuard` sends the bearer token to `supabase.auth.getUser()`, which checks signature, expiry and revocation server-side. Local JWT decoding without verification is never used.
- **Identity comes only from the token.** The guard builds `request.user` (`authUserId`, `profileId`, `email`, `role`) from the verified token and a lookup keyed by it. No endpoint reads the caller's identity from the body, query or custom headers; DTOs reject unknown properties such as `userId`.
- **Suspended or deleted profiles are refused** with 403 even when the token is valid.
- **No account enumeration.** Login returns one message for unknown email and wrong password; password-reset and verification-resend always return 202.
- **Logout revokes** the session's refresh tokens server-side (`auth.admin.signOut`).
- Credential endpoints are rate limited to 5 requests per minute per client.

## Authorization model

Two independent checks, both server-side:

1. **Platform RBAC.** `@Auth(Permission.X)` → `PermissionsGuard` compares the permission against the role→permission table in [permissions.enum.ts](src/auth/decorators/permissions.enum.ts), the single source of truth. The role is read from Supabase **`app_metadata.app_role`**, which only the service-role key can modify. `user_metadata` is writable by any signed-in user through the public Supabase SDK and is **never** consulted; there is a test asserting that a role placed there is ignored. Unknown role values fall back to `USER`.
2. **Resource authorization.** Services check the caller's relationship to the specific record: company administration requires `company_members.role = 'admin'` for *that* company; events and opportunities require being the creator or an admin of the hosting company; personal data (ledger, redemptions, notifications, own profile, professional profile edits) is filtered by the caller's `profileId`. Platform-wide overrides are separate permissions (`COMPANY_MANAGE_ANY`, `EVENT_MANAGE_ANY`, …) held only by `PLATFORM_ADMIN`.

Hidden records (drafts, private profiles) answer **404** rather than 403, so their existence is not confirmed.

### Granting a platform administrator

There is intentionally no API for role changes. Set the role with the service-role key, e.g. in the Supabase SQL editor:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"app_role":"PLATFORM_ADMIN"}'
WHERE email = 'person@yourdomain.com';
```

The change takes effect when the user's next access token is issued.

## Supabase security model

| Credential | Where it lives | Power |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Server, and safe to ship in the Flutter app | Subject to RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server environment only** | Bypasses RLS entirely |

The service-role key must never appear in the mobile app, a browser bundle, any `VITE_*` / `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` variable, logs, crash reports, CI output or source control. `DatabaseService` is the only code that reads it, and the service-role client is used only after the API has authorized the caller.

### Row Level Security

RLS is enabled on every application table and acts as a **second line of defence** for anyone holding the anon key.

- **Read-only for clients.** The `authenticated` role has SELECT policies only. There are no INSERT, UPDATE or DELETE policies, so direct writes with the anon key fail. All writes go through the API.
- **Correct identity mapping.** Policies use `current_profile_id()` (maps `auth.uid()` to `users.id`) because domain foreign keys reference the profile id, not the auth id.
- **Role from `app_metadata`** via `is_platform_admin()`, reading `auth.jwt() -> 'app_metadata'`.
- **Membership helpers are `SECURITY DEFINER`** (`is_company_member`, `is_company_admin`) to avoid recursive policy evaluation on `company_members`.
- **Scoped reads.** Members see published content, active companies, public professional profiles, and only their own ledger, balance, redemptions, enrolments, registrations and notifications. `audit_logs` is readable by platform administrators only.

Migration `20260918090000_security_helpers_and_rls.sql` replaces the first RLS pass, which compared profile ids with `auth.uid()` and granted `USING (true)` writes on courses, rewards and news. **Any environment that ran the earlier migrations must apply it.**

### Transactional integrity

Operations where a partial write is a vulnerability run as single Postgres functions with row locks (see [ARCHITECTURE.md § Transactions](ARCHITECTURE.md#transactions)): points awards, reward redemption and cancellation, course completion, event registration, company creation. `EXECUTE` is revoked from `anon` and `authenticated`, so only the API can call them, and it always passes the caller's profile id from the verified token.

Additional database guarantees: `point_balances.balance >= 0`; ledger sign must match transaction type; unique pending redemption per member and reward; unique enrolment, registration, membership and professional profile.

## Input validation

- Global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`: unknown properties are rejected, which also blocks mass assignment at the edge.
- Every DTO field has type, length and format constraints (emails, URLs, UUIDs, enums, ISO dates, integer ranges, array sizes).
- Path ids pass through `ParseUuidPipe`.
- Updates copy only an explicit per-resource allow-list of fields (`pickDefined`). Immutable fields (slugs, owners, hosting company, opportunity type, role, status of a profile) are not in any member-editable list.
- JSON bodies are limited to 256 KB.

### Injection

- No SQL is built from user input. Data access uses the PostgREST query builder with bound values.
- Free-text search is reduced to an allow-list of characters before being placed in a PostgREST `or` filter, removing filter-grammar injection (commas, parentheses, quotes, wildcards).
- Sort columns are whitelisted per endpoint; unknown values fall back to the default.

## File upload security

- Only JPEG, PNG and WebP. SVG is excluded (it can carry script).
- Three checks: declared size (configured limit, hard ceiling 10 MiB enforced by the upload interceptor before buffering), declared MIME type and extension, and the file's **leading bytes**, which must match the declared type.
- The server generates every object path as `<profile id>/<random uuid>.<ext>`. Clients choose neither bucket nor path; the original filename is discarded.
- Deletion accepts only paths matching that exact pattern and only within the caller's own prefix.
- Storage policies allow public **read** but restrict **writes** to the service role, so the anon key cannot upload, overwrite or delete objects.

## Rate limiting and transport

- Global throttling (default 100 requests/minute per client IP) and 5/minute on credential endpoints; excess requests get 429.
- Helmet sets HSTS, `X-Content-Type-Options`, frame denial, a restrictive CSP and `Referrer-Policy: no-referrer`; `X-Powered-By` is removed.
- CORS allows only origins listed in `CORS_ORIGINS` (required in production), with no credentials. Native mobile clients are unaffected by CORS.
- Swagger UI is disabled in production.

## Error handling and logging

- A single exception filter renders all errors. Unexpected errors return a generic 500 message; stack traces, SQL text, constraint names and Supabase error messages are logged server-side only.
- Logs never contain passwords, access or refresh tokens, or keys. Authorization failures log the profile id and role, not the email.
- Production logs `error`/`warn`/`log`; debug output is development-only.
- Environment validation errors name the missing variable without printing its value.

## Audit logging

`audit_logs` records sign-up, login, logout, password change, company create/update/delete, member add/remove, role changes, news publishing and comment moderation, course and reward administration, redemptions and their fulfilment/cancellation, points adjustments, and file uploads/deletions — each with actor, action, entity, entity id, metadata and timestamp.

Metadata keys resembling secrets (`password`, `token`, `key`, `secret`, `authorization`) are redacted before storage. Audit writes never fail the business operation; a failed write is logged as an error.

## Known limitations

- **SQL functions and RLS policies are not covered by the automated suite.** Unit and e2e tests replace Supabase with an in-memory stand-in. Before production, run integration tests against a local Supabase stack that exercise each function under concurrency (e.g. parallel redemptions of the last unit) and attempt direct anon-key reads and writes against every table.
- **Rate limiting is in-memory per process.** With several API instances the effective limit multiplies, and limits reset on restart. A shared store (e.g. Redis) or an edge/WAF limit is needed for horizontal scaling.
- **Behind a proxy**, client IPs must be forwarded correctly (`app.set('trust proxy', …)`) or all clients share one rate-limit bucket.
- **Token verification is a network call** to Supabase Auth on every request. It gives immediate revocation, at the cost of latency and a hard dependency on Auth availability.
- **Role changes apply on the next token**, so a demoted administrator keeps their role until the current access token expires (Supabase default: 1 hour).
- **Uploaded images are not re-encoded or scanned for malware.** Signature checks stop type confusion but not a malicious payload inside a valid image; EXIF metadata (including GPS) is kept.
- **Public buckets**: anyone with an object URL can fetch it. Do not use these buckets for private documents.
- **No MFA, account lockout policy or bot protection (CAPTCHA)** is implemented in the API; configure what Supabase Auth offers.
- **Audit logs live in the same database** and are not tamper-evident.
- **Error-code mapping from SQL functions** relies on stable exception strings (`insufficient_points`, …). Renaming them in SQL without updating the services degrades those responses to generic 500s.
- The development seed uses a shared, published password and must never be applied to a real project.

## Deployment security checklist

- [ ] `NODE_ENV=production`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` provided through the platform's secret store, not a committed file or image layer
- [ ] Service-role key absent from the Flutter app, web builds and any public env var
- [ ] `CORS_ORIGINS` lists only real web origins
- [ ] All migrations applied, including `20260918090000_security_helpers_and_rls.sql` and `20260918091000_storage_buckets.sql`
- [ ] `seed.sql` **not** applied
- [ ] RLS confirmed enabled on every public table (`select relname from pg_class where relrowsecurity = false and relnamespace = 'public'::regnamespace`)
- [ ] Anon-key write attempts verified to fail against every table and bucket
- [ ] Supabase Auth: email confirmation on, strong password policy, leaked-password protection, sensible JWT expiry, CAPTCHA on signup
- [ ] At least one `PLATFORM_ADMIN` assigned via `app_metadata`; admin list reviewed
- [ ] TLS terminated in front of the API; `trust proxy` configured for the load balancer
- [ ] Rate limiting backed by a shared store or edge limits when running more than one instance
- [ ] Logs shipped to a store with restricted access and retention
- [ ] Dependency audit (`npm audit`) and container image scan clean
- [ ] Independent penetration test / security review completed
