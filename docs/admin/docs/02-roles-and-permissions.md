# 02 · Roles and permissions

## Three kinds of caller

| Caller | Token | Checks |
|---|---|---|
| Member (individual) | `memberAuth` JWT | Owns the resource (`/me/...`) |
| Company member | `memberAuth` JWT | Is a `CompanyMember` of the company. `owner` and `recruiter` manage listings, applicants and supplier responses; `editor` edits the company profile and portfolio; only `owner` manages company members |
| Back of House admin | `adminAuth` JWT (separate key, audience `admin`) | Holds the **permission key** named in `x-permission` on the operation |

Admin roles are bundles of permission keys. Check permissions, never role names, in the code (`@RequirePermission('listings.review')`). `GET /admin/me` returns the caller's keys so the web app can build its menu and hide buttons — the API still enforces every check.

## Permission keys

| Key | What it allows |
|---|---|
| `dashboard.overview` | Super admin overview |
| `analytics.view` | Analytics tabs, series, breakdowns, saved reports |
| `exports.create` | Report catalog, create and download exports **without** personal data |
| `exports.personal_data` | Include email / phone columns in exports |
| `exports.schedule` | Scheduled exports by email |
| `listings.view` / `listings.review` | See listings / approve, request changes, reject |
| `applications.view` | Read-only applications table |
| `suppliers.view` | Supplier requests and responses |
| `users.view` | Users table and detail (email masked) |
| `users.contact.view` | Full email and phone on user detail |
| `users.bulk` | Bulk actions (message, tag); bulk suspend also needs `accounts.suspend`, bulk export needs `exports.create` |
| `users.support_actions` | Send password-reset / verification emails |
| `users.data_requests` | Fulfil download / delete requests |
| `accounts.suspend` | Suspend / unsuspend users and companies |
| `companies.view` / `companies.edit` | Companies table and detail / edit category and city |
| `companies.feature` | "Companies to watch" (featuredToWatch, featuredOrder) |
| `verification.view` / `verification.decide` | Queue and documents / approve, ask for info, reject, remove verification |
| `claims.view` / `claims.decide` | Page claims |
| `imports.run` | Imports of companies, events and attendance |
| `imports.users` | Imports of users |
| `events.view` / `events.manage` / `events.check_in` | Events, create/edit, ingest door scans |
| `points.award_events` | Award attendance points for an event |
| `points.view` / `points.adjust` | Points ledger / manual adjustments (Support is capped, see rules) |
| `rewards.view` / `rewards.manage` / `rewards.fulfil` | Catalog and redemptions / edit catalog / mark fulfilled |
| `news.view` / `news.manage` | News list / write, schedule, publish |
| `broadcasts.view` / `broadcasts.manage` | Broadcasts list / create, test, schedule |
| `moderation.view` / `moderation.act` | Moderation queue / dismiss, warn, remove content (suspend also needs `accounts.suspend`) |
| `support.view` / `support.reply` | Support inbox / reply, assign, solve |
| `notes.view` / `notes.write` | Internal notes on users and companies |
| `team.view` / `team.manage` | Team list and role matrix / invite, change role, disable |
| `audit.view` | Audit log |
| `settings.view` / `settings.manage` | Platform settings, earning rules, taxonomy |

## Role → permissions (matches the "Team & roles" screen)

| Permission | Super admin | Reviewer | Editor | Support | Analyst |
|---|:-:|:-:|:-:|:-:|:-:|
| dashboard.overview | ✓ | | | | |
| analytics.view | ✓ | ✓ | ✓ | ✓ | ✓ |
| exports.create | ✓ | | | | ✓ |
| exports.personal_data | ✓ | | | | |
| exports.schedule | ✓ | | | | ✓ |
| listings.view | ✓ | ✓ | | | |
| listings.review | ✓ | ✓ | | | |
| applications.view | ✓ | | | | |
| suppliers.view | ✓ | ✓ | | | |
| users.view | ✓ | ✓ | | ✓ | |
| users.contact.view | ✓ | | | ✓ | |
| users.bulk | ✓ | | | | |
| users.support_actions | ✓ | | | ✓ | |
| users.data_requests | ✓ | | | | |
| accounts.suspend | ✓ | | | | |
| companies.view | ✓ | ✓ | | | |
| companies.edit | ✓ | ✓ | | | |
| companies.feature | ✓ | | | | |
| verification.view / decide | ✓ | ✓ | | | |
| claims.view / decide | ✓ | ✓ | | | |
| imports.run | ✓ | ✓ | | | |
| imports.users | ✓ | | | | |
| events.view | ✓ | | ✓ | | |
| events.manage / events.check_in | ✓ | | ✓ | | |
| points.award_events | ✓ | | ✓ | | |
| points.view | ✓ | | | ✓ | |
| points.adjust | ✓ (no cap, + or −) | | | ✓ (+ only, 500/member/month) | |
| rewards.view | ✓ | | | ✓ | |
| rewards.manage | ✓ | | | | |
| rewards.fulfil | ✓ | | | ✓ | |
| news.view / news.manage | ✓ | | ✓ | | |
| broadcasts.view / manage | ✓ | | ✓ | | |
| moderation.view | ✓ | ✓ | | ✓ (view only) | |
| moderation.act | ✓ | ✓ | | | |
| support.view | ✓ | ✓ (view only) | | ✓ | |
| support.reply | ✓ | | | ✓ | |
| notes.view / notes.write | ✓ | ✓ | | ✓ | |
| team.view / team.manage | ✓ | | | | |
| audit.view | ✓ | | | | |
| settings.view / settings.manage | ✓ | | | | |

Store this matrix in code (a typed constant) and expose it read-only through `GET /admin/roles`. Seed one Super admin from environment variables on first deploy.

## Each role's home and menu

| Role | Home (`AdminMe.home`) | Menu |
|---|---|---|
| Super admin | `overview` | Everything |
| Reviewer | `reviewer-queue` → `GET /admin/my-work/reviewer` | My queue, Analytics, Listings review, Supplier requests, Users, Companies, Verification, Claims & imports, Moderation |
| Editor | `editor-desk` → `GET /admin/my-work/editor` | My desk, Analytics, Events, News, Broadcasts |
| Support | `support-tickets` → `GET /admin/my-work/support` | My tickets, Analytics, Users, Rewards & points, Moderation, Support inbox |
| Analyst | `analyst-home` → `GET /admin/my-work/analyst` | Home, Analytics, Reports & exports |

## Row- and field-level rules

- `users.contact.view` decides whether `email` / `phone` appear on user detail; otherwise return `emailMasked` only.
- `GET /admin/users/{id}` and `GET /admin/companies/{id}` return `allowedActions` computed from the caller's keys, so the UI shows exactly the buttons that will work.
- Report catalog columns with `personalData: true` are returned with `locked: true` for callers without `exports.personal_data`.
- Support's points cap is checked in the service: sum of the caller-role's positive manual adjustments for that member in the current Riyadh calendar month + new amount ≤ `supportPointsMonthlyCap` (500).
- Company members can only read and write their own company's listings, applicants and responses. A supplier response is visible only to its author company and the requesting company.
