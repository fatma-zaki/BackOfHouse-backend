# Database ERD

> PostgreSQL entity-relationship diagrams, split into **focused diagrams** by domain. Field meanings, full constraints and lifecycles are in `database-entities.md`.
>
> - Standard columns (`created_at`, `updated_at`, `created_by`, `updated_by`) are **omitted** from diagrams.
> - `PK` = primary key, `FK` = foreign key, `UK` = unique (alone or as part of a composite unique key; the comment says which).
> - Types are simplified for Mermaid: `uuid_arr` = `uuid[]`, `text_arr` = `text[]`, `enum_X` = PostgreSQL enum `X`.
> - All primary keys are `uuid` unless the table is a join table with a composite key.

## Cardinality legend

| Mermaid | Meaning | Written as |
|---|---|---|
| `\|\|--\|\|` | exactly one to exactly one | **ONE-TO-ONE** |
| `\|\|--o\|` | one to zero-or-one | **ONE-TO-ONE (optional)** |
| `\|\|--o{` | one to zero-or-many | **ONE-TO-MANY** |
| `\|o--o{` | zero-or-one to zero-or-many (nullable FK) | **ONE-TO-MANY (optional parent)** |
| `}o--o{` via join table | many to many | **MANY-TO-MANY** (always implemented with a join table) |

---

## 0. Core overview (key tables only, no attributes)

Shows the backbone that every later phase builds on.

```mermaid
erDiagram
    users ||--|| profiles : "has (1:1)"
    users ||--o{ organization_members : "belongs via"
    organizations ||--o{ organization_members : "has team"
    users ||--o{ user_platform_roles : "staff roles"
    organizations ||--o{ company_projects : "publishes"
    organizations ||--o{ organization_claims : "claimed through"
    organization_claims ||--|| verifications : "reviewed as"
    organizations ||--o{ organization_approvals : "admin approval"
    users ||--o{ verifications : "subject of"
    organizations ||--o{ verifications : "subject of"
    company_projects ||--o{ verifications : "subject of"
    organizations ||--o{ subscriptions : "subscribes (P2)"
    subscriptions ||--o{ entitlements : "grants (P2)"
    users ||--o{ point_ledger : "earns (P2)"
    organizations ||--o{ point_ledger : "earns (P2)"
    events ||--o{ event_registrations : "has (P2)"
    users ||--o{ event_registrations : "registers (P2)"
    organizations ||--o{ opportunities : "publishes (P3)"
    opportunities ||--o{ applications : "receives (P3)"
    users ||--o{ applications : "submits (P3)"
    organizations ||--o| benchmark_sets : "owns (P4)"
    organizations ||--o{ saved_lists : "buyer company (P4, BQ-51)"
```

---

## 1. Identity & access (Phase 1)

```mermaid
erDiagram
    users {
        uuid id PK "= Supabase auth.users.id"
        citext email UK "nullable"
        text phone UK "nullable, E.164"
        timestamptz email_verified_at
        timestamptz phone_verified_at
        enum_AccountType account_type "security context, set at registration"
        enum_UserStatus status
        text preferred_locale "ar | en"
        text timezone
        timestamptz onboarding_completed_at
        timestamptz suspended_at
        timestamptz deactivated_at
    }
    consents {
        uuid id PK
        uuid user_id FK
        enum_ConsentPurpose purpose
        text document_version
        boolean granted
        timestamptz recorded_at "append-only"
    }
    user_platform_roles {
        uuid id PK
        uuid user_id FK "UK (user_id, role) where active"
        enum_PlatformRole role
        uuid granted_by FK
        timestamptz revoked_at
    }
    organization_members {
        uuid id PK
        uuid organization_id FK "UK (organization_id, user_id)"
        uuid user_id FK "INDIVIDUAL accounts only"
        enum_MembershipStatus status
        uuid invitation_id FK "nullable"
        boolean show_on_company_profile "public team only"
    }
    invitations {
        uuid id PK
        uuid organization_id FK
        citext email "email or phone required"
        text phone
        text token_hash UK
        enum_InvitationStatus status
        timestamptz expires_at
        timestamptz membership_expires_at
        uuid invited_by FK
        uuid accepted_by FK
    }
    profiles {
        uuid id PK
        uuid user_id FK,UK "1:1"
        citext slug UK "nullable"
        text full_name
        text headline
        uuid avatar_media_id FK
        text_arr languages
        boolean is_searchable
        jsonb section_visibility
        smallint completion_score
    }
    profile_skills {
        uuid profile_id PK,FK
        uuid skill_id PK,FK
    }
    profile_locations {
        uuid profile_id PK,FK
        uuid location_id PK,FK
    }
    organizations {
        uuid id PK
        text slug UK
        uuid account_user_id FK,UK "the single Company Account"
    }
    skills {
        uuid id PK
    }
    locations {
        uuid id PK
    }

    users ||--|| profiles : "ONE-TO-ONE"
    users ||--o{ consents : "ONE-TO-MANY"
    users ||--o{ user_platform_roles : "ONE-TO-MANY"
    users |o--o| organizations : "Company Account (1 per company)"
    users ||--o{ organization_members : "Individual memberships"
    organizations ||--o{ organization_members : "ONE-TO-MANY"
    organizations ||--o{ invitations : "ONE-TO-MANY"
    invitations |o--o| organization_members : "accepted into (optional)"
    profiles ||--o{ profile_skills : "M:N skills"
    skills ||--o{ profile_skills : ""
    profiles ||--o{ profile_locations : "M:N cities"
    locations ||--o{ profile_locations : ""
```

