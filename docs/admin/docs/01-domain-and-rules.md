# 01 · Domain and business rules

Back of House is Saudi Arabia's events community. Three groups use it:

| Who | Where | What they do |
|---|---|---|
| **Members** (individuals, including students) | Mobile app | Discover events and opportunities, apply, register for events, earn and spend points, follow companies, get verified |
| **Companies** (organizers, venues, suppliers, agencies, production) | Company workspace inside the app (`/company`) | Post listings, manage applicants, post and answer supplier requests, keep a public company page |
| **Back of House team** (admins) | Web back-office (`/admin`) | Review listings, verify accounts, moderate, support, publish news, run events and rewards, analyse and export |

These rules are shown in the designs. The backend must enforce them — never rely on the app hiding a button.

## 1. Accounts

- Sign-up asks for account type (individual or company), full name, email, phone, password, and "I'm currently a student" for individuals.
- A company sign-up creates the **user** and an **unverified company** with that user as `owner`.
- Contact privacy: a member's **email and phone are private by default**. Companies only see them on an application if the member switched on *Share my email* / *Share my phone*. The choice is snapshotted on each application at the moment of applying.
- Members choose language (`en`/`ar`) and theme (`light`/`dark`/`system`).
- Suspended members and companies can't sign in to the app; their listings are hidden.

## 2. Verification (badge)

- Members ask for verification by uploading an identity document (National ID / Iqama, or student ID) plus proof of experience. Companies upload the commercial registration (CR), national address and an authorization letter.
- A **Reviewer or Super admin decides on documents only. Verification is never granted by points, payments or activity**, and no endpoint may set `verification = verified` except the verification decision endpoints.
- Decisions: approve, ask for more information, reject. Target decision time: 3 working days (`dueAt`).
- Removing verification needs a reason and is audited.
- Verification documents are private files, served only through short-lived signed URLs, and every view is audited.

## 3. Listings (jobs, co-op, projects, volunteering, supplier requests)

State machine:

```
draft ──submit──▶ pending_review ──approve──▶ live ──close / closesAt passed──▶ closed
                      │   ▲                     │
       request_changes│   │resubmit             │company edits a live listing
                      ▼   │                     ▼
               changes_requested          pending_review
                      │
               reject ▼
                  rejected
```

- **Every listing is reviewed before it goes live** (setting `reviewEveryListing`, on). The setting `verifiedCompaniesSkipReview` exists but is **off**.
- On submit the backend runs **automated checks** and stores them on the listing:
  - company is verified (warn if not);
  - no phone numbers or emails in the text (`hideContactDetailsInListings`);
  - working hours present for jobs;
  - pay present (warn only — optional);
  - fee language such as "pay a training fee" → **auto-flag** (setting `autoFlagFeeListings`). An auto-flagged listing still goes to review and also opens a moderation case.
- Review deadline: `reviewDueAt = submittedAt + reviewSlaHours` (24 h). `slaState` is `overdue` after the deadline, `due_soon` within 4 h.
- **Request changes** and **reject** need reasons and a message. The company sees the message as coming from "Back of House", never the reviewer's name. The company gets a push and a dashboard banner.
- **Approve** publishes the listing, notifies the company and pushes to the company's followers.
- Editing a `live` listing sends it back to `pending_review`. A `pending_review` listing can't be edited (409 `LISTING_NOT_EDITABLE`).
- Co-op listings are only open to members with `isStudent = true` (`eligibility.eligible = false` otherwise).

## 4. Applications

- One application per member per listing (409 `ALREADY_APPLIED`).
- The member picks at least one experience, optionally projects, writes a message (max 500 characters) and chooses whether to share email/phone.
- Status flow: `applied → in_review → shortlisted → selected | not_selected`. The member may `withdraw` until a decision.
- **Only the company changes application status.** Admins can view applications but have no endpoint to change status.
- Every status change appends to `statusHistory` and notifies the applicant.

## 5. Supplier requests

- A supplier request is a listing of type `supplier_request` with category, budget range, event dates and a respond-by date. It is reviewed like any listing.
- Other companies respond with price, setup time, message and portfolio items. **Only the requesting company sees responses and prices.**
- The requesting company can shortlist, decline or award responses. Admins can view them and hide a response through moderation.
- "No response after 5 days" is a KPI on the admin screen.

## 6. Events and attendance

- Registering creates a registration with a QR `passCode`. **Registering earns 0 points** (earning rule `event_registration` is locked at 0).
- Attendance is verified by door **QR scans** (`/admin/events/{id}/check-ins`, idempotent per pass + day) or by an **attendance import** (CSV).
- **Points are awarded only for verified attendance** (`pointsForAttendance`, default 150), using `/admin/events/{id}/award-points`. Award once per member per event (ledger idempotency key `event_attendance:<userId>:<eventId>`).
- Unmatched scans are listed so support can fix them manually (see points adjustments).

