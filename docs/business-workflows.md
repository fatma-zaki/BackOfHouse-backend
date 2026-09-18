# Business Workflow Maps

> Visual maps of the major workflows **supported by the PRD**. Every step cites its PRD source.
> The state machines for each entity are in `enums-and-statuses.md`. The atomic operations (T-xx) are in `transaction-boundaries.md`.
>
> **Deliberately not drawn:** *points → rewards → redemption*. Points are never spent or redeemed, by decision BQ-08. The points workflow ends at levels, badges and visibility.

---

## 1. User lifecycle (§5.1, AUTH-01..06) · Phase 1

```mermaid
flowchart TD
    A([Visitor · web or app]) --> B[Sign up: email or phone + password<br/>AUTH-01 · BQ-30]
    B --> C{One-time code<br/>verified?}
    C -- no --> B
    C -- yes --> D[First API call<br/>users row created]
    D --> E{Choose account type<br/>at registration · BQ-60}
    E -- COMPANY --> CO[Company registration flow<br/>see §2.2 · separate security context]
    E -- INDIVIDUAL --> F[Individual registration<br/>terms · consents · skills · cities · languages]
    F --> G{Request identity /<br/>experience verification?}
    G -- later / never --> H[Active member<br/>profile hidden until opted in]
    G -- yes --> I[Verification case<br/>attach evidence]
    I --> J{Reviewer decision}
    J -- needs info --> I
    J -- rejected --> H
    J -- approved --> K[Verified identity / experience<br/>TRUST points in P2]
    K --> H
    H --> L{Profile searchable?<br/>privacy setting}
    L -- yes --> M[Appears in search<br/>professionals: P3]
    H -. joins a company as a member<br/>no company permissions · BQ-68 .-> N[Company membership<br/>shown on public team · BQ-64]
    H -. admin .-> S[SUSPENDED] -. admin .-> H
    H -. AUTH-06 later .-> X[DEACTIVATED<br/>anonymised]
```

| Step | Module | Transaction |
|---|---|---|
| Password sign-up, code confirmation, sessions, password recovery | Supabase Auth | — |
| User row + individual or company registration | identity, profiles, organizations | T-25 (+ T-02 for companies) |
| Verification | verification | T-06 |
| Suspension | identity | T-26 |

---

## 2. Company lifecycle: overview (§5.2, §5.3, §7.2, §22, decisions BQ-04/05/46/47) · Phase 1 → 4

Three separate tracks — **ownership**, **approval** and **verification** — never stand in for one another.

```mermaid
flowchart LR
    subgraph ORIGIN[Origin]
        IMP[Bulk import §22<br/>UNCLAIMED]
        NEW[Owner creates company<br/>DRAFT · BQ-05]
    end
    subgraph OWN[Ownership · exactly one owner · BQ-04]
        CLM[Claim §5.2<br/>reviewer decides → owner]
        OWNNEW[Creator = owner]
    end
    subgraph APR[Approval · BQ-05]
        ADM[Admin approves listing<br/>→ CLAIMED, public]
    end
    subgraph TRUST[Verification signals · BQ-47]
        S1[Commercial registration]
        S2[Website domain]
        S3[Each license / certification]
        S4[Each contact channel]
        VER[VERIFIED rule · BQ-53]
    end
    subgraph PROFILE[Profile]
        PRF[Profile fields ORG-01..10]
        PRJ[Projects §7.3]
        TEAM[Team · invitations AUTH-05]
    end
    subgraph GROWTH[Later phases]
        SUB[Subscription P2]
        PTS[Trust points per signal · visibility P2]
        OPP[Opportunities P3]
        RPT[Reports · benchmarks P4]
    end

    IMP --> CLM --> PRF
    NEW --> OWNNEW --> PRF --> ADM
    PRF --> PRJ
    PRF --> TEAM
    ADM --> S1 & S2 & S3 & S4
    CLM --> S1
    S1 & S2 & S3 & S4 --> VER
    S1 & S2 & S3 & S4 --> PTS
    ADM --> SUB --> RPT
    VER --> OPP
```