**Relationships**

| Relationship | Type | Notes |
|---|---|---|
| users — profiles | ONE-TO-ONE | Profile created at onboarding. |
| users (COMPANY) — organizations | **ONE-TO-ONE** via `organizations.account_user_id` | The company's single user; the only source of company permissions (BQ-68). |
| users (INDIVIDUAL) ⟷ organizations | **MANY-TO-MANY** via `organization_members` | Membership only; no permissions (BQ-68, BQ-74). |
| users — user_platform_roles | ONE-TO-MANY | Staff only. |
| profiles ⟷ skills, profiles ⟷ locations | MANY-TO-MANY | Join tables. |

---

## 2. Organizations & taxonomy (Phase 1)

```mermaid
erDiagram
    organizations {
        uuid id PK
        enum_OrganizationStatus status
        citext slug UK
        text legal_name_ar
        text legal_name_en
        text trade_name_ar
        text trade_name_en
        text commercial_registration_number UK "partial, normalised"
        text legal_entity_type
        uuid logo_media_id FK
        uuid cover_media_id FK
        smallint founded_year
        text size_range
        jsonb capacity "ranges with source"
        text_arr languages
        citext website_domain
        uuid headquarters_location_id FK
        jsonb field_visibility
        smallint completion_score
        timestamptz approved_at "admin approval"
        timestamptz claimed_at
        timestamptz registration_verified_at "signal"
        timestamptz domain_verified_at "signal"
        timestamptz verified_at "derived, rule BQ-53"
        timestamptz last_confirmed_at
        timestamptz suspended_at
        timestamptz archived_at
        uuid merged_into_organization_id FK "self, nullable"
        uuid source_import_row_id FK "nullable"
    }
    organization_contacts {
        uuid id PK
        uuid organization_id FK
        enum_ContactType type
        text value
        boolean is_public
        boolean is_imported "private until confirmed"
        timestamptz confirmed_at "contact signal"
    }
    organization_industries {
        uuid organization_id PK,FK
        uuid industry_id PK,FK "one or more, classification only"
    }
    industries {
        uuid id PK
        citext slug UK
        text name_ar
        text name_en
    }
    organization_company_types {
        uuid organization_id PK,FK
        enum_CompanyType company_type PK "one or more, classification only"
    }
    organization_services {
        uuid organization_id PK,FK
        uuid service_id PK,FK
        boolean is_primary
    }
    organization_coverage {
        uuid organization_id PK,FK
        uuid location_id PK,FK
    }
    organization_credentials {
        uuid id PK
        uuid organization_id FK
        enum_CredentialType type
        text issuer
        date issued_on
        date expires_on "indexed for alerts"
        uuid document_id FK
        timestamptz verified_at
        boolean is_public
    }
    organization_approvals {
        uuid id PK
        uuid organization_id FK "UK one open request"
        enum_OrganizationApprovalStatus status
        uuid submitted_by FK
        uuid decided_by FK "SYSTEM_ADMIN"
        text reason
    }
    organization_media {
        uuid organization_id PK,FK
        uuid media_asset_id PK,FK
        int sort_order
    }
    organization_claims {
        uuid id PK
        uuid organization_id FK
        uuid claimant_user_id FK
        uuid verification_id FK,UK "1:1"
        text applicant_title
        citext work_email
        boolean work_email_domain_matches
        jsonb automated_checks
        timestamptz closed_at "UK open claim per claimant"
    }
    organization_merges {
        uuid id PK
        uuid source_organization_id FK
        uuid target_organization_id FK
        enum_MergeStatus status
        jsonb detection_signals
        uuid decided_by FK
        text decision_reason
    }
    correction_suggestions {
        uuid id PK
        uuid organization_id FK
        text field_path
        jsonb suggested_value
        enum_CorrectionSuggestionStatus status
        uuid suggested_by FK
    }
    categories {
        uuid id PK
        uuid parent_id FK "self, nullable"
        citext slug UK
        text name_ar
        text name_en
        boolean is_active
    }
    services {
        uuid id PK
        uuid category_id FK
        citext slug UK
        text name_ar
        text name_en
    }
    locations {
        uuid id PK
        uuid parent_id FK "self: city to region"
        enum_LocationType type
        char country_code
        citext slug UK
        text name_ar
        text name_en
    }
    users {
        uuid id PK
    }
    verifications {
        uuid id PK
    }
    media_assets {
        uuid id PK
    }
    documents {
        uuid id PK
    }

    organizations ||--|{ organization_company_types : "one or more types"
    organizations ||--o{ organization_industries : "M:N industries"
    industries ||--o{ organization_industries : ""
    organizations ||--o{ organization_contacts : "ONE-TO-MANY"
    organizations ||--o{ organization_services : "M:N services"
    services ||--o{ organization_services : ""
    organizations ||--o{ organization_coverage : "M:N locations"
    locations ||--o{ organization_coverage : ""
    organizations ||--o{ organization_credentials : "ONE-TO-MANY"
    documents |o--o{ organization_credentials : "evidence (optional)"
    organizations ||--o{ organization_media : "M:N gallery"
    media_assets ||--o{ organization_media : ""
    organizations ||--o{ organization_claims : "ONE-TO-MANY"
    users ||--o{ organization_claims : "claimant"
    verifications ||--|| organization_claims : "ONE-TO-ONE"
    organizations ||--o{ organization_merges : "as source"
    organizations ||--o{ organization_merges : "as target"
    organizations |o--o{ organizations : "merged_into (self)"
    organizations ||--o{ correction_suggestions : "ONE-TO-MANY"
    organizations ||--o{ organization_approvals : "ONE-TO-MANY"
    categories |o--o{ categories : "parent (tree)"
    categories ||--o{ services : "ONE-TO-MANY"
    locations |o--o{ locations : "parent (region)"
    locations |o--o{ organizations : "headquarters (optional)"
```

