# 05 · Screen → API map

Every HTML screen in the hand-off package and the endpoints it needs. App screens live in `screens/<version>/<file>.html`; admin and team screens in `admin/<version>/<file>.html`. Role versions of a shared admin screen (e.g. `reviewer-users`) call the same endpoints as the Super admin screen; the API filters actions by the caller's permissions.

## Mobile app (members and companies)

### Onboarding

**Splash** — `splash.html`  
- No API call (static). Optionally `GET /v1/meta/taxonomy` to warm caches.

**Welcome** — `welcome.html`  
- No API call.

**Sign up** — `sign-up.html`  
- `POST /v1/auth/register` — Create an account (individual or company)

**Sign in** — `sign-in.html`  
- `POST /v1/auth/login` — Sign in

### Individual · main tabs

**Home** — `home.html`  
- `GET /v1/me` — Current member profile, points and settings
- `GET /v1/home` — Home feed: featured event, opportunities for you, points summary
- `GET /v1/listings` — Browse live opportunities
- `PUT /v1/me/saved/listings/{id}` — Save an opportunity
- `GET /v1/me/points` — Points balance, level and progress

**Discover (events)** — `discover.html`  
- `GET /v1/search` — Search everything (events, listings, companies, professionals, news)
- `GET /v1/events` — Browse events
- `GET /v1/listings` — Browse live opportunities

**News** — `news.html`  
- `GET /v1/articles` — Published news

**Rewards** — `rewards.html`  
- `GET /v1/me/points` — Points balance, level and progress
- `GET /v1/rewards` — Rewards catalog
- `POST /v1/rewards/{id}/redeem` — Redeem a reward

**Profile** — `profile.html`  
- `GET /v1/me` — Current member profile, points and settings
- `PATCH /v1/me/preferences` — Language, theme and notification preferences
- `GET /v1/me/registrations` — My events (upcoming and past)
- `GET /v1/me/applications` — My applications
- `GET /v1/me/verification-requests/latest` — Status of my latest verification request

### Individual · events

**Event details** — `event-details.html`  
- `GET /v1/events/{id}` — Event details (with my registration if any)
- `POST /v1/events/{id}/registrations` — Register for an event (earns 0 points)

**Registration confirmed** — `event-registered.html`  
- `POST /v1/events/{id}/registrations` — Register for an event (earns 0 points)
- `GET /v1/me/registrations` — My events (upcoming and past)

### Individual · opportunities

**Opportunity details** — `opportunity-details.html`  
- `GET /v1/listings/{id}` — Opportunity details with my eligibility
- `PUT /v1/me/saved/listings/{id}` — Save an opportunity
- `POST /v1/reports` — Report content or an account

**Apply** — `apply.html`  
- `POST /v1/listings/{id}/applications` — Apply to an opportunity

**My applications** — `my-applications.html`  
- `GET /v1/me/applications` — My applications
- `GET /v1/me/applications/{id}` — One application with its status tracker

### Individual · discover

**Companies index** — `companies-directory.html`  
- `GET /v1/companies` — Companies index (A–Z)
- `PUT /v1/companies/{id}/follow` — Follow a company

**Company page** — `company-page.html`  
- `GET /v1/listings` — Browse live opportunities
- `GET /v1/companies/{idOrSlug}` — Public company page
- `GET /v1/companies/{id}/events` — Events organised by the company
- `PUT /v1/companies/{id}/follow` — Follow a company
- `POST /v1/reports` — Report content or an account

**Professionals directory** — `professionals-directory.html`  
- `GET /v1/professionals` — Professionals directory (highlighted members first)

**Search – no results** — `search-no-results.html`  
- `GET /v1/search` — Search everything (events, listings, companies, professionals, news)

### Individual · news & alerts

**News article** — `news-article.html`  
- `GET /v1/articles/{slug}` — One article (counts a read)

**Notifications** — `notifications.html`  
- `GET /v1/notifications` — My notifications
- `POST /v1/notifications/read` — Mark notifications read

### Individual · rewards & profile

**Reward redeemed** — `reward-redeemed.html`  
- `POST /v1/rewards/{id}/redeem` — Redeem a reward
- `GET /v1/me/redemptions/{id}` — One redemption with its code

**Points history** — `points-history.html`  
- `GET /v1/me/points` — Points balance, level and progress
- `GET /v1/me/points/transactions` — Points history

**Edit profile** — `edit-profile.html`  
- `PATCH /v1/me` — Update profile
- `PUT /v1/me/contact-sharing` — Set contact privacy (share email / phone with companies)

**Get verified** — `get-verified.html`  
- `POST /v1/me/verification-requests` — Ask to be verified (upload documents)
- `GET /v1/me/verification-requests/latest` — Status of my latest verification request

### Company

**Company dashboard** — `company-dashboard.html`  
- `GET /v1/company/dashboard` — Company dashboard

**Company listings** — `company-listings.html`  
- `GET /v1/company/listings` — My company's listings
- `GET /v1/company/listings/{id}` — One listing with review feedback

**New listing** — `company-new-listing.html`  
- `POST /v1/company/listings` — Create a listing (saved as draft)
- `POST /v1/company/listings/{id}/submit` — Submit for review

**Applicants** — `company-applicants.html`  
- `GET /v1/company/listings/{id}/applications` — Applicants for a listing