### 2.1 Claim an existing company (§5.2)

```mermaid
sequenceDiagram
    autonumber
    actor U as Company representative
    participant API as organizations
    participant V as verification
    participant R as Reviewer or admin
    participant ACC as access
    participant N as notifications

    U->>API: search company · "Do you represent this company?"
    U->>API: POST /companies/:id/claims {applicant_title, work_email}
    API->>API: automated checks: CR · name · domain · contacts (hints only, BQ-48)
    API->>V: open ORGANIZATION_CLAIM case
    Note over API: analytics profile_claim_started
    U->>V: attach CR + authorization letter · submit
    V->>R: queue (SLA 2 business days, §23)
    Note over R: a person always decides in Phase 1 (BQ-48)
    alt approved
        R->>V: approve
        V->>API: ClaimVerificationHandler.onApproved (same TX, T-01)
        API->>API: organizations.account_user_id = claimant Company Account (BQ-68)
        API->>API: claimed_at · status → CLAIMED · audit
        Note over API: no verification signal is set (BQ-46)
        V-->>N: verification.approved / organization.claim.approved
        N-->>U: "You are now the owner — invite your team"
    else needs info
        R->>V: request-info (reason)
        V-->>N: notify → U responds → back to review
    else rejected
        R->>V: reject (reason)
        V-->>N: notify U (appeal possible, BQ-41)
    end
```

### 2.2 Add a new company: owner creates, admin approves (§5.3, BQ-05, BQ-46)

```mermaid
flowchart TD
    A[COMPANY account registration · BQ-60] --> B[Duplicate check<br/>legal name · trade name · CR · domain]
    B --> C{Likely duplicate?}
    C -- yes --> D[Show candidates<br/>→ claim instead §5.2]
    C -- no --> E[Create DRAFT · T-02<br/>account_user_id = this Company Account<br/>one company per Company Account · BQ-68]
    E --> F[Company types and industries · BQ-61 · BQ-63<br/>services · contacts · cities · capabilities]
    F --> G[Owner submits for approval<br/>organization_approvals PENDING]
    G --> H{SYSTEM_ADMIN decision · T-29}
    H -- request changes --> F
    H -- rejected --> R[REJECTED · resubmission BQ-57]
    H -- approved --> I[Listing published · CLAIMED<br/>no verification signal set · BQ-46]
    I --> J[Owner requests verification signals<br/>each reviewed separately · BQ-47]
    I --> K[Plan features · Phase 2]
```

### 2.3 Keep company data fresh (ORG-05, ORG-08)

```mermaid
flowchart LR
    J1[[Daily job]] --> K1{Credential expiring<br/>within N days?}
    K1 -- yes --> N1[Notify owner]
    J1 --> K2{Credential expired?}
    K2 -- yes --> S1[Clear verified_at<br/>recalculate status]
    J1 --> K3{last_confirmed_at older<br/>than threshold BQ-20?}
    K3 -- yes --> S2[VERIFIED → NEEDS_UPDATE<br/>notify owner]
    S2 --> O[Owner updates or<br/>confirms data] --> S3[→ VERIFIED]
```

### 2.4 Duplicate merge (ORG-09, §22.1)

```mermaid
flowchart LR
    D1[Import preview or<br/>nightly similarity job] --> D2[organization_merges<br/>PROPOSED + signals]
    D2 --> D3{Admin decision<br/>with reason}
    D3 -- reject --> D4[REJECTED<br/>not duplicates]
    D3 -- approve --> D5[T-03 one transaction:<br/>move memberships, projects,<br/>claims, subscriptions…<br/>source → ARCHIVED<br/>merged_into set · audit]
    D5 --> D6[Search reindex<br/>redirect old slug]
```

---

## 3. Project lifecycle (§7.3) · Phase 1