**Relationships**

| Relationship | Type | Notes |
|---|---|---|
| organizations ⟷ services | MANY-TO-MANY | `organization_services` |
| organizations ⟷ locations (coverage) | MANY-TO-MANY | `organization_coverage` |
| organizations ⟷ media_assets (gallery) | MANY-TO-MANY | `organization_media` |
| organization_claims — verifications | ONE-TO-ONE | The claim holds claim data; the verification is the review case. Grants ownership only (BQ-46). |
| organizations — organization_approvals | ONE-TO-MANY | Admin approval requests (BQ-05). Separate from verification (BQ-46). |
| organizations — organizations | ONE-TO-MANY (self, optional) | `merged_into_organization_id` |
| categories — categories, locations — locations | ONE-TO-MANY (self tree) | |

---

## 3. Company projects (portfolio), verification & media (Phase 1)

```mermaid
erDiagram
    company_projects {
        uuid id PK
        uuid organization_id FK "UK (organization_id, slug)"
        citext slug
        enum_ProjectStatus status
        text name_ar "one name required"
        text name_en
        text project_type
        uuid location_id FK
        date start_date
        date end_date
        text company_role
        text client_name "private unless disclosed"
        enum_ClientDisclosureStatus client_disclosure
        smallint completion_score
        smallint points_score "0 to 50"
        text fingerprint
        timestamptz published_at
        timestamptz verified_at
    }
    company_project_services {
        uuid company_project_id PK,FK
        uuid service_id PK,FK
    }
    company_project_media {
        uuid company_project_id PK,FK
        uuid media_asset_id PK,FK
        int sort_order
    }
    verifications {
        uuid id PK
        enum_VerificationType type
        enum_VerificationStatus status
        uuid subject_user_id FK "exactly one subject"
        uuid subject_organization_id FK
        uuid subject_project_id FK
        uuid subject_credential_id FK
        uuid subject_contact_id FK
        uuid subject_experience_id FK "added Phase 3"
        uuid requested_by_user_id FK
        uuid on_behalf_of_organization_id FK
        uuid assigned_reviewer_id FK
        timestamptz due_at "SLA"
        timestamptz decided_at
        timestamptz expires_at
    }
    verification_documents {
        uuid verification_id PK,FK
        uuid document_id PK,FK
        text document_role
    }
    verification_decisions {
        uuid id PK
        uuid verification_id FK
        enum_VerificationStatus from_status
        enum_VerificationStatus to_status
        uuid decided_by FK "null = system"
        text reason "required for REJECTED, NEEDS_INFO"
        text internal_note
    }
    media_assets {
        uuid id PK
        uuid uploaded_by FK
        uuid organization_id FK
        enum_MediaType media_type
        text storage_path UK "with bucket"
        text external_url "LINK only"
        text content_sha256
        text perceptual_hash
        enum_FileStatus status
        timestamptz deleted_at
    }
    documents {
        uuid id PK
        uuid uploaded_by FK
        uuid organization_id FK
        text storage_path UK "private bucket"
        text sha256
        enum_DataClassification classification
        enum_FileStatus status
        timestamptz retention_until
        timestamptz deleted_at
    }
    organizations {
        uuid id PK
    }
    organization_credentials {
        uuid id PK
    }
    users {
        uuid id PK
    }
    services {
        uuid id PK
    }

    organizations ||--o{ company_projects : "ONE-TO-MANY"
    company_projects ||--o{ company_project_services : "M:N services"
    services ||--o{ company_project_services : ""
    company_projects ||--o{ company_project_media : "M:N media"
    media_assets ||--o{ company_project_media : ""
    users |o--o{ verifications : "subject (optional)"
    organizations |o--o{ verifications : "subject (optional)"
    company_projects |o--o{ verifications : "subject (optional)"
    organization_credentials |o--o{ verifications : "signal subject (optional)"
    organization_contacts |o--o{ verifications : "signal subject (optional)"
    users ||--o{ verifications : "requested_by"
    verifications ||--o{ verification_documents : "M:N documents"
    documents ||--o{ verification_documents : ""
    verifications ||--|{ verification_decisions : "ONE-TO-MANY history"
    users |o--o{ media_assets : "uploaded"
    users |o--o{ documents : "uploaded"
```