**Applicant detail** — `company-applicant-detail.html`  
- `GET /v1/company/applications/{id}` — Applicant detail (contact only if shared)
- `POST /v1/company/applications/{id}/status` — Move an applicant (shortlist, not selected, selected)

**Supplier requests** — `company-supplier-requests.html`  
- `GET /v1/company/supplier-requests` — Open supplier requests this company can respond to

**Respond to supplier request** — `company-respond-request.html`  
- `POST /v1/company/supplier-requests/{id}/responses` — Respond to a supplier request

**Company profile** — `company-profile.html`  
- `GET /v1/company/profile` — Company profile and portfolio (as the company sees it)
- `PATCH /v1/company/profile` — Edit company profile
- `POST /v1/company/portfolio` — Add a portfolio item

## Admin back-office and team flows

### Super admin · back-office

**Sign in** — `sign-in.html`  
- `POST /v1/admin/auth/login` — Admin sign-in step 1 (email + password)
- `POST /v1/admin/auth/mfa/verify` — Admin sign-in step 2 (two-step code)

**Overview** — `overview.html`  
- `GET /v1/admin/overview` · `dashboard.overview` — Super admin overview
- `GET /v1/admin/analytics/series/{key}` · `analytics.view` — Time series (weekly-active-users, daily-signups, applications-per-week…)

**Analytics** — `analytics.html`  
- `GET /v1/admin/analytics/kpis` · `analytics.view` — KPI tiles for a tab
- `GET /v1/admin/analytics/series/{key}` · `analytics.view` — Time series (weekly-active-users, daily-signups, applications-per-week…)
- `GET /v1/admin/analytics/breakdowns/{key}` · `analytics.view` — Breakdowns (members-by-city, applications-by-type, funnel, tickets-by-topic…)
- `GET /v1/admin/analytics/top-listings` · `analytics.view` — Top listings by applications

**Reports & exports** — `reports-exports.html`  
- `GET /v1/admin/reports/catalog` · `exports.create` — Report catalog with row counts and columns
- `POST /v1/admin/exports` · `exports.create` — Create an export (async)
- `GET /v1/admin/exports` · `exports.create` — My recent exports

**Listings review** — `listings-review.html`  
- `GET /v1/admin/listings` · `listings.view` — Listings review queue and all listings
- `GET /v1/admin/listings/{id}` · `listings.view` — Listing with automated checks and review history

**Applications** — `applications.html`  
- `GET /v1/admin/applications` · `applications.view` — All applications (read-only)

**Supplier requests** — `supplier-requests.html`  
- `GET /v1/admin/supplier-requests` · `suppliers.view` — Supplier requests with response counts
- `GET /v1/admin/supplier-requests/{id}/responses` · `suppliers.view` — Responses on a request

**Users** — `users.html`  
- `GET /v1/admin/users` · `users.view` — Users table
- `POST /v1/admin/users/bulk` · `users.bulk` — Bulk action on selected users

**User detail** — `user-detail.html`  
- `GET /v1/admin/users/{id}` · `users.view` — User detail
- `GET /v1/admin/users/{id}/points` · `users.view` — User points history
- `GET /v1/admin/{subject}/{id}/notes` · `notes.view` — Internal notes on a user or company

**Companies** — `companies.html`  
- `GET /v1/admin/companies` · `companies.view` — Companies table

**Company detail** — `company-detail.html`  
- `GET /v1/admin/{subject}/{id}/notes` · `notes.view` — Internal notes on a user or company
- `GET /v1/admin/companies/{id}` · `companies.view` — Company detail
- `PATCH /v1/admin/companies/{id}` · `companies.edit` — Edit category/city, feature in Companies to watch
- `GET /v1/admin/companies/{id}/listings` · `companies.view` — Company listings

**Verification** — `verification.html`  
- `GET /v1/admin/verification-requests` · `verification.view` — Verification queue
- `GET /v1/admin/verification-requests/{id}` · `verification.view` — Request with signed document URLs and checks

**Claims & imports** — `claims-imports.html`  
- `GET /v1/admin/claims` · `claims.view` — Company page claims
- `POST /v1/admin/imports` · `imports.run` — Start an import (validates and builds a preview)
- `GET /v1/admin/imports` · `imports.run` — Recent imports

**Events** — `events.html`  
- `POST /v1/admin/imports` · `imports.run` — Start an import (validates and builds a preview)
- `GET /v1/admin/events` · `events.view` — Events table
- `GET /v1/admin/events/{id}/attendance` · `events.view` — Attendance summary
- `POST /v1/admin/events/{id}/award-points` · `points.award_events` — Award attendance points to verified attendees

**News** — `news.html`  
- `GET /v1/admin/articles` · `news.view` — News list

**Rewards & points** — `rewards-points.html`  
- `GET /v1/admin/rewards` · `rewards.view` — Rewards catalog
- `POST /v1/admin/points/adjustments` · `points.adjust` — Manual points adjustment
- `GET /v1/admin/earning-rules` · `rewards.view` — How points are earned

**Moderation** — `moderation.html`  
- `GET /v1/admin/moderation/cases` · `moderation.view` — Moderation queue

**Support inbox** — `support-inbox.html`  
- `GET /v1/admin/support/tickets` · `support.view` — Support inbox

