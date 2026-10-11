# Runbook: staff access to the admin back-office

> **Decision:** ADR-032 (D5, TQ-28).
> **Who uses this:** whoever administers the company's Google Workspace, and Super admins.

Staff sign in to the admin back-office with Google Workspace. The backend accepts only our Workspace domain. It checks both the ID token's `hd` claim and the domain of the verified email (`STAFF_GOOGLE_WORKSPACE_DOMAIN`). Access rights come from `staff_accounts` (role and status), never from Google groups.

## Operational control: 2-Step Verification

The backend has no TOTP of its own. **Two-step sign-in for staff is enforced in Google Workspace and nowhere else.** That makes this control part of the security design, not a convenience.

| Control | Setting | Owner | Check |
|---|---|---|---|
| 2-Step Verification enforced for staff | Admin console → Security → Authentication → 2-Step Verification: **Allow** and **Enforcement: On** for the organisational unit or group that holds every `staff_accounts` email. New-user enrolment period ≤ 1 week | Workspace admin | Monthly, and after any change to OUs or groups |
| Staff are in the enforced group | Every `ACTIVE` or `INVITED` email in `staff_accounts` belongs to that OU or group | Super admin with the Workspace admin | Monthly: compare the staff list (`GET /api/admin/v1/team`) with the group membership |
| Leavers | Suspend the Google account **and** set the `staff_accounts` row to `DISABLED`. Disabling deletes their sessions at once; suspending only in Google leaves a live session until the 30-minute idle timeout | Super admin | On the leaving date |

Record each monthly check (date, who checked, findings) in the security log. Missing the check is an audit finding.

## Adding a staff member

1. The Workspace admin creates the Google account in the enforced OU or group.
2. A Super admin invites them in the back-office (Team → Invite): name, work email, role. This creates a `staff_accounts` row with status `INVITED`. There is no invite link or token.
3. The person opens the admin web app and signs in with Google. On the first sign-in the row becomes `ACTIVE`.

**Sign-in failures:**
- Accounts outside the domain get 403 `NOT_STAFF`.
- Accounts on the domain without an `INVITED` or `ACTIVE` row get 403 `NOT_STAFF`.
- Every attempt is audited (`admin.sign_in`).

## Changing a role or removing access

- **Role change:** Team → change role. The person's sessions are deleted immediately; they sign in again with the new role.
- **Removing access:** Team → disable. Sessions are deleted immediately.
- **Last Super admin:** the last active Super admin can't be demoted or disabled (409 `LAST_SUPER_ADMIN`).

## Sessions

Sessions are opaque and server-side (`admin_sessions`):
- the cookie is `__Host-boh_admin`: httpOnly, Secure, SameSite=Strict;
- a session ends after **30 minutes idle**, and after **12 hours** at most;
- write requests also need the `X-CSRF-Token` header.

## If Google Workspace is unavailable

Staff can't sign in until Google recovers, and existing sessions keep working until they expire. There is no break-glass password account by design. If an emergency path is ever needed, it needs its own ADR.