**Polymorphic subjects without losing referential integrity.** `verifications` uses **one nullable FK column per subject type** plus `CHECK (num_nonnulls(...) = 1)`, instead of a generic `subject_type + subject_id`. The same pattern is used by `abuse_reports`, `appeals`, `point_ledger`, `badge_awards`, `visibility_snapshots` and `entitlements`.

---

## 4. Search, content, moderation, notifications, audit, imports, platform (Phase 1)

```mermaid
erDiagram
    search_documents {
        uuid id PK
        enum_SearchSubjectType subject_type
        uuid organization_id FK,UK "one of"
        uuid profile_id FK,UK "one of"
        citext slug
        text normalized_text "GIN trigram"
        tsvector search_vector "GIN"
        uuid_arr category_ids "GIN"
        uuid_arr service_ids "GIN"
        uuid_arr location_ids "GIN"
        text_arr languages
        boolean is_verified
        numeric visibility_score "P2"
        boolean is_sponsored "P2, label only"
        timestamptz data_updated_at
    }
    companies_to_watch_selections {
        uuid id PK
        uuid organization_id FK "admin pick, not paid"
        uuid selected_by FK
        timestamptz starts_at
        timestamptz ends_at
    }
    content_items {
        uuid id PK
        enum_ContentType type "UK (type, slug)"
        enum_ContentStatus status
        citext slug
        text title_ar
        text title_en
        uuid author_user_id FK
        timestamptz published_at
    }
    abuse_reports {
        uuid id PK
        enum_AbuseReportTargetType target_type
        uuid target_organization_id FK "exactly one target"
        uuid target_project_id FK
        uuid target_user_id FK
        uuid target_content_item_id FK
        uuid reporter_user_id FK
        text category
        enum_AbuseReportStatus status
        timestamptz sla_due_at
    }
    appeals {
        uuid id PK
        enum_AppealSubjectType subject_type
        uuid subject_verification_decision_id FK "exactly one subject"
        uuid subject_organization_id FK
        uuid subject_merge_id FK
        uuid subject_ledger_entry_id FK "P2"
        uuid submitted_by FK
        enum_AppealStatus status
        uuid decided_by FK
    }
    notifications {
        uuid id PK
        uuid recipient_user_id FK
        text type
        uuid organization_id FK
        jsonb payload
        timestamptz read_at
    }
    notification_deliveries {
        uuid id PK
        uuid notification_id FK
        enum_NotificationChannel channel
        enum_DeliveryStatus status
        text destination_masked
        int attempt_count
    }
    notification_preferences {
        uuid user_id PK,FK
        text notification_type PK
        enum_NotificationChannel channel PK
        boolean enabled
    }
    audit_logs {
        uuid id PK
        timestamptz occurred_at
        enum_AuditActorType actor_type
        uuid actor_user_id FK "nullable"
        uuid organization_id FK "context"
        text action
        text entity_type
        uuid entity_id "no FK"
        jsonb changes "redacted"
        text request_id
        inet ip_address
    }
    analytics_events {
        uuid id PK
        text event_name
        timestamptz occurred_at "partition key"
        text anonymous_id
        uuid user_id "after consent, no FK"
        uuid organization_id "no FK"
        jsonb properties
        boolean is_bot
        boolean is_internal
    }
    import_batches {
        uuid id PK
        uuid source_document_id FK
        enum_ImportBatchStatus status
        int total_rows
        int error_rows
        jsonb quality_report
    }
    import_rows {
        uuid id PK
        uuid batch_id FK "UK (batch_id, row_number)"
        int row_number
        text source_record_id
        jsonb normalized_data
        jsonb errors
        enum_ImportRowAction action
        uuid duplicate_of_organization_id FK
        uuid created_organization_id FK
    }
    outbox_events {
        uuid id PK
        text event_name
        text aggregate_type
        uuid aggregate_id
        jsonb payload
        enum_OutboxStatus status
        int attempts
        timestamptz available_at
    }
    organizations {
        uuid id PK
    }
    profiles {
        uuid id PK
    }
    users {
        uuid id PK
    }
    documents {
        uuid id PK
    }

    organizations |o--o| search_documents : "projected to (optional)"
    organizations ||--o{ companies_to_watch_selections : "admin picks"
    profiles |o--o| search_documents : "projected to (optional)"
    users ||--o{ content_items : "authors"
    users ||--o{ abuse_reports : "reports"
    organizations |o--o{ abuse_reports : "target (optional)"
    users ||--o{ appeals : "submits"
    users ||--o{ notifications : "receives"
    notifications ||--o{ notification_deliveries : "ONE-TO-MANY"
    users ||--o{ notification_preferences : "ONE-TO-MANY"
    users |o--o{ audit_logs : "actor (optional)"
    documents ||--o{ import_batches : "source file"
    import_batches ||--|{ import_rows : "ONE-TO-MANY"
    import_rows |o--o| organizations : "created (optional)"
```

`audit_logs.entity_id`, `analytics_events.*_id` and `outbox_events.aggregate_id` have **no foreign keys on purpose**. They point to many tables, must survive deletion of the referenced row, and (analytics) live in a partitioned table.

