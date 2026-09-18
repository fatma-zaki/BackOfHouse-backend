# Transaction Boundaries

> Operations that **must be atomic** in PostgreSQL. Each has an id (T-xx) referenced across the docs.
> Conventions: `database-design-rules.md` §14. Every transaction below also writes `audit_logs` (where listed in `security-and-audit.md` §4) and `outbox_events` **inside** the same transaction.
> Rule: **no external network calls inside a transaction.** Payment, SMS, email and Supabase admin calls happen before (with idempotency) or after (via outbox).

---

## Summary

| ID | Operation | Module | Locks | Phase | PRD |
|---|---|---|---|---|---|
| T-01 | Claim approval → company linked to the claimant's Company Account | verification + organizations + access | case, organization | 1 | §5.2, §20.2 |
| T-02 | Create company (duplicate-safe, creator = the single owner) | organizations + access | unique constraints | 1 | §5.3, ORG-09, BQ-05 |
| T-03 | Merge organizations | organizations + participants | both organizations | 1 | ORG-09 |
| T-04 | Member removal or public-visibility change | access | membership | 1 | BQ-64, BQ-68 |
| T-05 | Accept membership invitation (Individual account) | access | invitation | 1 | BQ-68, BQ-75 |
| T-06 | Verification decision | verification + subject handler | case | 1 | §5, §29.1 |
| T-07 | Project review decision | projects | project | 1 | §7.3 |
| T-08 | Award / deduct points | engagement | balance row | 2 | §8.1, §8.6 |
| T-09 | Reverse point entry | engagement | original entry, balance row | 2 | §8.1, §20.2 |
| T-10 | Level assignment / badge award | engagement | user's active assignment | 2 | §9.1 |
| T-11 | Event registration (capacity) | events | ticket type / event | 2 | §9.2 |
| T-12 | Cancel registration + promote waitlist | events | ticket type / event | 2 | §9.2 |
| T-13 | Check-in (attendance) | events | registration | 2 | §9.2, §20.2 |
| T-14 | ⏸ deferred (rules §11) · Payment webhook → subscription | billing + entitlements | subscription | 2 | §7.5, §20.2 |
| T-15 | ⏸ deferred (rules §11) · Plan change | billing + entitlements | subscription | 2 | §7.5 |
| T-16 | ⏸ deferred (rules §11) · Coupon redemption | billing | coupon | 2 | §7.5 |
| T-17 | Submit individual application | opportunities | — (unique) | 3 | §10.3, rules §8 |
| T-18 | Close opportunity | opportunities | opportunity | 3 | §10.3 |
| T-19 | Change benchmark competitor | intelligence | benchmark set | 4 | §11.1 |
| T-20 | Export (log before release) | intelligence/institutional + audit | — | 4 | §12.3 |
| T-21 | Import commit chunk / rollback | imports + organizations | batch | 1 | §22.1 |
| T-22 | Account deactivation (later) | identity + dependants | user | later | AUTH-06 |
| T-23 | Staff role grant / revoke | access | — | 1 | §18 |
| T-24 | Employment confirmation | talent | experience | 3 | §10.1 |
| T-25 | Registration (Individual or Company flow) | profiles + identity (+ organizations) | user | 1 | §5.1, BQ-60 |
| T-26 | Suspend / unsuspend (user or organization) | identity / organizations | subject | 1 | §13 |
| T-27 | ⏸ deferred (rules §11) · Subscription expiry → entitlements | billing + entitlements | subscription | 2 | §7.5 |
| T-28 | Computed score sync (company components) | engagement | balance row | 2 | §8.3, TQ-13 |
| T-29 | Company approval decision | organizations | approval request, organization | 1 | BQ-05, BQ-46 |
| T-30 | Admin ownership flow (link the company to another Company Account) | organizations | organization | 1 | BQ-04, BQ-56, BQ-69 |
| T-31 | Submit supplier response (B2B) | opportunities | — (unique) | 3 | rules §7 |
| T-32 | Publish opportunity (JOB requires verified company) | opportunities | opportunity | 3 | rules §9, BQ-73 |

---

## Phase 1

### T-01 · Claim approval → ownership

