# Back Of House — Mobile

Flutter app for [Back Of House](https://backofhouse.space/), Saudi Arabia's professional events community.

| | |
|---|---|
| Flutter / Dart | 3.47.4 / 3.13.3 (stable) |
| Platforms | Android, iOS |
| State / routing | Riverpod 3 · go_router |
| Languages | English, Arabic (RTL) |

## Getting started

```bash
flutter pub get
flutter run --dart-define-from-file=config/dev.json
```

`config/dev.json` sets `USE_MOCK_DATA=true`, so the app runs without a backend. Any
well-formed email signs in as an individual; the password `wrongpass1` exercises the
error path. Sign up as **Company** to see the company area, or as an individual with
**I'm currently a student** to apply to co-op training.

## Environments

| File | `APP_ENV` | Mock data | Network logging |
|---|---|---|---|
| `config/dev.json` | dev | on | on |
| `config/staging.json` | staging | off | on |
| `config/prod.json` | prod | off | off |

These files are committed and **must not contain secrets**. For a machine-specific
override, create `config/local.json` (git-ignored).

## Architecture

```
lib/
  app/
    theme/      Design tokens: colors & tones, typography, spacing, radii, shadows, motion, ThemeData
    router/     Routes, auth guard (pure, unit-tested), shell, route placeholders
  core/
    constants/  AppIcons (Lucide, the only icon set), AppAssets, AppConstants
    extensions/ context.l10n, context.isRtl, context.reduceMotion
    l10n/       ARB files (en, ar), generated localizations, locale controller
    media/      AppImage — widgets never receive raw URLs
    network/    Dio client, auth interceptor, ApiException (typed, not localized)
    utils/      Validators, pagination models
    widgets/    BOH component library — import `core/widgets/widgets.dart`
  features/
    auth/       domain · data (remote + mock sources) · presentation
    design_system/  Component gallery (non-prod route `/design-system`)
```

Data flows **UI → Riverpod provider → Repository (domain interface) → Data source**.
Each feature's data source provider picks the mock or remote implementation from
`AppConfig.useMockData`; nothing above the repository knows which one it got.
The backend contract the remote sources implement is
[docs/api/](docs/api/) (`openapi.yaml` plus conventions and server-side rules).

### Routes (individual member)

| Tab | Routes |
|---|---|
| Home | `/` · `/notifications` |
| Discover | `/discover` · `/events` · `/events/:id` · `/events/:id/registered` · `/opportunities` · `/opportunities/:id` · `/opportunities/:id/apply` · `/professionals` · `/companies` · `/companies/:id` · `/courses` |
| News | `/news` · `/news/:id` (likes and comments) |
| Rewards | `/rewards` · `/rewards/points` · `/rewards/:id` · `/rewards/:id/redeemed` |
| Profile | `/profile` (settings sheet: appearance, language, sign out) · `/profile/edit` · `/profile/verify` · `/applications` |

Signed out: `/auth` (welcome) · `/login` · `/login/phone` · `/register` · `/reset-password`.

### Routes (company account)

Both account types share one shell and one bottom bar (`AppShell`). Companies
get Dashboard · Listings · Suppliers · News · Profile; `AuthGuard` keeps them out
of every individual screen (including Discover), and resolves `/` and `/profile`
to the company's own Dashboard and Profile.

| Tab | Routes |
|---|---|
| Dashboard | `/company` |
| Listings | `/company/opportunities` · `/new` · `/:id` · `/:id/edit` · `/:id/applicants` |
| Suppliers | `/company/supplier-requests` · `/:id` · `/:id/respond` |
| News | shared with individuals |
| Profile | `/company/profile` (portfolio grid inside) · `/company/profile/edit` |

Above the shell: `/company/applicants/:id` · `/company/responses/:id` ·
portfolio forms `/company/portfolio/new` · `/company/portfolio/:id/edit`
(`/company/portfolio` itself redirects to the profile).

Company mock data (`CompanyWorkspaceMock`) seeds sample listings, applicants
and supplier responses so every workflow can be tried. A listing in review
shows a development-only "Simulate approval" action standing in for the Back
Of House review.

Public: `/auth` · `/login` · `/register`. Signed-out users opening a protected link go
to `/auth?from=<link>` and return there after signing in. `/companies/:id` is the
public company profile; the professionals, companies and courses directories still
render `RoutePlaceholderScreen`. Business rules live in
[docs/business-rules.md](docs/business-rules.md). The company-account flow comes next.

### Features

Each feature under `lib/features/<name>/` has `domain/` (models + repository
interface), `data/` (data source interface, mock data source, repository
implementation and providers) and `presentation/` (controllers, screens, widgets).
Mock content is bilingual and follows the selected language; mock state (points
balance, redemptions, registrations, likes, read notifications) lives for the app
session. Remote data sources are marked `TODO(api)` in each `data/` file.

Infinite lists use `PagedNotifier` (`core/utils/paginated.dart`) with
`BOHPagedSliverList`.

## Theme modes

Light is the default; dark is available from Profile → Appearance and is
persisted per device (`ThemeModeController`). Colours are roles on the
`AppColors` theme extension with a `light` and a `dark` palette — read them with
`context.colors` and styled text with `context.text`. Never reference a hex value
in a widget.

## Design system rules

The visual reference is [docs/design/](docs/design/) (open `index.html`; 31 screens
in light/dark × English/Arabic, plus `design-tokens.json`).

- Colors, sizes, radii, shadows and durations come from `app/theme/*` only. Tag and
  status colours are `AppTone` pairs on `AppColors` (`tagViolet`, `statusSuccess`, …).
  The type scale in `AppTypography` is the complete list of font sizes; numbers use
  `context.text.number()` (Poppins, Western digits, in both languages).
- Fonts: Poppins for Latin and numbers, Cairo for Arabic. Letter-spacing is removed
  automatically in Arabic (`context.text`).
- Electric violet (`primary`) is for primary buttons, the active tab, progress and the
  section skew bar (`BOHSkewBar`, never mirrored). Small violet text uses `primaryText`
  (≥ 4.5:1 in both modes, enforced by a test).
- The logo is always the supplied artwork via `BOHLogo` — never retyped.
- Icons come from `AppIcons` (Lucide weight 400); the few filled marks (star,
  verified, saved, quote) are `BOHGlyph`. Directional icons mirror in RTL.
- Use `EdgeInsetsDirectional` / `AlignmentDirectional`. Never uppercase or letter-space
  Arabic (`BOHTag`, `BOHEyebrow` handle this).
- Every tap target is ≥ 44×44; state is never conveyed by colour alone.
- Motion is 200–350ms, eased, and disabled under the OS reduce-motion setting.
- Screens are built only from `core/widgets` components. If a screen needs a new
  visual pattern, add it to the library (and the gallery) first.

Browse every component in both languages and modes at `/design-system` (Profile tab →
Design system in dev builds).

## Localization

Add strings to `lib/core/l10n/arb/app_en.arb` and `app_ar.arb`; `flutter pub get`
regenerates `AppLocalizations`. No user-facing string lives in a widget.

## Checks

```bash
dart format lib test
flutter analyze
flutter test

# Visual renders with real fonts, for design review (OS-dependent, not CI-gated)
flutter test --tags golden --run-skipped --update-goldens   # → test/goldens/renders/
```