---

## 5. Billing & entitlements — ⏸ DEFERRED future monetization (business rules §11)

```mermaid
erDiagram
    membership_plans {
        uuid id PK
        text code UK
        enum_PlanAudience audience
        int price_amount_minor "halalas"
        char currency "SAR"
        enum_BillingInterval billing_interval
        int trial_days
        boolean is_public
        boolean is_active
    }
    plan_features {
        uuid id PK
        uuid plan_id FK "UK (plan_id, feature_key)"
        text feature_key
        boolean is_enabled
        int limit_value "null = unlimited"
    }
    subscriptions {
        uuid id PK
        uuid subscriber_organization_id FK "exactly one subscriber"
        uuid subscriber_user_id FK "BQ-14"
        uuid plan_id FK
        enum_SubscriptionStatus status "UK one live per subscriber"
        int price_amount_minor "snapshot"
        timestamptz trial_ends_at
        timestamptz current_period_start
        timestamptz current_period_end
        timestamptz grace_ends_at
        boolean cancel_at_period_end
        uuid pending_plan_id FK "downgrade at period end"
        boolean is_manual
    }
    invoices {
        uuid id PK
        uuid subscription_id FK
        text invoice_number UK "sequential, legal"
        enum_InvoiceStatus status
        int subtotal_minor
        int discount_minor
        int vat_minor
        int total_minor
        jsonb buyer_snapshot
        uuid document_id FK
        uuid coupon_redemption_id FK
    }
    payments {
        uuid id PK
        uuid invoice_id FK
        text provider "UK (provider, provider_payment_ref)"
        text provider_payment_ref
        enum_PaymentStatus status
        int amount_minor
        text idempotency_key UK
        timestamptz paid_at
    }
    coupons {
        uuid id PK
        citext code UK
        enum_CouponDiscountType discount_type
        int discount_value
        uuid plan_id FK "nullable"
        int max_redemptions
        int redeemed_count
    }
    coupon_redemptions {
        uuid id PK
        uuid coupon_id FK "UK (coupon_id, subscription_id)"
        uuid subscription_id FK
        uuid redeemed_by_user_id FK
    }
    entitlements {
        uuid id PK
        uuid subscriber_organization_id FK "exactly one subscriber"
        uuid subscriber_user_id FK
        text feature_key
        boolean is_enabled
        int limit_value
        enum_EntitlementSource source
        uuid subscription_id FK "when source = PLAN"
        uuid granted_by FK
        timestamptz valid_until
        timestamptz revoked_at
    }
    payment_provider_events {
        uuid id PK
        text provider "UK (provider, provider_event_id)"
        text provider_event_id
        jsonb payload
        boolean signature_verified
        timestamptz processed_at
    }
    idempotency_records {
        uuid id PK
        text scope_key "UK (scope_key, idempotency_key)"
        text idempotency_key
        text request_hash
        jsonb response_body
        timestamptz expires_at
    }
    organizations {
        uuid id PK
    }
    users {
        uuid id PK
    }
    documents {
        uuid id PK
    }

    membership_plans ||--o{ plan_features : "ONE-TO-MANY"
    membership_plans ||--o{ subscriptions : "ONE-TO-MANY"
    organizations |o--o{ subscriptions : "subscriber (optional)"
    users |o--o{ subscriptions : "subscriber (optional)"
    subscriptions ||--o{ invoices : "ONE-TO-MANY"
    invoices ||--o{ payments : "ONE-TO-MANY"
    documents |o--o| invoices : "PDF (optional)"
    coupons ||--o{ coupon_redemptions : "ONE-TO-MANY"
    subscriptions ||--o{ coupon_redemptions : "ONE-TO-MANY"
    coupon_redemptions |o--o| invoices : "applied to (optional)"
    subscriptions |o--o{ entitlements : "source PLAN (optional)"
    organizations |o--o{ entitlements : "holder (optional)"
```

---

## 6. Engagement: points, levels, badges, visibility (Phase 2)