```text
BEGIN
  SELECT verification … FOR UPDATE                       -- status must be IN_REVIEW
  assert reviewer ≠ claimant and not a member of org      -- conflict of interest
  SELECT organization … FOR UPDATE                       -- still UNCLAIMED? not SUSPENDED/ARCHIVED?
  INSERT verification_decisions (IN_REVIEW → APPROVED)
  UPDATE verifications SET status=APPROVED, decided_at
  -- subject handler (organizations):
  UPDATE organization_claims SET closed_at=now()
  assert claimant.account_type = COMPANY                                  -- BQ-60
  UPDATE organizations SET account_user_id = claimant   -- UNIQUE: one company per Company Account (BQ-68)
  UPDATE organizations SET claimed_at=now(), status=CLAIMED (derived)
  other open claims on this org stay OPEN for reviewer rejection (ASSUMPTION, BQ-55)
  -- no verification signal is set: approval ≠ verification (BQ-46)
  INSERT audit_logs (verification.approve, organization.owner_granted)
  INSERT outbox (verification.approved, organization.claim.approved, organization.owner_granted)
COMMIT
```

**Failure modes prevented:** ownership without a correct review (§20.2); two claims approved concurrently (the organization row lock + `status = UNCLAIMED` check makes the second approval fail with 409); an owner created while the decision row failed to insert.

### T-02 · Create organization (duplicate-safe)

```text
(before TX) duplicate candidate search → shown to user; user confirms "not a duplicate"
BEGIN
  INSERT organizations (DRAFT, normalised CR, website_domain, slug)
      -- UNIQUE(commercial_registration_number) / UNIQUE(slug) violations → 409 DUPLICATE_ORGANIZATION
  INSERT organization_services / organization_coverage (initial)
  assert caller.account_type = COMPANY                  -- company context only (BQ-60)
  INSERT organization_company_types (one or more)         -- BQ-61
  SET organizations.account_user_id = caller            -- the company's single user (BQ-68); UNIQUE → 409 if this account already has a company
  INSERT audit_logs · outbox(organization.created)
COMMIT
```

### T-03 · Merge organizations

```text
BEGIN
  SELECT organization_merges … FOR UPDATE                -- status PROPOSED
  SELECT organizations WHERE id IN (source, target) ORDER BY id FOR UPDATE   -- deadlock-safe order
  assert neither ARCHIVED; target not merged
  access.mergeMemberships(tx, source, target)            -- de-duplicate: user in both → role rule BQ-50; only ONE owner may remain (BQ-04)
  for participant in OrganizationMergeParticipants:      -- projects, billing, engagement, opportunities, …
      participant.moveToTarget(tx, source, target)
  move organization_contacts/services/coverage/credentials/media (dedupe)
  re-point open claims and verifications to target, or close them
  UPDATE organizations(source) SET archived_at, merged_into_organization_id=target, status=ARCHIVED
  UPDATE organization_merges SET status=APPROVED, decided_by, executed_at
  INSERT audit_logs (with moved counts) · outbox(organization.merged)
COMMIT
```

Participant conflicts (e.g. both organizations have a live subscription) **abort** the merge with a clear error for the admin to resolve first.

### T-04 · Member removal or public-visibility change (BQ-64, BQ-68)

```text
BEGIN
  assert caller is the company's Company Account (account_user_id)
  SELECT organization_members … FOR UPDATE              -- target belongs to this company
  UPDATE show_on_company_profile | status=REMOVED, removed_at, removed_by
  INSERT audit_logs · outbox(membership.visibility_changed | membership.removed)
COMMIT
```

No permissions change: memberships never grant any (BQ-68).

### T-05 · Accept membership invitation (candidate flow, BQ-75)

```text
BEGIN
  SELECT invitations WHERE token_hash=$h FOR UPDATE      -- status PENDING, expires_at > now()
  assert caller.account_type = INDIVIDUAL                -- members are Individual accounts (BQ-68)
  assert caller's verified email/phone matches invitation
  INSERT organization_members (ACTIVE, show_on_company_profile=true) … ON CONFLICT (organization_id, user_id)
      DO UPDATE SET status=ACTIVE                        -- re-joining reactivates
  UPDATE invitations SET status=ACCEPTED, accepted_by, accepted_at
  INSERT audit_logs · outbox(invitation.accepted, membership.created)
COMMIT
```

### T-06 · Verification decision (generic)

```text
BEGIN
  SELECT verifications … FOR UPDATE
  assert decider holds VERIFICATION_REVIEWER or SYSTEM_ADMIN   -- a person decides, never automation (BQ-48)
  assert valid transition (IN_REVIEW → APPROVED | REJECTED | NEEDS_INFO)
  assert conflict-of-interest rules
  INSERT verification_decisions (reason required for REJECTED/NEEDS_INFO)
  UPDATE verifications (status, decided_at, expires_at)
  handler = registry.handlerFor(type)
  handler.onApproved | onRejected (tx, case)             -- subject state changes, same TX
  INSERT audit_logs · outbox(verification.<decision> + subject events)
COMMIT
```