## 7. Points, levels and rewards

- Points live in an **append-only ledger** (`PointsTransaction`). Balance = sum of amounts. Never edit or delete a row; correct mistakes with a `reversal`.
- Earning rules (configurable by Super admin, except the locked one):

| Rule | Default |
|---|---|
| Registering for an event | 0 (locked) |
| Verified event attendance | +150 (per event, editable on the event) |
| Confirmed volunteer shift (confirmed by the company) | +200 |
| Completing the profile (once) | +100 *(the app screens show +50 — confirm the value, see Open questions)* |
| Friend joins and attends an event | +50, max 10 a month |

- **Level** comes from lifetime earned points using the thresholds in settings (`levels`). The app shows "250 pts to Level 4".
- Redeeming a reward is atomic: check balance, required level and stock; write a negative ledger entry and the redemption in one transaction; return the code. 422 `INSUFFICIENT_POINTS` / `LEVEL_TOO_LOW`, 409 `OUT_OF_STOCK`.
- **Profile Highlight** (500 pts) puts the member first in the Professionals directory for 7 days. It **does not change verification** and is not advertising.
- **Manual adjustments** need a reason and a note, show in the member's history and the audit log. Support can only add points, at most **500 per member per calendar month** (422 `MONTHLY_CAP_REACHED`). Super admin has no cap and can deduct.

## 8. Companies index and company page

- The index sorts companies A–Z by name in the request language (Arabic collation for `ar`) and returns the letters that have results for the side rail.
- Filters: type/category, city, verified only, hiring now (has live listings).
- "Companies to watch" is an editor's pick: companies with `featuredToWatch = true`, ordered by `featuredOrder`. Only a Super admin can change it.
- The public company page shows open roles, about, events and portfolio. The verified badge is read-only and explained.
- Page claims: a company page created from an import can be claimed. Approving a claim moves ownership to the claimant; it **does not verify** the company.

## 9. News

- News is **editorial only**. Members never post news.
- An article needs **both English and Arabic** before it can be published or scheduled (422 `TRANSLATION_MISSING`).
- Pre-publish checklist: both languages complete, cover image has alt text, linked listing/event is live, headline length, and a warning when a partner company is named (news must not read as an ad).
- Scheduling: publish now or at a Riyadh time; optional push to an audience, feature on Home for N days, share to company followers.

## 10. Moderation

- Members report listings, profiles, companies, supplier responses or articles with a reason. Reports on the same target join one open **case**.
- Automatic filters (fee language, contact details in responses) open cases with `source = auto_filter`.
- Actions: dismiss, warn, remove content, suspend account (suspend needs `accounts.suspend`). The owner is notified for warn/remove/suspend.

## 11. Support

- Tickets have a category, an assignee and a **first-reply deadline of 4 working hours** (Sun–Thu, 9:00–17:00 Asia/Riyadh).
- Replies can be public or internal notes. "Send & solve" replies and marks the ticket solved, then sends a one-question satisfaction survey.
- Support can resend verification/password emails and add points (with the cap above), but can't suspend accounts, grant verification or export personal data.

## 12. Broadcasts

- Audience = rules (city, account type, interests, student, verified, points, joined after, follows company).
- Members who turned off marketing are excluded when `marketing = true`.
- **Push is never sent during quiet hours** (default 23:00–08:00 Riyadh); delivery waits until the window ends.
- A test send goes only to the admin who pressed it.

## 13. Team, access and audit

- Admins are a **separate identity** from members (separate table, tokens and sign-in).
- Two-step sign-in (TOTP) is **required for every admin**. Sessions expire after 30 minutes without activity.
- Invites: name, work email on the company domain, role. The link is valid **72 hours**. The invitee sets a password and sets up two-step sign-in before the first session.
- There must always be at least one active Super admin (409 `LAST_SUPER_ADMIN`).
- **Everything an admin does is written to the audit log**, including sign-ins, document views, decisions, points changes, settings changes and every export/download. The audit log is append-only and can't be edited or deleted.

## 14. Exports

- Every module can be exported as CSV, Excel or PDF, with a date range, filters and chosen columns.
- **Email and phone columns can only be exported by a Super admin** (`exports.personal_data`). Other roles get 403 `PERSONAL_DATA_FORBIDDEN` if they ask for them, and the UI shows them as locked.
- Exports run as background jobs. The download link expires 24 hours after it's ready. Creating and downloading are both audited.
- Scheduled exports email a link (never the file) to listed recipients.

## Open questions to confirm with the product owner

1. Profile completion points: the admin settings show **+100**, the app's points history and notifications show **+50**. Seed the rule with one value and make the app read it from the API.
2. Working-hours calendar for the support deadline (Sun–Thu 9–17 assumed).
3. Level thresholds (only "250 pts to Level 4" at 1,250 points is shown).
4. Whether verified companies should ever skip review (setting exists, default off).