```mermaid
erDiagram
    point_rules {
        uuid id PK
        text code UK
        enum_PointSubjectType subject_type
        enum_PointCategory category
        boolean is_active
    }
    point_rule_versions {
        uuid id PK
        uuid rule_id FK "UK (rule_id, version)"
        int version
        int points "negative for penalties"
        int max_per_subject
        int daily_cap
        int weekly_cap
        boolean requires_verification
        boolean requires_review
        timestamptz effective_from "no overlap per rule"
        timestamptz effective_to
    }
    point_ledger {
        uuid id PK
        enum_PointSubjectType subject_type
        uuid subject_user_id FK "exactly one subject"
        uuid subject_organization_id FK
        enum_PointCategory category
        enum_LedgerEntryType entry_type
        int amount "signed, not zero"
        uuid rule_version_id FK "null only for admin adjustment"
        text source_type
        uuid source_id
        text idempotency_key UK
        uuid reverses_entry_id FK,UK "self, reversed at most once"
        text reason
        timestamptz occurred_at "decay basis"
    }
    point_balances {
        uuid id PK
        uuid subject_user_id FK "UK (subject, category)"
        uuid subject_organization_id FK
        enum_PointCategory category
        int balance "projection"
        uuid last_entry_id FK
        timestamptz frozen_at
    }
    rewards {
        uuid id PK
        text code UK
        uuid unlock_level_id FK
        int unlock_min_points
        boolean is_active "unlocked, never spent"
    }
    member_levels {
        uuid id PK
        text code UK
        int min_points
        int max_points
        boolean requires_verification
        boolean requires_review
        boolean requires_nomination
    }
    level_assignments {
        uuid id PK
        uuid user_id FK "UK one ACTIVE per user"
        uuid level_id FK
        enum_LevelAssignmentStatus status
        int points_at_assignment
        uuid nominated_by FK
        uuid reviewed_by FK
    }
    badges {
        uuid id PK
        text code UK
        enum_PointSubjectType subject_type
        boolean is_manual
        jsonb criteria
    }
    badge_awards {
        uuid id PK
        uuid badge_id FK "UK (badge, subject) where not revoked"
        uuid subject_user_id FK
        uuid subject_organization_id FK
        timestamptz awarded_at
        timestamptz revoked_at
    }
    visibility_snapshots {
        uuid id PK
        uuid subject_user_id FK "UK current per subject"
        uuid subject_organization_id FK
        numeric score "0 to 100"
        jsonb components
        text formula_version
        boolean is_current
        timestamptz computed_at
    }
    engagement_alerts {
        uuid id PK
        uuid subject_user_id FK
        uuid subject_organization_id FK
        text alert_type
        enum_EngagementAlertStatus status
    }
    users {
        uuid id PK
    }
    organizations {
        uuid id PK
    }

    point_rules ||--|{ point_rule_versions : "ONE-TO-MANY versions"
    point_rule_versions |o--o{ point_ledger : "applied by (optional)"
    point_ledger |o--o| point_ledger : "reversed by (self)"
    users |o--o{ point_ledger : "subject (optional)"
    organizations |o--o{ point_ledger : "subject (optional)"
    users |o--o{ point_balances : "ONE-TO-MANY per category"
    organizations |o--o{ point_balances : "ONE-TO-MANY per category"
    member_levels ||--o{ level_assignments : "ONE-TO-MANY"
    member_levels |o--o{ rewards : "unlocks"
    users ||--o{ level_assignments : "history"
    badges ||--o{ badge_awards : "ONE-TO-MANY"
    users |o--o{ badge_awards : "subject (optional)"
    organizations |o--o{ badge_awards : "subject (optional)"
    users |o--o{ visibility_snapshots : "history"
    organizations |o--o{ visibility_snapshots : "history"
    users |o--o{ engagement_alerts : "subject"
    organizations |o--o{ engagement_alerts : "subject"
```

---

## 7. Events (Phase 2)

```mermaid
erDiagram
    events {
        uuid id PK
        citext slug UK
        enum_EventStatus status
        enum_EventKind kind
        text title_ar
        text title_en
        uuid location_id FK
        timestamptz starts_at
        timestamptz ends_at
        int capacity
        jsonb agenda
        uuid host_organization_id FK "BQ-17"
    }
    event_ticket_types {
        uuid id PK
        uuid event_id FK
        text name_ar
        int capacity
        int price_amount_minor "BQ-16"
        text required_feature_key "plan eligibility"
        uuid min_level_id FK "level eligibility"
    }
    event_speakers {
        uuid id PK
        uuid event_id FK
        uuid user_id FK "nullable"
        text name
    }
    event_sponsors {
        uuid id PK
        uuid event_id FK
        uuid organization_id FK "nullable"
        text name
        text tier
    }
    event_registrations {
        uuid id PK
        uuid event_id FK "UK (event, user) where CONFIRMED or WAITLISTED"
        uuid ticket_type_id FK
        uuid user_id FK
        enum_RegistrationStatus status
        int waitlist_position
        text entry_code UK
        timestamptz attended_at "attendance fact"
        enum_AttendanceMethod attendance_method
        uuid checked_in_by FK
        uuid transferred_from_registration_id FK "self"
        uuid certificate_document_id FK
    }
    event_feedback {
        uuid id PK
        uuid registration_id FK,UK
        uuid event_id FK
        smallint rating "1 to 5"
        jsonb answers
    }
    users {
        uuid id PK
    }
    organizations {
        uuid id PK
    }
    member_levels {
        uuid id PK
    }

    events ||--|{ event_ticket_types : "ONE-TO-MANY"
    events ||--o{ event_speakers : "ONE-TO-MANY"
    events ||--o{ event_sponsors : "ONE-TO-MANY"
    events ||--o{ event_registrations : "ONE-TO-MANY"
    event_ticket_types ||--o{ event_registrations : "ONE-TO-MANY"
    users ||--o{ event_registrations : "ONE-TO-MANY"
    event_registrations |o--o| event_registrations : "transferred from (self)"
    event_registrations ||--o| event_feedback : "ONE-TO-ONE (optional)"
    organizations |o--o{ events : "hosts (optional)"
    organizations |o--o{ event_sponsors : "sponsor (optional)"
    member_levels |o--o{ event_ticket_types : "eligibility (optional)"
```