T-01 is the `ORGANIZATION_CLAIM` instance of T-06.

### T-07 · Project review decision

```text
BEGIN
  SELECT company_projects … FOR UPDATE                           -- status IN_REVIEW
  UPDATE company_projects SET status, reviewed_by, published_at (approve) | reason (changes/reject)
  on approve: recompute completion_score, points_score (≤ 50), fingerprint
  INSERT audit_logs · outbox(project.published | project.changes_requested | project.rejected, project.score_changed)
COMMIT
```

### T-29 · Company approval decision (BQ-05, BQ-46)

```text
BEGIN
  assert actor is SYSTEM_ADMIN with aal2
  SELECT organization_approvals … FOR UPDATE             -- status PENDING
  SELECT organizations … FOR UPDATE                      -- status DRAFT, not ARCHIVED
  approve:
      UPDATE organization_approvals SET status=APPROVED, decided_by, decided_at
      UPDATE organizations SET approved_at, approved_by, claimed_at, status = derive(facts) → CLAIMED
      -- NO verification signal, NO trust points (approval ≠ verification, BQ-46)
      INSERT outbox(organization.approved, organization.status_changed)   → search index, notification
  request changes | reject:
      assert reason present
      UPDATE organization_approvals SET status=NEEDS_CHANGES|REJECTED, reason, decided_by, decided_at
      INSERT outbox(organization.approval.changes_requested | organization.approval.rejected)
  INSERT audit_logs
COMMIT
```

### T-30 · Admin ownership flow (BQ-04, BQ-56, BQ-69)

```text
BEGIN
  assert actor is SYSTEM_ADMIN with aal2 and reason present    -- process details → BQ-56
  SELECT organizations … FOR UPDATE
  assert new Company Account exists, is ACTIVE, account_type = COMPANY, and has no company
  UPDATE organizations SET account_user_id = new_account    -- UNIQUE guarantees one company per account
  revoke sessions of the previous Company Account for this company context (after commit, outbox)
  INSERT audit_logs (old account, new account, reason) · outbox(organization.ownership.transferred)
COMMIT
```

### T-32 · Publish opportunity (BQ-73)

```text
BEGIN
  assert caller is the company's Company Account
  SELECT opportunities … FOR UPDATE                      -- DRAFT or PAUSED
  if type = JOB:
      assert employment_type IS NOT NULL
      assert organization is VERIFIED (rule BQ-53)       else 409 COMPANY_NOT_VERIFIED
  UPDATE status=PUBLISHED, published_at
  INSERT outbox(opportunity.published)
COMMIT
```

### T-21 · Import commit and rollback

- **Commit** runs as a job in **chunks** (e.g. 100 rows per transaction) so one import cannot hold locks for minutes. Each chunk:
  ```text
  BEGIN
    for row in chunk: INSERT organizations (UNCLAIMED, source_import_row_id) + children
                      contacts inserted with is_public=false (§22.1)
                      UPDATE import_rows SET created_organization_id, action
    INSERT outbox(organization.created …)
  COMMIT
  ```
  The batch-level `status` moves UPLOADED → PREVIEWED → COMMITTING → COMMITTED/FAILED. A failed chunk stops the batch; committed chunks remain and can be rolled back.
- **Rollback**
  ```text
  BEGIN
    SELECT import_batches … FOR UPDATE
    for org created by batch: if still UNCLAIMED and has no claims/members/projects → archive
                               else → report as "cannot roll back" (kept)
    UPDATE import_batches SET status=ROLLED_BACK
    INSERT audit_logs · outbox(import.rolled_back)
  COMMIT
  ```

### T-23 · Staff role grant or revoke

```text
BEGIN
  assert actor is SYSTEM_ADMIN with aal2; reason present
  INSERT user_platform_roles | UPDATE SET revoked_at
      -- partial UNIQUE prevents duplicate active grant
  assert at least one active SYSTEM_ADMIN remains (on revoke)
  INSERT audit_logs · outbox(staff_role.granted | revoked)
COMMIT
```

### T-25 · Registration (BQ-60)