**Broadcasts** — `broadcasts.html`  
- `GET /v1/admin/broadcasts` · `broadcasts.view` — Sent and scheduled broadcasts

**Team & roles** — `team-roles.html`  
- `GET /v1/admin/team` · `team.view` — Admins and pending invites
- `GET /v1/admin/roles` · `team.view` — Role permission matrix

**Audit log** — `audit-log.html`  
- `GET /v1/admin/audit-log` · `audit.view` — Audit log (append-only)

**Settings** — `settings.html`  
- `GET /v1/admin/earning-rules` · `rewards.view` — How points are earned
- `GET /v1/admin/settings` · `settings.view` — Platform settings
- `GET /v1/admin/taxonomy/{kind}` · `settings.view` — Listing types, crafts, cities, company categories, news categories

### Team flow · Super admin invites a teammate

**Invite a teammate** — `team-invite.html`  
- `GET /v1/admin/roles` · `team.view` — Role permission matrix
- `POST /v1/admin/team/invites` · `team.manage` — Invite a teammate

**New teammate joins (two-step sign-in)** — `team-join.html`  
- `GET /v1/admin/invites/{token}` — Look up an invite (name, role, inviter)
- `POST /v1/admin/invites/{token}/accept` — Accept an invite and set a password
- `POST /v1/admin/auth/mfa/confirm` — Confirm two-step setup with the first code

### Team flow · Reviewer

**My queue** — `reviewer-my-queue.html`  
- `GET /v1/admin/my-work/reviewer` · `listings.review` — Reviewer home: unified queue sorted by deadline

**Listings review** · Reviewer — `reviewer-listings-review.html`  
- `GET /v1/admin/listings` · `listings.view` — Listings review queue and all listings

**Request changes** — `reviewer-request-changes.html`  
- `POST /v1/admin/listings/{id}/request-changes` · `listings.review` — Send back to the company with reasons

**Changes sent** — `reviewer-changes-sent.html`  
- `POST /v1/admin/listings/{id}/request-changes` · `listings.review` — Send back to the company with reasons

**Approved** — `reviewer-approved.html`  
- `POST /v1/admin/listings/{id}/approve` · `listings.review` — Approve and publish

**Verification** · Reviewer — `reviewer-verification.html` (same as `verification`, filtered by role)  
- `GET /v1/admin/verification-requests` · `verification.view` — Verification queue
- `GET /v1/admin/verification-requests/{id}` · `verification.view` — Request with signed document URLs and checks

**Claims & imports** · Reviewer — `reviewer-claims-imports.html` (same as `claims-imports`, filtered by role)  
- `GET /v1/admin/claims` · `claims.view` — Company page claims
- `POST /v1/admin/imports` · `imports.run` — Start an import (validates and builds a preview)
- `GET /v1/admin/imports` · `imports.run` — Recent imports

**Moderation** · Reviewer — `reviewer-moderation.html` (same as `moderation`, filtered by role)  
- `GET /v1/admin/moderation/cases` · `moderation.view` — Moderation queue

**Supplier requests** · Reviewer — `reviewer-supplier-requests.html` (same as `supplier-requests`, filtered by role)  
- `GET /v1/admin/supplier-requests` · `suppliers.view` — Supplier requests with response counts
- `GET /v1/admin/supplier-requests/{id}/responses` · `suppliers.view` — Responses on a request

**Companies** · Reviewer — `reviewer-companies.html` (same as `companies`, filtered by role)  
- `GET /v1/admin/companies` · `companies.view` — Companies table

**Company detail** · Reviewer — `reviewer-company-detail.html` (same as `company-detail`, filtered by role)  
- `GET /v1/admin/{subject}/{id}/notes` · `notes.view` — Internal notes on a user or company
- `GET /v1/admin/companies/{id}` · `companies.view` — Company detail
- `PATCH /v1/admin/companies/{id}` · `companies.edit` — Edit category/city, feature in Companies to watch
- `GET /v1/admin/companies/{id}/listings` · `companies.view` — Company listings

**Users** · Reviewer — `reviewer-users.html` (same as `users`, filtered by role)  
- `GET /v1/admin/users` · `users.view` — Users table
- `POST /v1/admin/users/bulk` · `users.bulk` — Bulk action on selected users

**User detail** · Reviewer — `reviewer-user-detail.html` (same as `user-detail`, filtered by role)  
- `GET /v1/admin/users/{id}` · `users.view` — User detail
- `GET /v1/admin/users/{id}/points` · `users.view` — User points history
- `GET /v1/admin/{subject}/{id}/notes` · `notes.view` — Internal notes on a user or company

**Analytics** · Reviewer — `reviewer-analytics.html` (same as `analytics`, filtered by role)  
- `GET /v1/admin/analytics/kpis` · `analytics.view` — KPI tiles for a tab
- `GET /v1/admin/analytics/series/{key}` · `analytics.view` — Time series (weekly-active-users, daily-signups, applications-per-week…)
- `GET /v1/admin/analytics/breakdowns/{key}` · `analytics.view` — Breakdowns (members-by-city, applications-by-type, funnel, tickets-by-topic…)
- `GET /v1/admin/analytics/top-listings` · `analytics.view` — Top listings by applications

### Team flow · Editor (news)