**Users ⟷ events** is **MANY-TO-MANY** through `event_registrations`. The join row carries its own lifecycle (status, attendance, certificate).

---

## 8. Talent (Phase 3)

```mermaid
erDiagram
    experiences {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK "on-platform company, nullable"
        text organization_name "off-platform"
        text title
        date start_date
        date end_date
        boolean is_current
        enum_EmploymentConfirmationStatus confirmation_status
        uuid confirmed_by_user_id FK
        timestamptz verified_at
        boolean is_public
    }
    educations {
        uuid id PK
        uuid user_id FK
        text institution_name
        text degree
        date start_date
        date end_date
    }
    user_certifications {
        uuid id PK
        uuid user_id FK
        text name
        text issuer
        date expires_on
        uuid document_id FK
        timestamptz verified_at
    }
    profile_projects {
        uuid id PK
        uuid user_id FK
        uuid company_project_id FK "company project, nullable"
        text title "external, nullable"
        text role_description
    }
    profile_media {
        uuid profile_id PK,FK
        uuid media_asset_id PK,FK
        int sort_order
    }
    users {
        uuid id PK
    }
    organizations {
        uuid id PK
    }
    company_projects {
        uuid id PK
    }
    profiles {
        uuid id PK
    }
    media_assets {
        uuid id PK
    }
    verifications {
        uuid id PK
    }

    users ||--o{ experiences : "ONE-TO-MANY"
    organizations |o--o{ experiences : "employer (optional)"
    users ||--o{ educations : "ONE-TO-MANY"
    users ||--o{ user_certifications : "ONE-TO-MANY"
    users ||--o{ profile_projects : "ONE-TO-MANY"
    company_projects |o--o{ profile_projects : "linked project (optional)"
    profiles ||--o{ profile_media : "M:N media"
    media_assets ||--o{ profile_media : ""
    experiences |o--o{ verifications : "subject (optional)"
```

**Users ⟷ organizations (employment)** is MANY-TO-MANY through `experiences`. This is **not** the same as `organization_members`: an employment relationship grants **no permissions** (§10.1 vs §4).

---

## 9. Opportunities (Phase 3) — unified model; `application_messages` and `opportunity_feedback` ⏸ deferred

```mermaid
erDiagram
    opportunities {
        uuid id PK
        uuid organization_id FK "publisher"
        uuid created_by FK
        enum_OpportunityType type
        enum_JobEmploymentType employment_type "required for JOB"
        enum_OpportunityAudience audience "generated from type"
        enum_OpportunityStatus status
        text title_ar
        text title_en
        uuid location_id FK
        timestamptz application_deadline
        timestamptz published_at
        enum_OpportunityOutcome outcome "required when CLOSED"
    }
    opportunity_skills {
        uuid opportunity_id PK,FK
        uuid skill_id PK,FK
    }
    opportunity_services {
        uuid opportunity_id PK,FK
        uuid service_id PK,FK
    }
    applications {
        uuid id PK
        uuid opportunity_id FK
        uuid applicant_user_id FK "individual; UK per opportunity"
        enum_ApplicationStatus status
        jsonb availability
        uuid attachment_document_id FK
    }
    supplier_responses {
        uuid id PK
        uuid opportunity_id FK "SUPPLIER_REQUEST only, any company"
        uuid responding_organization_id FK "UK per opportunity"
        uuid submitted_by_user_id FK
        enum_SupplierResponseStatus status
        text message
    }
    application_messages {
        uuid id PK
        uuid application_id FK
        uuid sender_user_id FK
        enum_MessageSide sender_side
        text body
        timestamptz read_at
    }
    opportunity_feedback {
        uuid id PK
        uuid opportunity_id FK "UK (opportunity, application, side)"
        uuid application_id FK
        uuid respondent_user_id FK
        enum_MessageSide respondent_side
        smallint rating
    }
    organizations {
        uuid id PK
    }
    users {
        uuid id PK
    }
    skills {
        uuid id PK
    }
    services {
        uuid id PK
    }

    organizations ||--o{ opportunities : "publishes"
    opportunities ||--o{ opportunity_skills : "M:N skills"
    skills ||--o{ opportunity_skills : ""
    opportunities ||--o{ opportunity_services : "M:N services"
    services ||--o{ opportunity_services : ""
    opportunities ||--o{ applications : "ONE-TO-MANY"
    users ||--o{ applications : "individual applicant"
    opportunities ||--o{ supplier_responses : "B2B responses"
    organizations ||--o{ supplier_responses : "supplier company"
    applications ||--o{ application_messages : "ONE-TO-MANY"
    opportunities ||--o{ opportunity_feedback : "ONE-TO-MANY"
    applications |o--o{ opportunity_feedback : "ONE-TO-MANY"
```

---

## 10. Intelligence & buyer features (Phase 4 · buyer features on hold, BQ-51)