```mermaid
flowchart TD
    A[Owner/editor creates DRAFT] --> B[Mandatory fields:<br/>name · type · city · date · role · scope]
    B --> C[Quality fields:<br/>services · challenge · solution · results ·<br/>size · media · official link · client]
    C --> D{Client disclosure}
    D -- NOT_DISCLOSED --> E[Client name never exposed]
    D -- DISCLOSED / CONFIRMED --> E2[Client name may be shown]
    E --> F[Submit → IN_REVIEW]
    E2 --> F
    F --> G{Reviewer §13<br/>SLA 3 business days}
    G -- needs changes --> H[NEEDS_CHANGES] --> F
    G -- rejected --> R[REJECTED]
    G -- approved --> P[PUBLISHED<br/>completion score · points ≤ 50]
    P --> S[Search index · company page]
    P --> V[Top 10 projects → visibility P2]
    P --> Z[ARCHIVED]
```

---

## 4. Verification lifecycle (generic) · Phase 1

```mermaid
flowchart LR
    O[Subject module opens case<br/>NOT_STARTED] --> E[Applicant attaches<br/>evidence documents]
    E --> S[Submit → IN_REVIEW<br/>due_at = SLA]
    S --> Q[Reviewer or admin queue<br/>ordered by due_at · human decision BQ-48]
    Q --> C{Conflict of interest?}
    C -- yes --> Q2[Reassign]
    C -- no --> D{Decision}
    D -- NEEDS_INFO --> E
    D -- REJECTED --> X[Final<br/>reason shown]
    D -- APPROVED --> H[Subject handler in same TX<br/>e.g. claim → owner · signal verified_at]
    H --> T[verification.approved<br/>→ TRUST points P2<br/>→ notification]
    H --> EXP[[Expiry job]] --> EX[EXPIRED<br/>subject recalculated<br/>trust points reversed]
```

---

## 5. Buyer entity journey (§5.4, §12) · Phase 4 · ⚠️ on hold (BQ-51)

> Every organization is a company (BQ-06), so the separate institution workspace below cannot be built as drawn. Kept for reference until BQ-51 decides how buyers are handled.

```mermaid
flowchart TD
    A[Entity representative registers] --> B[Verify email · capacity · authorization<br/>ENTITY_REPRESENTATIVE case]
    B --> C[Institution workspace created<br/>owner membership · MFA required]
    C --> D[Invite users<br/>buyer · analyst · reader · auditor]
    D --> E[Advanced search<br/>service · city · verification · experience · capacity]
    E --> F[Save to private supplier list<br/>+ internal notes]
    F --> G[Side-by-side comparison]
    G --> H[Send RFI to companies]
    H --> I[Companies respond]
    E --> K[Saved search + alerts]
    G --> J[Authorised report / export<br/>purpose · watermark · export log T-20]
    J --> L[(audit_logs · data_exports)]
```

---

## 6. Event lifecycle (§9.2) · Phase 2

```mermaid
flowchart TD
    A[Staff creates DRAFT<br/>location · capacity · schedule ·<br/>speakers · sponsors] --> B[Ticket types<br/>eligibility by membership BQ-16]
    B --> C[PUBLISHED]
    C --> D[User registers T-11]
    D --> E{Eligible &<br/>capacity available?}
    E -- not eligible --> X[Rejected 403]
    E -- full --> W[WAITLISTED]
    E -- yes --> R[CONFIRMED<br/>unique entry code]
    R --> RC[Cancel T-12] --> PR[Promote next waitlisted]
    PR --> R
    R --> TR[Transfer → new CONFIRMED<br/>for recipient]
    R --> CI{Event day check-in T-13}
    CI -- entry code --> AT[attended_at · ENTRY_CODE]
    CI -- manual fallback --> AT2[attended_at · MANUAL]
    CI -- no show --> NS[No attendance]
    AT --> P[event.attendance.verified<br/>→ ACTIVITY points<br/>meetup 10 / workshop 15]
    AT2 --> P
    C --> DONE[COMPLETED]
    DONE --> SV[Post-event survey]
    DONE --> CERT[Attendance certificate<br/>when eligible BQ-19]
    DONE --> REP[Report: registrations ·<br/>attendance · no-shows · satisfaction]
```