**My desk** — `editor-my-desk.html`  
- `GET /v1/admin/my-work/editor` · `news.manage` — Editor desk: drafts, week calendar, most read
- `POST /v1/admin/articles/{id}/unschedule` · `news.manage` — Back to draft

**News editor** · Editor — `editor-news-editor.html`  
- `GET /v1/admin/articles` · `news.view` — News list
- `PATCH /v1/admin/articles/{id}` · `news.manage` — Autosave a draft

**Preview (EN + AR)** — `editor-preview.html`  
- `GET /v1/admin/articles/{id}/checks` · `news.manage` — Pre-publish checklist

**Schedule story** — `editor-schedule.html`  
- `POST /v1/admin/articles/{id}/schedule` · `news.manage` — Publish now or schedule

**Events** · Editor — `editor-events.html`  
- `GET /v1/admin/events` · `events.view` — Events table

**Broadcasts** · Editor — `editor-broadcasts.html` (same as `broadcasts`, filtered by role)  
- `GET /v1/admin/broadcasts` · `broadcasts.view` — Sent and scheduled broadcasts

**Analytics** · Editor — `editor-analytics.html` (same as `analytics`, filtered by role)  
- `GET /v1/admin/analytics/kpis` · `analytics.view` — KPI tiles for a tab
- `GET /v1/admin/analytics/series/{key}` · `analytics.view` — Time series (weekly-active-users, daily-signups, applications-per-week…)
- `GET /v1/admin/analytics/breakdowns/{key}` · `analytics.view` — Breakdowns (members-by-city, applications-by-type, funnel, tickets-by-topic…)
- `GET /v1/admin/analytics/top-listings` · `analytics.view` — Top listings by applications

### Team flow · Support

**My tickets** — `support-my-tickets.html`  
- `GET /v1/admin/my-work/support` · `support.reply` — Support home: my tickets and topics

**Support ticket** · Support — `support-ticket.html`  
- `GET /v1/admin/support/tickets` · `support.view` — Support inbox
- `POST /v1/admin/support/tickets/{id}/messages` · `support.reply` — Reply or add an internal note

**Adjust points** — `support-adjust-points.html`  
- `POST /v1/admin/points/adjustments` · `points.adjust` — Manual points adjustment

**Ticket solved** — `support-solved.html`  
- `POST /v1/admin/support/tickets/{id}/messages` · `support.reply` — Reply or add an internal note

**Users** · Support — `support-users.html` (same as `users`, filtered by role)  
- `GET /v1/admin/users` · `users.view` — Users table
- `POST /v1/admin/users/bulk` · `users.bulk` — Bulk action on selected users

**User detail** · Support — `support-user-detail.html` (same as `user-detail`, filtered by role)  
- `GET /v1/admin/users/{id}` · `users.view` — User detail
- `GET /v1/admin/users/{id}/points` · `users.view` — User points history
- `GET /v1/admin/{subject}/{id}/notes` · `notes.view` — Internal notes on a user or company

**Rewards & points** · Support — `support-rewards-points.html` (same as `rewards-points`, filtered by role)  
- `GET /v1/admin/rewards` · `rewards.view` — Rewards catalog
- `POST /v1/admin/points/adjustments` · `points.adjust` — Manual points adjustment
- `GET /v1/admin/earning-rules` · `rewards.view` — How points are earned

**Moderation** · Support — `support-moderation.html` (same as `moderation`, filtered by role)  
- `GET /v1/admin/moderation/cases` · `moderation.view` — Moderation queue

**Analytics** · Support — `support-analytics.html` (same as `analytics`, filtered by role)  
- `GET /v1/admin/analytics/kpis` · `analytics.view` — KPI tiles for a tab
- `GET /v1/admin/analytics/series/{key}` · `analytics.view` — Time series (weekly-active-users, daily-signups, applications-per-week…)
- `GET /v1/admin/analytics/breakdowns/{key}` · `analytics.view` — Breakdowns (members-by-city, applications-by-type, funnel, tickets-by-topic…)
- `GET /v1/admin/analytics/top-listings` · `analytics.view` — Top listings by applications

### Team flow · Analyst

**Home** — `analyst-home.html`  
- `GET /v1/admin/my-work/analyst` · `analytics.view` — Analyst home: KPIs and saved reports
- `GET /v1/admin/analytics/series/{key}` · `analytics.view` — Time series (weekly-active-users, daily-signups, applications-per-week…)
- `GET /v1/admin/saved-reports` · `analytics.view` — Saved reports

**Reports & exports** · Analyst — `analyst-reports-exports.html`  
- `GET /v1/admin/reports/catalog` · `exports.create` — Report catalog with row counts and columns

**Export ready** — `analyst-export-ready.html`  
- `POST /v1/admin/exports` · `exports.create` — Create an export (async)

**Analytics** · Analyst — `analyst-analytics.html` (same as `analytics`, filtered by role)  
- `GET /v1/admin/analytics/kpis` · `analytics.view` — KPI tiles for a tab
- `GET /v1/admin/analytics/series/{key}` · `analytics.view` — Time series (weekly-active-users, daily-signups, applications-per-week…)
- `GET /v1/admin/analytics/breakdowns/{key}` · `analytics.view` — Breakdowns (members-by-city, applications-by-type, funnel, tickets-by-topic…)
- `GET /v1/admin/analytics/top-listings` · `analytics.view` — Top listings by applications

