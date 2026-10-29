# OWASP ASVS Level 2: checklist

> **Security bar.** OWASP Application Security Verification Standard 5.0, Level 2 (execution-plan.md Phase 1, review change 9).
>
> **How it's tracked.** This file is updated in the PR of every phase that touches a chapter. It starts per chapter.
>
> **Launch gate.** Phase 9 expands it to one row per Level 2 requirement and must reach no `FAIL` rows before launch, together with the external penetration test.
>
> **Status values:**
> - `PASS`: implemented and tested;
> - `PARTIAL`: the foundation exists, more comes in a named phase;
> - `PLANNED`: not built yet;
> - `N/A`: does not apply, with the reason;
> - `FAIL`: a known gap.

| Chapter | Status | Evidence today | Next step |
|---|---|---|---|
| V1 Encoding and Sanitization | PARTIAL | JSON only; Prisma tagged-template SQL, with `$queryRawUnsafe` banned by ESLint; error bodies never echo input | Rich-text sanitising for articles (Phase 7) |
| V2 Validation and Business Logic | PARTIAL | Global `ValidationPipe` (whitelist, forbid unknown, 422); settings schema enforces D9; business rules in domain policies (`settings.policy.ts`), tested by direct service calls with disallowed actors | Per-module rules from Phase 2 onward; anti-automation limits on auth (Phase 2) |
| V3 Web Frontend Security | PARTIAL | Helmet (CSP `default-src 'self'`, `frame-ancestors 'none'`, no-referrer); `x-powered-by` off; admin cookies `__Host-` + SameSite=Strict + CSRF double-submit (e2e-tested) | Admin-only CORS origin list (with the admin web deployment) |
| V4 API and Web Service | PARTIAL | Contract-first OpenAPI per surface, checked in CI; body size limit 256 kB; deny-by-default per surface; `Idempotency-Key` store | Response-body contract tests (jest-openapi, later in Phase 1) |
| V5 File Handling | PLANNED | Storage port with signed URLs only | Uploads with quarantine + virus scan (waits on hosting, TQ-10) |
| V6 Authentication | PARTIAL | Staff: Google Workspace only; `hd` AND email domain AND `email_verified`; no staff passwords or TOTP stored; MFA enforced in Workspace (runbook control); sign-in limited to 20/min/IP; every refusal audited | Member auth via Supabase behind `/auth/*`, phone OTP limits (BQ-78, TQ-04) |
| V7 Session Management | PARTIAL | Admin: opaque 256-bit token stored hashed; 30-min idle, 12 h absolute; revoked on sign-out, role change and disable (e2e-tested) | Member JWT refresh rotation (member identity) |
| V8 Authorization | PARTIAL | Permission matrix in code, matching the hand-off table (unit-tested); `PermissionGuard` + domain policies checked again in services; role × operation e2e for every implemented admin op (`test/authz`); `LAST_SUPER_ADMIN` under row lock | Company context checks (member identity) |
| V9 Self-contained Tokens | PLANNED | — | Member JWT verification via JWKS (issuer, audience, expiry), Phase 2 |
| V10 OAuth and OIDC | PARTIAL | Staff OIDC: code flow + PKCE S256; state single use, stored server-side, 10 min; nonce check; ID token RS256 against Google JWKS (issuer, audience, expiry, issued-at); `return_to` limited to admin paths (no open redirect) | Live test against Google in staging |
| V11 Cryptography | PARTIAL | Request hashing with SHA-256 (idempotency); no custom crypto | Secrets manager (waits on hosting) |
| V12 Secure Communication | PLANNED | — | TLS everywhere, DB `sslmode` (waits on hosting) |
| V13 Configuration | PARTIAL | Env validated at boot (zod), fails closed; Swagger off in production; gitleaks; `npm audit` high gate; CodeQL; Dependabot; squawk on new migrations | Container image scan, environment separation (waits on hosting) |
| V14 Data Protection | PARTIAL | Private `app` schema, no client-role rights, RLS deny-all backstop; log redaction; audit redaction; DB sessions pinned to UTC | Retention jobs and consent records (D10 / BQ-31) |
| V15 Secure Coding and Architecture | PARTIAL | Two surfaces with boundary rules and a boot-time route check; modules only through `index.ts`; no circular imports | Threat model per surface before launch (Phase 9) |
| V16 Security Logging and Error Handling | PARTIAL | Append-only audit log (grants + trigger); admin writes must audit (enforced); `@AuditRead` for sensitive reads, fail closed; `{code, message, trace_id}` errors without internals | OpenTelemetry + Sentry (later in Phase 1) |
| V17 WebRTC | N/A | No real-time media | — |