**Rule (§9.2, §20.2):** points are added **after attendance is verified, never after booking**. A registration with no `attended_at` never produces a ledger entry.

---

## 7. Opportunities, applications and supplier requests (business rules §5–§9) · Phase 3

### 7.1 One opportunity lifecycle for every type

```mermaid
flowchart TD
    A[Company member creates DRAFT<br/>type: JOB · CO_OP · VOLUNTEERING · SUPPLIER_REQUEST] --> P[Type policy map<br/>audience · required fields · who responds]
    P --> PUB[PUBLISHED]
    PUB <--> PA[PAUSED]
    PUB --> AUD{audience}
    AUD -- INDIVIDUAL --> IND[Listed in /opportunities<br/>individuals apply]
    AUD -- COMPANY --> CMP[Listed in /supplier-requests<br/>Company Accounts only · any company responds]
    IND --> CL[CLOSED with outcome · T-18]
    CMP --> CL
    CL --> AR[ARCHIVED]
```

### 7.2 Individual application (rules §8, BQ-67)

```mermaid
flowchart LR
    S[SUBMITTED<br/>individual applies · T-17] --> CH{Company chooses<br/>any status · flexible}
    CH --> R[REVIEWED]
    CH --> SL[SHORTLISTED]
    CH --> C[CONTACT]
    CH --> ACC[ACCEPTED]
    CH --> REJ[REJECTED]
    R & SL & C --> CH
    S -. applicant · rule BQ-67 .-> W[WITHDRAWN]
```

Examples: `SUBMITTED → ACCEPTED`, `SUBMITTED → SHORTLISTED → ACCEPTED`, `SUBMITTED → REJECTED`. The company decides; Back Of House only connects the parties. Company projects (portfolio) never receive applications (BQ-62).

### 7.3 Supplier request (B2B, rules §7)

```mermaid
sequenceDiagram
    autonumber
    participant B as Buyer company member
    participant API as opportunities
    participant S as Supplier company member
    participant N as notifications

    B->>API: POST /organizations/:buyer/opportunities {type: SUPPLIER_REQUEST}
    B->>API: publish
    API-->>N: opportunity.published (company audience)
    S->>API: GET /supplier-requests
    S->>API: POST /supplier-requests/:id/responses {organization_id: supplier}
    API->>API: T-31: supplier ≠ buyer · one response per company · no individual responses
    API-->>N: supplier_response.submitted → buyer notified
    B->>API: GET /organizations/:buyer/opportunities/:id/supplier-responses
    Note over B,S: Any company may respond, no type restriction (BQ-66).<br/>Individuals never see or answer supplier requests (BQ-65)
```

**Deferred (rules §9):** messaging, interviews, offers, matching, surveys, recruitment analytics.

**Legal constraint (§10.3):** Back Of House is a discovery and matching intermediary. It is not the employer and does not guarantee the contract or payment. The backend does **not** model contracts, payroll or escrow (§2.2).

---

## 8. Points & engagement lifecycle (§8, §9.1) · Phase 2

```mermaid
flowchart LR
    subgraph SRC[Verified business facts]
        S1[Verification approved]
        S2[Attendance verified]
        S3[Project published / score changed]
        S4[Profile completion changed]
        S5[Employment confirmed P3]
        S6[Penalty decision]
    end
    subgraph RULES[Rules]
        R1[point_rules<br/>+ active version]
        R2[Caps · once-only ·<br/>requires verification/review]
        R3[Idempotency key]
    end
    subgraph LEDGER[Source of truth]
        L1[(point_ledger<br/>append-only)]
    end
    subgraph PROJ[Projections]
        B1[point_balances<br/>per category]
        LV[Level evaluation]
        BD[Badge evaluation]
        VS[Visibility score<br/>+ activity decay]
    end
    subgraph OUT[Effects]
        O1[Level benefits RG-22]
        O2[Badges shown]
        O3[Search ranking signal]
    end

    S1 & S2 & S3 & S4 & S5 & S6 --> R1 --> R2 --> R3 --> L1
    L1 --> B1 --> LV --> O1
    B1 --> BD --> O2
    L1 --> VS --> O3
    LV -- upper levels --> HR[Human review §8.6]
    L1 -- corrections --> REV[REVERSAL entry<br/>never UPDATE]
```