```mermaid
erDiagram
    metric_definitions {
        uuid id PK
        text code "UK (code, version)"
        int version
        enum_MetricGroup metric_group
        text formula_description
        int min_sample_size "default 5"
    }
    metric_facts {
        uuid id PK
        uuid metric_definition_id FK
        uuid organization_id FK "null = aggregate"
        text dimension_key
        date period_start
        date period_end
        numeric value
        int sample_size
        boolean is_estimated
        text data_version
    }
    benchmark_sets {
        uuid id PK
        uuid organization_id FK,UK "1:1 subscriber company"
    }
    benchmark_set_members {
        uuid id PK
        uuid benchmark_set_id FK "max 3 active"
        uuid competitor_organization_id FK
        timestamptz added_at
        timestamptz removed_at "1 change per 90 days"
    }
    reports {
        uuid id PK
        enum_ReportType type
        enum_ReportStatus status
        uuid organization_id FK
        uuid requested_by_user_id FK
        text purpose
        jsonb parameters
        text data_version
        jsonb rule_versions
        uuid document_id FK
        timestamptz expires_at
    }
    data_exports {
        uuid id PK
        uuid requested_by_user_id FK
        uuid organization_id FK
        enum_ExportFormat format
        text purpose
        int row_count
        text watermark_id UK
        uuid report_id FK
    }
    saved_lists {
        uuid id PK
        uuid organization_id FK "buyer company BQ-51"
        text name
        timestamptz deleted_at
    }
    saved_list_items {
        uuid id PK
        uuid saved_list_id FK "UK (list, company)"
        uuid company_organization_id FK
        text internal_note "never shown to company"
    }
    saved_searches {
        uuid id PK
        uuid organization_id FK
        uuid created_by_user_id FK
        jsonb query
        boolean alerts_enabled
    }
    rfis {
        uuid id PK
        uuid requester_organization_id FK
        uuid created_by FK
        text subject
        enum_RfiStatus status
        timestamptz due_at
    }
    rfi_recipients {
        uuid id PK
        uuid rfi_id FK "UK (rfi, recipient)"
        uuid recipient_organization_id FK
        enum_RfiRecipientStatus status
        text response_text
        uuid response_document_id FK
    }
    organizations {
        uuid id PK
    }
    users {
        uuid id PK
    }
    documents {
        uuid id PK
    }

    metric_definitions ||--o{ metric_facts : "ONE-TO-MANY"
    organizations |o--o{ metric_facts : "subject (optional)"
    organizations ||--o| benchmark_sets : "ONE-TO-ONE (optional)"
    benchmark_sets ||--o{ benchmark_set_members : "ONE-TO-MANY"
    organizations ||--o{ benchmark_set_members : "as competitor"
    organizations ||--o{ reports : "ONE-TO-MANY"
    documents |o--o| reports : "file (optional)"
    users ||--o{ data_exports : "ONE-TO-MANY"
    reports |o--o{ data_exports : "exported as (optional)"
    organizations ||--o{ saved_lists : "buyer company owns"
    saved_lists ||--o{ saved_list_items : "ONE-TO-MANY"
    organizations ||--o{ saved_list_items : "listed company"
    organizations ||--o{ saved_searches : "ONE-TO-MANY"
    organizations ||--o{ rfis : "requester"
    rfis ||--|{ rfi_recipients : "ONE-TO-MANY"
    organizations ||--o{ rfi_recipients : "recipient company"
```

**Organizations ⟷ organizations** appears three times as **MANY-TO-MANY** with different meanings: benchmark competitors, supplier-list entries, and RFI recipients. Each is a separate join table, because each relationship has its own rules and privacy.

---

## Important indexes (summary)

| Table | Index | Why |
|---|---|---|
| users | unique partial `email`, `phone` | Login lookup and duplicate-account prevention (§20.2). |
| organizations | unique `account_user_id` | Company-access check on every company route; one Company Account per company (BQ-68). |
| organization_members | `(organization_id, status, show_on_company_profile)` | Public team section (BQ-64). |
| organizations | GIN trigram on normalised names; `commercial_registration_number` unique partial; `website_domain` | Duplicate detection (ORG-09, §5.3), claim matching (§5.2). |
| organizations | `last_confirmed_at`; `organization_approvals (status, submitted_at)` | Staleness job (ORG-08); admin approval queue (BQ-05). |
| verifications | `(status, type, due_at)` | Reviewer queue ordered by SLA (§23). |
| search_documents | GIN `search_vector`, GIN trigram `normalized_text`, GIN arrays, `visibility_score DESC` | Search under 1 second (§17), Arabic spelling tolerance (§7.4). |
| point_ledger | unique `idempotency_key`; unique `reverses_entry_id`; `(subject, category, occurred_at)` | Exactly-once points, single reversal, caps and decay (§8.5, §8.6, §20.2). |
| subscriptions | unique partial live subscription per subscriber | No double subscription (§20.2). |
| payment_provider_events | unique `(provider, provider_event_id)` | Webhook idempotency (§15.1). |
| event_registrations | unique `entry_code`; partial unique `(event_id, user_id)` | Check-in lookup; one active registration per user. |
| audit_logs | `(entity_type, entity_id, occurred_at)`, `(actor_user_id, occurred_at)`, `(organization_id, occurred_at)` | Investigations (§3 auditor), buyer access log (§12.1, BQ-51). |
| analytics_events | monthly partitions; `(organization_id, event_name, occurred_at)` | Company performance metrics (§11.2) without scanning everything. |
| outbox_events | `(status, available_at)` | Worker polling. |