```text
BEGIN
  SELECT users … FOR UPDATE                              -- account_type IS NULL (idempotent: else return current)
  INSERT consents (terms, privacy, preferences) with document versions
  INDIVIDUAL flow:
      INSERT profiles (full_name, …)
      UPDATE users SET account_type=INDIVIDUAL, onboarding_completed_at
  COMPANY flow:
      UPDATE users SET account_type=COMPANY, onboarding_completed_at
      run T-02 in the same transaction (DRAFT company + types + industries + account_user_id)
      -- no individual profile is created for a COMPANY account
  INSERT audit_logs · outbox(user.registered_as_individual | user.registered_as_company)
COMMIT
```

### T-26 · Suspend or unsuspend

```text
-- user
BEGIN
  UPDATE users SET status=SUSPENDED, suspended_at, suspension_reason
  INSERT audit_logs · outbox(user.suspended)
COMMIT
AFTER COMMIT (outbox handler): Supabase ban + session revocation (external call, retried)

-- organization
BEGIN
  SELECT organizations … FOR UPDATE
  UPDATE organizations SET suspended_at | NULL; status = derive(facts)
  INSERT audit_logs · outbox(organization.status_changed)
COMMIT
```

The API rejects a suspended user immediately (`UserStateGuard` reads `users.status`), so the Supabase call can safely happen after commit.

---

## Phase 2

### T-08 · Award or deduct points

```text
BEGIN
  INSERT point_balances (subject, category, 0) ON CONFLICT DO NOTHING
  SELECT point_balances … FOR UPDATE
  if frozen_at IS NOT NULL → skip credit (record reason), COMMIT
  version = active rule version at occurred_at
  cap checks (SUM / COUNT in ledger for rule+subject within window)  -- under the balance lock
  amount = clamp to cap / component max
  INSERT point_ledger (idempotency_key UNIQUE)           -- duplicate → unique violation → return existing (no-op)
  UPDATE point_balances SET balance = balance + amount, last_entry_id
  INSERT outbox(points.credited | points.debited)
  (manual adjustment) INSERT audit_logs
COMMIT
```

### T-09 · Reverse a point entry

```text
BEGIN
  SELECT point_ledger WHERE id=$orig FOR UPDATE          -- not itself a REVERSAL
  SELECT point_balances … FOR UPDATE
  INSERT point_ledger (REVERSAL, amount = -orig.amount, reverses_entry_id=orig)   -- UNIQUE → only once
  UPDATE point_balances SET balance = balance - orig.amount
  INSERT audit_logs (reason) · outbox(points.reversed)
COMMIT
```

### T-10 · Level assignment or badge award

```text
BEGIN
  SELECT level_assignments WHERE user_id=$u AND status='ACTIVE' FOR UPDATE
  UPDATE previous SET ended_at=now()
  INSERT level_assignments (ACTIVE | PENDING_REVIEW)     -- partial UNIQUE one ACTIVE
  INSERT audit_logs (manual) · outbox(level.changed | level.review_requested)
COMMIT
```

Badge awards: `INSERT badge_awards` guarded by a partial unique index + audit + outbox.

### T-11 · Event registration with capacity

```text
BEGIN
  SELECT events … FOR SHARE                              -- PUBLISHED, sales window open
  SELECT event_ticket_types … FOR UPDATE                 -- serialises seat allocation per ticket type
  eligibility: entitlement (feature) / level (min_level) -- read-only checks
  confirmed = COUNT(registrations WHERE ticket_type AND status='CONFIRMED')
  if confirmed < capacity (and event capacity):
       INSERT event_registrations (CONFIRMED, entry_code random)
  else INSERT event_registrations (WAITLISTED, waitlist_position = max+1)
      -- partial UNIQUE (event_id, user_id) prevents double registration
  INSERT outbox(event.registration.confirmed | waitlisted)
COMMIT
```

If an event-level capacity exists across ticket types, lock the `events` row `FOR UPDATE` instead of `FOR SHARE`.

### T-12 · Cancel and promote the waitlist

```text
BEGIN
  SELECT event_registrations WHERE id=$r FOR UPDATE      -- CONFIRMED or WAITLISTED, owned by caller
  SELECT event_ticket_types … FOR UPDATE
  UPDATE registration SET status=CANCELLED, cancelled_at, entry_code=NULL
  if it was CONFIRMED:
      next = SELECT … WHERE status='WAITLISTED' ORDER BY waitlist_position LIMIT 1 FOR UPDATE SKIP LOCKED
      UPDATE next SET status=CONFIRMED, entry_code, waitlist_position=NULL
  INSERT outbox(event.registration.cancelled, event.registration.promoted)
COMMIT
```

