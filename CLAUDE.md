# Back Of House — Mobile

Read [docs/business-rules.md](docs/business-rules.md) before any feature work. Those rules are mandatory; do not introduce alternatives without approval. In short:

- Two account types only: `INDIVIDUAL` and `COMPANY`. Supplier, organizer, venue, etc. are a `companyType`, not account types.
- One `Opportunity` model with `opportunityType` (`JOB`, `PROJECT`, `CO_OP`, `VOLUNTEERING`, `SUPPLIER_REQUEST`) and reusable screens. Supplier requests are B2B: never shown to individuals as jobs, answered by a `SupplierResponse`, never an `Application`.
- Application status: `SUBMITTED → REVIEWED → SHORTLISTED → CONTACT → DECISION` (`ACCEPTED` / `REJECTED` / `WITHDRAWN`). No interview/offer pipeline. The company decides, not Back Of House.
- `CompanyProject` (portfolio) is separate from `Opportunity`; client name is optional.
- Verification, points and paid visibility are separate. Nothing grants verification automatically; `Featured`/`Sponsored` is never shown as trust.
- No payments, subscriptions, messaging or interview scheduling unless asked. Keep the MVP simple.
- Students are individuals with `ProfileStatus.student`, not an account type.
- Profile Highlight is a points reward, never verification and never paid promotion; free lists never say "Featured".
- Eligibility lives in `Opportunity.eligibilityFor` (co-op = students only); re-applying lives in `ApplicationRules` (only after withdrawal). Enforce in the data layer, explain in the UI.
- Applications carry profile snapshot, selected experience, selected projects, optional message. No CV upload. The app never calculates match scores.
- Notify the applicant on official status changes only.
- Account-aware routing: the company workspace lives under `/company`; companies share only Discover and News with individuals and never see other individual screens (`AuthGuard`). One bottom bar for both; company tabs: Dashboard · Discover · News · Profile, with Opportunities, Supplier Requests and Portfolio opened from the Dashboard.
- Companies: one Owner via `CompanyMembership` (check `CompanyPermission`, not roles). Listings go DRAFT → IN_REVIEW → PUBLISHED, reviewed by Back Of House even for verified companies (`OpportunityLifecycle`). Company applicant moves are one step at a time, reject anytime, accept only from CONTACT, decisions final. Contact data only from CONTACT and per `ContactPrivacy` (`ApplicantPrivacy`). Supplier requests need `CompanyCapability.createSupplierRequest`; responses (`SupplierResponse`) only from invited company types (`SupplierResponseRules`). No attachments.
- Listing review: failing review → CHANGES_REQUESTED + reviewerNote (never auto-draft); published listings change only through a reviewed `OpportunityRevision` (live stays up); CLOSED is final. Contact sharing defaults to nothing. Selecting a supplier rejects the rest and closes the request. Applicant notifications are the backend's. Verification is read-only and grants no publishing.
- No member posts. Individuals may like and comment on News articles (flat comments, author-only delete, `ArticleEngagementRules`); companies only read. Individual tabs: Home · Discover · News · Rewards · Profile.

Architecture, commands and design-system rules are in [README.md](README.md).