Levels depend on points only, never on verification (BQ-07). Points are never spent or redeemed (BQ-08). Full design: `points-architecture.md`.

---

## 9. Subscription lifecycle (§7.5) · ⏸ DEFERRED future monetization (business rules §11)

```mermaid
flowchart TD
    A[Owner picks plan] --> B{Trial available?}
    B -- yes --> TR[TRIAL]
    B -- no --> CO[Checkout · payment gateway]
    TR --> CO
    CO --> WH[Signed webhook<br/>deduplicated T-14]
    WH -- success --> AC[ACTIVE<br/>invoice issued · entitlements recalculated]
    WH -- failure --> F[Payment failed → retry]
    AC --> RN{Renewal}
    RN -- paid --> AC
    RN -- failed --> GR[GRACE_PERIOD] --> PD[PAST_DUE] --> EXP[EXPIRED<br/>entitlements → free]
    GR -- paid --> AC
    PD -- paid --> AC
    AC --> UP[Upgrade → immediate T-15]
    AC --> DN[Downgrade → end of cycle]
    AC --> CN[Cancel → CANCELLED<br/>access until period end] --> EXP
    MAN[Admin manual approval<br/>for entities] --> AC
```

**Invariant (§7.5, §8.1):** subscription changes **never** touch trust, verification or organic visibility. Only entitlements (including the labelled paid partner badge) change.

---

## 10. Bulk import (§22, §22.1) · Phase 1

```mermaid
flowchart LR
    U[Upload source file] --> P[Parse → import_rows<br/>source_record_id]
    P --> V[Validate · normalise<br/>error log per row]
    V --> DD[Duplicate detection<br/>vs existing + within batch]
    DD --> PV[PREVIEW report<br/>nothing written]
    PV --> DEC{Admin commits?}
    DEC -- no --> FIX[Fix file · re-upload]
    DEC -- yes --> CM[COMMIT job<br/>chunks · UNCLAIMED orgs<br/>unconfirmed contacts private]
    CM --> QR[Quality & completeness report]
    CM --> RB{Rollback needed?}
    RB -- yes --> RBK[ROLLED_BACK<br/>archive created orgs<br/>without dependants T-21]
    QR --> INV[Claim invitations<br/>first 150 companies §22]
```

---

## 11. Report generation (§11, §29.1) · Phase 4

```mermaid
flowchart LR
    RQ[Request or schedule<br/>purpose required] --> SC[SCHEDULED]
    SC --> GN[GENERATING<br/>worker]
    GN --> CHK{Sample ≥ 5?<br/>confidential data excluded?}
    CHK -- suppress segment --> GN
    GN -- error --> FL[FAILED] -- admin regenerate --> SC
    GN --> RD[READY<br/>data_version + rule_versions stored]
    RD --> EXPT[Export PDF/XLSX<br/>export log + watermark T-20]
    RD --> EX[EXPIRED]
```

---

## 12. Launch & migration sequence (§22)

```mermaid
flowchart LR
    M1[Clean company data<br/>normalise names & taxonomy] --> M2[Pilot import 50]
    M2 --> M3[Internal run with BOH team]
    M3 --> M4[Closed pilot<br/>10 companies + 2 buyers BQ-26 · BQ-51]
    M4 --> M5[Fix · freeze schema]
    M5 --> M6[Import 500 UNCLAIMED]
    M6 --> M7[Claim invitations to 150]
    M7 --> M8[Gradual public launch<br/>daily monitoring]
    M8 --> M9[30-day review → go/no-go<br/>for memberships P2]
```