### T-13 · Check-in (attendance)

```text
BEGIN
  SELECT event_registrations WHERE entry_code=$c (or id) FOR UPDATE
  assert status CONFIRMED, event in progress window, attended_at IS NULL   -- second scan → 409 ALREADY_CHECKED_IN (idempotent response)
  UPDATE SET attended_at=now(), attendance_method, checked_in_by
  INSERT audit_logs (MANUAL only) · outbox(event.attendance.verified)
COMMIT
→ engagement consumes event.attendance.verified → T-08 (idempotency key = rule:registration_id)
```

Attendance and points are **separate transactions joined by the outbox**. Attendance cannot exist without its event (same TX), and points cannot exist without attendance (the only trigger). Exactly-once is guaranteed by the ledger idempotency key.

### T-14 · Payment webhook → subscription activation

```text
(verify signature — outside TX)
BEGIN
  INSERT payment_provider_events (provider, provider_event_id) ON CONFLICT DO NOTHING RETURNING id
  if no row → already processed → COMMIT, respond 200
  SELECT subscriptions … FOR UPDATE
  UPSERT payments (provider_payment_ref UNIQUE) status SUCCEEDED/FAILED
  on success: UPDATE invoices SET status=PAID
              UPDATE subscriptions SET status=ACTIVE, current_period_start/end
              entitlements.recalculate(tx, subscriber)   -- revoke old PLAN rows, insert new
  on failure: UPDATE subscriptions → GRACE_PERIOD per policy
  UPDATE payment_provider_events SET processed_at
  INSERT audit_logs · outbox(payment.*, subscription.*, entitlements.changed, invoice.issued)
COMMIT
```

**No double subscription (§20.2):** the partial unique index "one live subscription per subscriber" makes concurrent checkouts fail on the second insert. Checkout itself creates the pending subscription + invoice in a transaction **before** redirecting to the gateway, using an `Idempotency-Key`.

### T-15 · Plan change

```text
BEGIN
  SELECT subscriptions … FOR UPDATE                      -- ACTIVE
  upgrade:   UPDATE plan_id, price snapshot; create proration invoice (policy BQ-15)
             entitlements.recalculate(tx)
  downgrade: UPDATE pending_plan_id (applied by renewal job at period end, which runs T-27-like TX)
  INSERT audit_logs · outbox(subscription.plan_changed[, entitlements.changed])
COMMIT
(the payment for a proration invoice follows T-14)
```

### T-16 · Coupon redemption

```text
BEGIN
  SELECT coupons WHERE code=$c FOR UPDATE                -- active, in validity window, plan matches
  assert max_redemptions IS NULL OR redeemed_count < max_redemptions
  INSERT coupon_redemptions (UNIQUE coupon+subscription)
  UPDATE coupons SET redeemed_count = redeemed_count + 1
  apply discount to the open invoice
  INSERT outbox(coupon.redeemed)
COMMIT
```

### T-27 · Subscription expiry → entitlements

```text
BEGIN
  SELECT subscriptions … FOR UPDATE                      -- due by job
  UPDATE status EXPIRED (or apply pending_plan_id at renewal)
  entitlements.recalculate(tx) → free plan
  INSERT audit_logs · outbox(subscription.expired, entitlements.changed)
COMMIT
```

### T-28 · Computed score sync

```text
BEGIN
  SELECT point_balances (org, component) FOR UPDATE
  target = min(cap, calculate(component))                -- reads projects/org via query services
  delta = target - balance
  if delta ≠ 0: INSERT point_ledger (CREDIT/DEBIT, idempotency_key = component:org:input_hash)
                UPDATE point_balances
                INSERT outbox(points.*)
COMMIT
```

---

## Phase 3

### T-17 · Submit individual application (rules §8)

```text
BEGIN
  SELECT opportunities … FOR SHARE                       -- PUBLISHED, before deadline
  assert opportunity.audience = INDIVIDUAL                -- supplier requests never accept applications (rules §7)
  assert applicant is an individual user (account-type eligibility → BQ-60)
  INSERT applications (applicant_user_id, SUBMITTED)     -- UNIQUE (opportunity, applicant)
  INSERT outbox(application.submitted)
COMMIT
```