## Full endpoint index

| Method | Path | Area | Permission | Summary |
|---|---|---|---|---|
| POST | `/v1/auth/register` | Auth | public | Create an account (individual or company) |
| POST | `/v1/auth/login` | Auth | public | Sign in |
| POST | `/v1/auth/refresh` | Auth | public | Rotate tokens |
| POST | `/v1/auth/logout` | Auth | signed-in | Revoke the refresh token |
| POST | `/v1/auth/password/forgot` | Auth | public | Send a password reset email |
| POST | `/v1/auth/password/reset` | Auth | public | Set a new password with a reset token |
| GET | `/v1/me` | Me | signed-in | Current member profile, points and settings |
| PATCH | `/v1/me` | Me | signed-in | Update profile |
| PUT | `/v1/me/contact-sharing` | Me | signed-in | Set contact privacy (share email / phone with companies) |
| PATCH | `/v1/me/preferences` | Me | signed-in | Language, theme and notification preferences |
| POST | `/v1/me/data-requests` | Me | signed-in | Ask for a copy of my data or account deletion |
| POST | `/v1/uploads` | Uploads | signed-in | Get a pre-signed upload URL |
| GET | `/v1/home` | Home | signed-in | Home feed: featured event, opportunities for you, points summary |
| GET | `/v1/search` | Home | signed-in | Search everything (events, listings, companies, professionals, news) |
| GET | `/v1/events` | Events | signed-in | Browse events |
| GET | `/v1/events/{id}` | Events | signed-in | Event details (with my registration if any) |
| POST | `/v1/events/{id}/registrations` | Events | signed-in | Register for an event (earns 0 points) |
| DELETE | `/v1/events/{id}/registrations/me` | Events | signed-in | Cancel my registration |
| GET | `/v1/me/registrations` | Events | signed-in | My events (upcoming and past) |
| PUT | `/v1/me/saved/events/{id}` | Events | signed-in | Save an event |
| DELETE | `/v1/me/saved/events/{id}` | Events | signed-in | Unsave an event |
| GET | `/v1/listings` | Listings | signed-in | Browse live opportunities |
| GET | `/v1/listings/{id}` | Listings | signed-in | Opportunity details with my eligibility |
| PUT | `/v1/me/saved/listings/{id}` | Listings | signed-in | Save an opportunity |
| DELETE | `/v1/me/saved/listings/{id}` | Listings | signed-in | Unsave an opportunity |
| POST | `/v1/listings/{id}/applications` | Listings | signed-in | Apply to an opportunity |
| GET | `/v1/me/applications` | Listings | signed-in | My applications |
| GET | `/v1/me/applications/{id}` | Listings | signed-in | One application with its status tracker |
| POST | `/v1/me/applications/{id}/withdraw` | Listings | signed-in | Withdraw an application |
| GET | `/v1/companies` | Companies | signed-in | Companies index (A–Z) |
| GET | `/v1/companies/{idOrSlug}` | Companies | signed-in | Public company page |
| GET | `/v1/companies/{id}/events` | Companies | signed-in | Events organised by the company |
| PUT | `/v1/companies/{id}/follow` | Companies | signed-in | Follow a company |
| DELETE | `/v1/companies/{id}/follow` | Companies | signed-in | Unfollow a company |
| POST | `/v1/companies/{id}/claims` | Companies | signed-in | Claim a company page that was created from an import |
| GET | `/v1/professionals` | Professionals | signed-in | Professionals directory (highlighted members first) |
| GET | `/v1/professionals/{id}` | Professionals | signed-in | Public profile of a member (contact details never included) |
| POST | `/v1/professionals/{id}/connections` | Professionals | signed-in | Send a connection request |
| POST | `/v1/me/connections/{id}/accept` | Professionals | signed-in | Accept a connection request |
| GET | `/v1/articles` | News | public | Published news |
| GET | `/v1/articles/{slug}` | News | public | One article (counts a read) |
| GET | `/v1/notifications` | Notifications | signed-in | My notifications |
| POST | `/v1/notifications/read` | Notifications | signed-in | Mark notifications read |
| PUT | `/v1/me/devices` | Notifications | signed-in | Register a push token |
| GET | `/v1/me/points` | Rewards | signed-in | Points balance, level and progress |
| GET | `/v1/me/points/transactions` | Rewards | signed-in | Points history |
| GET | `/v1/rewards` | Rewards | signed-in | Rewards catalog |
| POST | `/v1/rewards/{id}/redeem` | Rewards | signed-in | Redeem a reward |
| GET | `/v1/me/redemptions/{id}` | Rewards | signed-in | One redemption with its code |
| POST | `/v1/me/verification-requests` | Verification | signed-in | Ask to be verified (upload documents) |
| GET | `/v1/me/verification-requests/latest` | Verification | signed-in | Status of my latest verification request |
| POST | `/v1/reports` | Reports & support | signed-in | Report content or an account |
| POST | `/v1/support/tickets` | Reports & support | signed-in | Contact support |
| GET | `/v1/me/support/tickets` | Reports & support | signed-in | My support tickets |
| GET | `/v1/me/support/tickets/{id}` | Reports & support | signed-in | One of my tickets with public messages |
| POST | `/v1/me/support/tickets/{id}/messages` | Reports & support | signed-in | Reply on my ticket |
| GET | `/v1/company/dashboard` | Company workspace | signed-in | Company dashboard |
| GET | `/v1/company/listings` | Company workspace | signed-in | My company's listings |
| POST | `/v1/company/listings` | Company workspace | signed-in | Create a listing (saved as draft) |
| GET | `/v1/company/listings/{id}` | Company workspace | signed-in | One listing with review feedback |
| PATCH | `/v1/company/listings/{id}` | Company workspace | signed-in | Edit a draft or a listing with changes requested |
| POST | `/v1/company/listings/{id}/submit` | Company workspace | signed-in | Submit for review |
| POST | `/v1/company/listings/{id}/close` | Company workspace | signed-in | Close a listing |
| GET | `/v1/company/listings/{id}/applications` | Company workspace | signed-in | Applicants for a listing |
| GET | `/v1/company/applications/{id}` | Company workspace | signed-in | Applicant detail (contact only if shared) |
| POST | `/v1/company/applications/{id}/status` | Company workspace | signed-in | Move an applicant (shortlist, not selected, selected) |
| GET | `/v1/company/supplier-requests` | Company workspace | signed-in | Open supplier requests this company can respond to |
| POST | `/v1/company/supplier-requests/{id}/responses` | Company workspace | signed-in | Respond to a supplier request |
| GET | `/v1/company/listings/{id}/responses` | Company workspace | signed-in | Responses received on my supplier request |
| POST | `/v1/company/responses/{id}/status` | Company workspace | signed-in | Shortlist, decline or award a supplier response |
| GET | `/v1/company/profile` | Company workspace | signed-in | Company profile and portfolio (as the company sees it) |
| PATCH | `/v1/company/profile` | Company workspace | signed-in | Edit company profile |
| POST | `/v1/company/portfolio` | Company workspace | signed-in | Add a portfolio item |
| DELETE | `/v1/company/portfolio/{id}` | Company workspace | signed-in | Remove a portfolio item |
| POST | `/v1/company/verification-requests` | Company workspace | signed-in | Ask for company verification (CR documents) |
| POST | `/v1/admin/auth/login` | Admin auth | public | Admin sign-in step 1 (email + password) |
| POST | `/v1/admin/auth/mfa/verify` | Admin auth | public | Admin sign-in step 2 (two-step code) |
| POST | `/v1/admin/auth/logout` | Admin auth | signed-in | Sign out |
| GET | `/v1/admin/me` | Admin auth | signed-in | Signed-in admin, role and permission keys |
| GET | `/v1/admin/invites/{token}` | Admin auth | public | Look up an invite (name, role, inviter) |
| POST | `/v1/admin/invites/{token}/accept` | Admin auth | public | Accept an invite and set a password |
| POST | `/v1/admin/auth/mfa/confirm` | Admin auth | public | Confirm two-step setup with the first code |
| GET | `/v1/admin/overview` | Admin dashboards | `dashboard.overview` | Super admin overview |
| GET | `/v1/admin/my-work/reviewer` | Admin dashboards | `listings.review` | Reviewer home: unified queue sorted by deadline |
| GET | `/v1/admin/my-work/editor` | Admin dashboards | `news.manage` | Editor desk: drafts, week calendar, most read |
| GET | `/v1/admin/my-work/support` | Admin dashboards | `support.reply` | Support home: my tickets and topics |
| GET | `/v1/admin/my-work/analyst` | Admin dashboards | `analytics.view` | Analyst home: KPIs and saved reports |
| GET | `/v1/admin/search` | Admin dashboards | signed-in | Global admin search (users, companies, listings) |
| GET | `/v1/admin/notifications` | Admin dashboards | signed-in | Admin notifications (bell) |
| GET | `/v1/admin/analytics/kpis` | Admin analytics | `analytics.view` | KPI tiles for a tab |
| GET | `/v1/admin/analytics/series/{key}` | Admin analytics | `analytics.view` | Time series (weekly-active-users, daily-signups, applications-per-week…) |
| GET | `/v1/admin/analytics/breakdowns/{key}` | Admin analytics | `analytics.view` | Breakdowns (members-by-city, applications-by-type, funnel, tickets-by-topic…) |
| GET | `/v1/admin/analytics/top-listings` | Admin analytics | `analytics.view` | Top listings by applications |
| GET | `/v1/admin/listings` | Admin listings | `listings.view` | Listings review queue and all listings |
| GET | `/v1/admin/listings/{id}` | Admin listings | `listings.view` | Listing with automated checks and review history |
| POST | `/v1/admin/listings/{id}/approve` | Admin listings | `listings.review` | Approve and publish |
| POST | `/v1/admin/listings/{id}/request-changes` | Admin listings | `listings.review` | Send back to the company with reasons |
| POST | `/v1/admin/listings/{id}/reject` | Admin listings | `listings.review` | Reject a listing |
| POST | `/v1/admin/listings/{id}/close` | Admin listings | `moderation.act` | Close a live listing |
| GET | `/v1/admin/applications` | Admin applications | `applications.view` | All applications (read-only) |
| GET | `/v1/admin/supplier-requests` | Admin supplier requests | `suppliers.view` | Supplier requests with response counts |
| GET | `/v1/admin/supplier-requests/{id}/responses` | Admin supplier requests | `suppliers.view` | Responses on a request |
| GET | `/v1/admin/users` | Admin users | `users.view` | Users table |
| POST | `/v1/admin/users/bulk` | Admin users | `users.bulk` | Bulk action on selected users |
| GET | `/v1/admin/users/{id}` | Admin users | `users.view` | User detail |
| GET | `/v1/admin/users/{id}/points` | Admin users | `users.view` | User points history |
| GET | `/v1/admin/users/{id}/applications` | Admin users | `users.view` | User applications |
| GET | `/v1/admin/users/{id}/events` | Admin users | `users.view` | User registrations and attendance |
| POST | `/v1/admin/users/{id}/suspend` | Admin users | `accounts.suspend` | Suspend an account |
| POST | `/v1/admin/users/{id}/unsuspend` | Admin users | `accounts.suspend` | Lift a suspension |
| POST | `/v1/admin/users/{id}/password-reset` | Admin users | `users.support_actions` | Send a password reset link |
| POST | `/v1/admin/users/{id}/verification/remove` | Admin users | `verification.decide` | Remove a member's verification |
| POST | `/v1/admin/users/{id}/data-requests` | Admin users | `users.data_requests` | Fulfil a data request (download or delete) |
| GET | `/v1/admin/{subject}/{id}/notes` | Admin users | `notes.view` | Internal notes on a user or company |
| POST | `/v1/admin/{subject}/{id}/notes` | Admin users | `notes.write` | Add an internal note |
| GET | `/v1/admin/companies` | Admin companies | `companies.view` | Companies table |
| GET | `/v1/admin/companies/{id}` | Admin companies | `companies.view` | Company detail |
| PATCH | `/v1/admin/companies/{id}` | Admin companies | `companies.edit` | Edit category/city, feature in Companies to watch |
| GET | `/v1/admin/companies/{id}/listings` | Admin companies | `companies.view` | Company listings |
| GET | `/v1/admin/companies/{id}/team` | Admin companies | `companies.view` | Company team members |
| POST | `/v1/admin/companies/{id}/suspend` | Admin companies | `accounts.suspend` | Suspend a company (hides its listings) |
| POST | `/v1/admin/companies/{id}/verification/remove` | Admin companies | `verification.decide` | Remove company verification |
| GET | `/v1/admin/verification-requests` | Admin verification | `verification.view` | Verification queue |
| GET | `/v1/admin/verification-requests/{id}` | Admin verification | `verification.view` | Request with signed document URLs and checks |
| POST | `/v1/admin/verification-requests/{id}/approve` | Admin verification | `verification.decide` | Approve verification |
| POST | `/v1/admin/verification-requests/{id}/request-info` | Admin verification | `verification.decide` | Ask for more information |
| POST | `/v1/admin/verification-requests/{id}/reject` | Admin verification | `verification.decide` | Reject verification |
| GET | `/v1/admin/claims` | Admin claims & imports | `claims.view` | Company page claims |
| POST | `/v1/admin/claims/{id}/approve` | Admin claims & imports | `claims.decide` | Approve a claim (moves page ownership; does not verify) |
| POST | `/v1/admin/claims/{id}/reject` | Admin claims & imports | `claims.decide` | Reject a claim |
| GET | `/v1/admin/imports/templates/{kind}` | Admin claims & imports | `imports.run` | Download a CSV template |
| POST | `/v1/admin/imports` | Admin claims & imports | `imports.run` | Start an import (validates and builds a preview) |
| POST | `/v1/admin/imports/{id}/confirm` | Admin claims & imports | `imports.run` | Confirm and process an import |
| GET | `/v1/admin/imports` | Admin claims & imports | `imports.run` | Recent imports |
| GET | `/v1/admin/imports/{id}` | Admin claims & imports | `imports.run` | Import progress and errors |
| GET | `/v1/admin/events` | Admin events | `events.view` | Events table |
| POST | `/v1/admin/events` | Admin events | `events.manage` | Create an event |
| GET | `/v1/admin/events/{id}` | Admin events | `events.view` | Event detail |
| PATCH | `/v1/admin/events/{id}` | Admin events | `events.manage` | Edit an event |
| GET | `/v1/admin/events/{id}/attendance` | Admin events | `events.view` | Attendance summary |
| POST | `/v1/admin/events/{id}/check-ins` | Admin events | `events.check_in` | Ingest door scans (from the scanning app) |
| POST | `/v1/admin/events/{id}/award-points` | Admin events | `points.award_events` | Award attendance points to verified attendees |
| GET | `/v1/admin/articles` | Admin news | `news.view` | News list |
| POST | `/v1/admin/articles` | Admin news | `news.manage` | Create a draft |
| GET | `/v1/admin/articles/{id}` | Admin news | `news.view` | Article for editing |
| PATCH | `/v1/admin/articles/{id}` | Admin news | `news.manage` | Autosave a draft |
| GET | `/v1/admin/articles/{id}/checks` | Admin news | `news.manage` | Pre-publish checklist |
| POST | `/v1/admin/articles/{id}/schedule` | Admin news | `news.manage` | Publish now or schedule |
| POST | `/v1/admin/articles/{id}/unschedule` | Admin news | `news.manage` | Back to draft |
| POST | `/v1/admin/articles/{id}/unpublish` | Admin news | `news.manage` | Unpublish |
| GET | `/v1/admin/rewards` | Admin rewards & points | `rewards.view` | Rewards catalog |
| POST | `/v1/admin/rewards` | Admin rewards & points | `rewards.manage` | Add a reward |
| PATCH | `/v1/admin/rewards/{id}` | Admin rewards & points | `rewards.manage` | Edit or switch a reward on/off |
| GET | `/v1/admin/redemptions` | Admin rewards & points | `rewards.view` | Redemptions |
| POST | `/v1/admin/redemptions/{id}/fulfil` | Admin rewards & points | `rewards.fulfil` | Mark a redemption fulfilled |
| GET | `/v1/admin/points/ledger` | Admin rewards & points | `points.view` | Points ledger (all members) |
| POST | `/v1/admin/points/adjustments` | Admin rewards & points | `points.adjust` | Manual points adjustment |
| GET | `/v1/admin/earning-rules` | Admin rewards & points | `rewards.view` | How points are earned |
| PUT | `/v1/admin/earning-rules/{key}` | Admin rewards & points | `settings.manage` | Change an earning rule |
| GET | `/v1/admin/moderation/cases` | Admin moderation | `moderation.view` | Moderation queue |
| GET | `/v1/admin/moderation/cases/{id}` | Admin moderation | `moderation.view` | Case detail with reports and account history |
| POST | `/v1/admin/moderation/cases/{id}/actions` | Admin moderation | `moderation.act` | Act on a case |
| GET | `/v1/admin/support/tickets` | Admin support | `support.view` | Support inbox |
| GET | `/v1/admin/support/tickets/{id}` | Admin support | `support.view` | Ticket with conversation and related records |
| POST | `/v1/admin/support/tickets/{id}/messages` | Admin support | `support.reply` | Reply or add an internal note |
| PATCH | `/v1/admin/support/tickets/{id}` | Admin support | `support.reply` | Assign or change status |
| GET | `/v1/admin/support/macros` | Admin support | `support.reply` | Saved replies |
| GET | `/v1/admin/broadcasts` | Admin broadcasts | `broadcasts.view` | Sent and scheduled broadcasts |
| POST | `/v1/admin/broadcasts/estimate` | Admin broadcasts | `broadcasts.manage` | Estimate reach for audience rules |
| POST | `/v1/admin/broadcasts` | Admin broadcasts | `broadcasts.manage` | Create a broadcast (draft) |
| POST | `/v1/admin/broadcasts/{id}/test` | Admin broadcasts | `broadcasts.manage` | Send a test to myself |
| POST | `/v1/admin/broadcasts/{id}/schedule` | Admin broadcasts | `broadcasts.manage` | Schedule or send now |
| POST | `/v1/admin/broadcasts/{id}/cancel` | Admin broadcasts | `broadcasts.manage` | Cancel a scheduled broadcast |
| GET | `/v1/admin/team` | Admin team | `team.view` | Admins and pending invites |
| GET | `/v1/admin/roles` | Admin team | `team.view` | Role permission matrix |
| POST | `/v1/admin/team/invites` | Admin team | `team.manage` | Invite a teammate |
| DELETE | `/v1/admin/team/invites/{id}` | Admin team | `team.manage` | Revoke an invite |
| PATCH | `/v1/admin/team/{id}` | Admin team | `team.manage` | Change role or disable an admin |
| GET | `/v1/admin/audit-log` | Admin audit | `audit.view` | Audit log (append-only) |
| GET | `/v1/admin/reports/catalog` | Admin reports & exports | `exports.create` | Report catalog with row counts and columns |
| POST | `/v1/admin/exports` | Admin reports & exports | `exports.create` | Create an export (async) |
| GET | `/v1/admin/exports` | Admin reports & exports | `exports.create` | My recent exports |
| GET | `/v1/admin/exports/{id}` | Admin reports & exports | `exports.create` | Export status |
| GET | `/v1/admin/exports/{id}/download` | Admin reports & exports | `exports.create` | Download (302 to a signed URL) |
| GET | `/v1/admin/scheduled-exports` | Admin reports & exports | `exports.schedule` | Scheduled exports |
| POST | `/v1/admin/scheduled-exports` | Admin reports & exports | `exports.schedule` | Schedule an export by email |
| PATCH | `/v1/admin/scheduled-exports/{id}` | Admin reports & exports | `exports.schedule` | Edit a scheduled export |
| DELETE | `/v1/admin/scheduled-exports/{id}` | Admin reports & exports | `exports.schedule` | Delete a scheduled export |
| GET | `/v1/admin/saved-reports` | Admin reports & exports | `analytics.view` | Saved reports |
| POST | `/v1/admin/saved-reports` | Admin reports & exports | `analytics.view` | Save a report definition |
| GET | `/v1/admin/settings` | Admin settings | `settings.view` | Platform settings |
| PUT | `/v1/admin/settings` | Admin settings | `settings.manage` | Update platform settings |
| GET | `/v1/admin/taxonomy/{kind}` | Admin settings | `settings.view` | Listing types, crafts, cities, company categories, news categories |
| PUT | `/v1/admin/taxonomy/{kind}` | Admin settings | `settings.manage` | Replace a taxonomy list (order, names, active) |
| GET | `/v1/meta/taxonomy` | Meta | public | Public taxonomy for app pickers (cities, crafts, categories) in the request language |
