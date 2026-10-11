# 06 · Background jobs, notifications, analytics and exports

## Background jobs (BullMQ on Redis)

| Job | Trigger | What it does |
|---|---|---|
| `listing.sla` | Every 5 min | Recompute `slaState` for pending listings, verification requests and tickets; notify the reviewer queue when items become overdue |
| `listing.autoclose` | Hourly | Close live listings whose `closesAt` has passed |
| `article.publish` | Every minute | Publish scheduled articles whose time has come; send the push if requested; end Home featuring after N days |
| `broadcast.send` | Scheduled time | Resolve the audience, respect marketing opt-out and push quiet hours, fan out per channel, record sent/opened counts |
| `event.reminder` | Daily 09:00 Riyadh | Remind registered members 5 days and 1 day before an event |
| `event.complete` | Hourly | Mark finished events `completed`, registrations without a check-in `no_show` |
| `points.award` | `/admin/events/{id}/award-points` | Insert one ledger row per verified attendee (idempotent), update caches, notify members |
| `points.reconcile` | Nightly | Recompute `pointsBalance` / `lifetimePoints` from the ledger; alert on drift |
| `import.validate` / `import.process` | `/admin/imports`, `/confirm` | Parse CSV/XLSX, build preview and row errors, then write rows and an error report |
| `export.generate` | `/admin/exports` | Stream the dataset to CSV / XLSX / PDF in object storage, set `expiresAt = readyAt + 24 h`, notify the requester |
| `export.scheduled` | Per schedule (Riyadh time) | Run a scheduled export and email a download link (never the file) |
| `export.expire` | Hourly | Delete expired export files, set `expired` |
| `analytics.refresh` | Every 15 min | Refresh materialized views behind dashboards |
| `idempotency.purge` | Hourly | Delete idempotency records older than 24 h |
| `data-request.process` | Super admin action | Build a member's data download, or anonymise the account on delete |

## Notifications to members

| Event | Push | In-app | Email |
|---|:-:|:-:|:-:|
| Application status changed (in review, shortlisted, selected, not selected) | ✓ | ✓ | |
| Event reminder (5 days, 1 day) | ✓ | ✓ | |
| Attendance verified, points added | ✓ | ✓ | |
| Manual points adjustment | | ✓ | |
| Reward redeemed, code ready | ✓ | ✓ | ✓ |
| Verification approved / more info / rejected | ✓ | ✓ | ✓ |
| News push (when scheduled with a push) | ✓ | | |
| Broadcast | per channel | per channel | per channel |
| Support reply | ✓ | ✓ | ✓ |

## Notifications to companies

| Event | Push | Dashboard banner | Email |
|---|:-:|:-:|:-:|
| Listing approved / changes requested / rejected (message from "Back of House") | ✓ | ✓ | ✓ |
| New applicant | ✓ | | daily digest |
| New supplier response | ✓ | | ✓ |
| Page claim approved | | | ✓ |

## Notifications to admins (bell)

New items in the role's queue, items going overdue, export ready, import finished, ticket assigned to me.

## Dashboard numbers (definitions)

Default period: the selected date range, compared with the previous range of the same length. "Active" means the member opened the app (any authenticated request) in the period.

| Metric | Definition |
|---|---|
| Total users | Members with status `active` |
| Companies | Companies with status `active` |
| Live listings | Listings with status `live` |
| Applications | Applications created in range |
| Supplier requests | Supplier-request listings created in range |
| Active users · 30 days | Distinct members active in the last 30 days |
| Applications per listing | Applications in range ÷ listings that were live in range |
| Event attendance verified | Verified attendees ÷ registrations for events that ended in range |
| Median review time | Median of (first decision − submittedAt) for listings decided in range |
| Daily sign-ups | Count of new users per day (Riyadh day boundaries) |
| Opportunity funnel | Listing views → apply starts → applications → shortlisted → selected (last 28 days) |
| Weekly active users | Distinct active members per ISO week |
| Members by city | Active members grouped by `city` (top 4 + Other) |
| Applications by listing type | Applications grouped by listing `type` |
| Top listings | Listings by applications; conversion = applications ÷ views |
| Company reply rate | Share of applications that got a status change within 7 days |
| Support first reply | Median time from ticket creation to first public admin message, in working hours |

Each series and breakdown response includes a one-sentence `summary` (shown under the chart), e.g. "Up from 6,940 to 9,812 over 12 weeks."

## Export datasets

| Dataset | Rows | Personal-data columns (Super admin only) |
|---|---|---|
| `users` | Sign-ups, account type, city, student, verification, points, joined, last active | email, phone |
| `companies` | Profile, category, city, verification, live listings, applications, reply rate | owner email |
| `listings` | All listings with type, company, status, review outcome and times | — |
| `applications` | Applicant name, listing, company, status, applied on, city | applicant email, phone |
| `supplier_requests` | Requests, responses, prices, awarded supplier | — |
| `events_attendance` | Event, registered, verified, no-shows, points awarded | attendee email |
| `points_ledger` | Every ledger row with type, reason and admin for adjustments | — |
| `verification_decisions` | Requests, reviewer, decision, time to decide | — |
| `moderation` | Cases, reasons, actions, outcomes | — |
| `support_tickets` | Tickets, category, first reply time, status | requester email |
| `audit_log` | Every admin action | IP address |
| `overview` | PDF of the dashboard for a period | — |

PDF exports use the same brand (Poppins / IBM Plex Sans Arabic, violet `#6437FA`) and support Arabic (right-to-left).