Status changes are single-row updates under `SELECT … FOR UPDATE`: the company may set **any** of REVIEWED, SHORTLISTED, CONTACT, ACCEPTED, REJECTED from a non-final status (flexible, BQ-67). Audited, with `application.status_changed`.

### T-31 · Submit supplier response (rules §7)

```text
BEGIN
  SELECT opportunities … FOR SHARE                       -- PUBLISHED, type = SUPPLIER_REQUEST
  assert caller is responding_organization's Company Account
  assert responding_organization ≠ opportunity.organization_id   -- a buyer cannot respond to itself
  -- any company may respond; NO company_type restriction (BQ-66)
  INSERT supplier_responses (SUBMITTED)                  -- UNIQUE (opportunity, responding_organization)
  INSERT audit_logs · outbox(supplier_response.submitted)
COMMIT
```

### T-18 · Close an opportunity

```text
BEGIN
  SELECT opportunities … FOR UPDATE                      -- PUBLISHED or PAUSED
  UPDATE status=CLOSED, outcome, closed_at
  individual audience: UPDATE applications SET status = REJECTED
        WHERE status IN (SUBMITTED, REVIEWED, SHORTLISTED, CONTACT)   -- ⚠️ closing rule for undecided applicants → BQ-67
  company audience: supplier responses stay as they are (more statuses only if defined later, BQ-66)
  INSERT audit_logs · outbox(opportunity.closed, application.status_changed ×n)
COMMIT
```

### T-24 · Employment confirmation

```text
BEGIN
  SELECT experiences … FOR UPDATE                        -- PENDING, organization_id = route org
  assert actor has organization.employment.confirm in that org
  UPDATE confirmation_status=CONFIRMED|DECLINED, confirmed_by_user_id, confirmed_at
  INSERT audit_logs · outbox(experience.confirmed | declined)
COMMIT
→ engagement awards TRUST points via T-08
```

---

## Phase 4

### T-19 · Change benchmark competitor

```text
BEGIN
  SELECT benchmark_sets WHERE organization_id=$org FOR UPDATE
  active = members WHERE removed_at IS NULL
  if adding and count(active) < 3 → INSERT member            (initial selection, no rule)
  if replacing:
      last_change = MAX(added_at of members added after initial fill, removed_at)
      assert last_change IS NULL OR now() - last_change >= 90 days   else 409 CHANGE_TOO_SOON
      UPDATE old SET removed_at; INSERT new
  assert competitor is a listed COMPANY ≠ own organization
  INSERT audit_logs · outbox(benchmark.competitor_changed)
COMMIT
```

(Exact semantics of "initial fill" vs "change" → BQ-37.)

### T-20 · Export (log before release)

```text
BEGIN
  assert permission + entitlement quota (SELECT COUNT exports this period FOR UPDATE on a quota row)
  INSERT data_exports (user, organization, purpose, format, filters, row_count, watermark_id)
  INSERT audit_logs
COMMIT
THEN generate the file (job) with the watermark → store in private bucket → return a signed URL
```

The export record **commits before** any data leaves the system, so every released file is traceable (§12.3, §20.2).

---

## Later

### T-22 · Account deactivation (AUTH-06)

```text
BEGIN
  SELECT users … FOR UPDATE
  assert (COMPANY accounts) the account is not linked to a company (ownership flow first, T-30 / BQ-56)
  UPDATE organization_members SET status=REMOVED
  anonymise profiles, experiences, contact fields; keep ledger/audit rows (pseudonymous id)
  UPDATE users SET status=DEACTIVATED, email=NULL, phone=NULL, deactivated_at
  INSERT audit_logs · outbox(user.deactivated)
COMMIT
AFTER COMMIT: delete/ban Supabase auth user; purge personal documents per retention
```

---

## Operations that deliberately span multiple transactions

| Flow | Why not one transaction | Consistency mechanism |
|---|---|---|
| Attendance → points | Different modules; points must not block check-in | Outbox + ledger idempotency key |
| Verification approved → trust points | Same | Outbox + idempotency key |
| Payment at gateway → webhook | External system | Pending subscription + webhook dedupe (T-14) |
| Suspend user → Supabase ban | External call | Immediate DB-level block + retried outbox handler |
| Search indexing | Projection | Outbox; full rebuild available |
| Notifications | External delivery | Outbox + `notification_deliveries` retries |
| Import commit | Size | Chunked transactions + batch status + rollback (T-21) |
| Report generation | Duration | Report status machine; export log committed first (T-20) |
