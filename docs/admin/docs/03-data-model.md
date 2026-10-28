# 03 · Data model

The full reference model is in `prisma/schema.prisma` (PostgreSQL). It was validated with Prisma's schema engine. **The backend already exists**, so treat it as the target shape, not as a fresh migration:

1. Map each model below to the existing table that means the same thing.
2. Keep existing table and column names; add missing columns and tables through new, reversible migrations.
3. Write the mapping in `docs/backend-gap-report.md` (see the agent instructions) before changing anything.

## Groups

| Group | Models | Notes |
|---|---|---|
| Members | `User`, `Experience`, `PortfolioItem`, `Connection`, `SavedItem`, `Device` | `shareEmail` / `sharePhone` default **false**. `pointsBalance` and `lifetimePoints` are caches of the ledger |
| Companies | `Company`, `CompanyMember`, `Follow`, `PageClaim` | `crNumber` is admin-only. `featuredToWatch` drives "Companies to watch". `followersCount` is a cache |
| Marketplace | `Listing`, `ListingReview`, `Application`, `SupplierResponse` | Supplier requests are listings with `type = supplier_request`. `checks` holds the last automated checks |
| Events & points | `Event`, `EventRegistration`, `CheckInScan`, `PointsTransaction`, `EarningRule`, `Reward`, `Redemption` | Ledger is append-only. `idempotencyKey` is unique to stop double awards |
| Trust & content | `VerificationRequest`, `ModerationCase`, `Report`, `Article`, `SupportTicket`, `TicketMessage`, `Broadcast`, `Notification`, `Upload` | Private uploads: verification docs, import files, ticket attachments |
| Back-office | `AdminUser`, `AdminInvite`, `AdminSession`, `AuditLog`, `InternalNote`, `ImportJob`, `Export`, `ScheduledExport`, `SavedReport`, `Setting`, `TaxonomyItem`, `IdempotencyRecord` | `AuditLog` is append-only (no UPDATE/DELETE grants). TOTP secrets encrypted at rest |

## Integrity rules worth a database constraint

| Rule | Constraint |
|---|---|
| One application per member per listing | `UNIQUE (listingId, applicantId)` |
| One response per supplier per request | `UNIQUE (listingId, supplierCompanyId)` |
| One registration per member per event | `UNIQUE (eventId, userId)` |
| Door scans idempotent per pass per day | `UNIQUE (eventId, passCode, day)` |
| Attendance points awarded once | `PointsTransaction.idempotencyKey UNIQUE` = `event_attendance:<userId>:<eventId>` |
| Profile-completed points once | idempotency key `profile_completed:<userId>` |
| Redemption can't overspend | Transaction with `SELECT … FOR UPDATE` on the user row; check `pointsBalance >= cost` and reward stock in the same transaction |
| Ledger never edited | Revoke UPDATE/DELETE on `PointsTransaction` and `AuditLog` for the app role |

## Caches and how to keep them right

- `User.pointsBalance`, `User.lifetimePoints` — updated in the same transaction as each ledger insert. A nightly job recomputes them from the ledger and logs any drift.
- `Company.followersCount`, `Listing.applicationsCount`, `Reward.redeemedCount` — updated in the same transaction as the insert/delete.
- Dashboard numbers — computed by SQL views or materialized views refreshed every 15 minutes (see doc 06).

## Bilingual fields

Content written by the team is stored in both languages (`titleEn/titleAr`, `headlineEn/headlineAr`, `TaxonomyItem.nameEn/nameAr`, `Company.name/nameAr`). Member endpoints return one language (from `Accept-Language`, falling back to English). Admin endpoints return and accept both as `LocalizedText { en, ar }`.

Member-written text (listing descriptions, messages, bios) is stored as written, in one language.
