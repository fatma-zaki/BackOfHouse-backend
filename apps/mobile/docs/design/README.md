# Back of House — App screen designs

Hand-off package for implementing the Back of House mobile app (Saudi Arabia's events community).

- **31 screens × 4 versions = 124 static HTML files**: Light · English (default), Dark · English, Light · Arabic (RTL), Dark · Arabic (RTL).
- Each file is a plain, self-contained HTML mock at phone size (390 × 844). Open `index.html` to browse them all.
- These are **visual references**, not production code. Rebuild them with the app's real framework and components (the existing app is Flutter). Match the layout, colours, type and spacing, and wire the screens to real data and navigation.

## Folder structure

```
index.html            Gallery of every screen in all 4 versions
screens/light-en/     Light theme, English (the default)
screens/dark-en/      Dark theme, English
screens/light-ar/     Light theme, Arabic (dir="rtl")
screens/dark-ar/      Dark theme, Arabic (dir="rtl")
assets/               Logo files (black for light, white for dark) and sample event photos
design-tokens.json    Colours, type, radii, spacing and component specs
source/               Original design-canvas source files (.dc.html), for reference only
```

## Design system summary

- **Fonts:** Poppins for Latin text, IBM Plex Sans Arabic for Arabic. Western digits are used in both languages.
- **Brand colour:** Electric violet `#6437FA`, used for primary buttons, the active tab, key highlights and progress bars.
- **Light theme:** lavender-white background `#F6F4FC`, white cards, border `#E4DFF3`, text `#15122E`.
- **Dark theme:** midnight `#05050D` background, card `#0B0C1D`, border `#1D1F3D`, text `#F4F3FF`, violet text `#A78BFA`.
- **Shape:** rounded cards (20 px), pill buttons (height 52, radius 26), chips (radius 17), soft shadows in light mode.
- **Section heading motif:** a small violet bar skewed −18° before each section title.
- **Logo:** always use the provided files. Never retype the wordmark.
- Full values are in `design-tokens.json`.

## RTL / Arabic rules

- Set `dir="rtl"` for Arabic and mirror layout using start/end, never left/right.
- Mirror directional icons (back arrows, "View all" chevrons). Keep logos, photos, email addresses and phone numbers left-to-right.
- In Arabic, turn off uppercase and letter-spacing on tags and headings.

## Navigation

**Individual account** bottom bar: Home · Discover · News · Rewards · Profile

**Company account** (lives under `/company`) bottom bar: Dashboard · Listings · Suppliers · News · Profile.
The company portfolio sits inside Company Profile.

## Screens and flows

| # | Screen | File slug | Reached from → goes to |
|---|---|---|---|
| 1 | Splash | `splash` | App launch → Welcome |
| 2 | Welcome | `welcome` | Create account → Sign up · Sign in → Sign in |
| 3 | Sign up (Individual / Company, student option) | `sign-up` | Continue → Home (or Company dashboard) |
| 4 | Sign in | `sign-in` | → Home |
| 5 | Home | `home` | Bell → Notifications · Featured event → Event details · Opportunity → Opportunity details · Points → Rewards |
| 6 | Discover (Events tab) | `discover` | Event → Event details · Companies tab → Companies directory · Professionals tab → Professionals |
| 7 | News | `news` | Story → News article |
| 8 | Rewards | `rewards` | Redeem → Reward redeemed · History → Points history |
| 9 | Profile | `profile` | Edit profile · Get verified · My applications |
| 10 | Event details | `event-details` | Register → Registration confirmed |
| 11 | Registration confirmed | `event-registered` | → Discover / Profile |
| 12 | Opportunity details | `opportunity-details` | Apply now → Apply |
| 13 | Apply | `apply` | Submit → My applications |
| 14 | My applications | `my-applications` | Status tracker: Applied → In review → Shortlisted → Decision |
| 15 | Companies directory | `companies-directory` | From Discover |
| 16 | Professionals directory | `professionals-directory` | From Discover |
| 17 | Search – no results | `search-no-results` | Empty state for Discover search |
| 18 | News article | `news-article` | From News |
| 19 | Notifications | `notifications` | From the bell |
| 20 | Reward redeemed | `reward-redeemed` | Shows the redemption code |
| 21 | Points history | `points-history` | From Rewards |
| 22 | Edit profile | `edit-profile` | Includes contact-privacy toggles, off by default |
| 23 | Get verified | `get-verified` | Verification request steps |
| 24 | Company dashboard | `company-dashboard` | New listing · Changes-requested alert · Recent applicants |
| 25 | Company listings | `company-listings` | Status: Live / In review / Changes requested / Draft |
| 26 | New listing | `company-new-listing` | Save draft / Submit for review |
| 27 | Applicants | `company-applicants` | → Applicant detail |
| 28 | Applicant detail | `company-applicant-detail` | Shortlist / Not selected |
| 29 | Supplier requests | `company-supplier-requests` | Respond → Respond to request |
| 30 | Respond to supplier request | `company-respond-request` | Send response |
| 31 | Company profile | `company-profile` | Includes the portfolio grid |

## Business rules shown in the designs

- Registering for an event earns no points. Points are awarded only when attendance is verified.
- Verification is never granted by points, payments or activity. The verified badge on company profiles is read-only.
- Profile Highlight is a points reward. It does not change verification and is not advertising.
- Back of House reviews every company listing before it goes live, and can request changes.
- Applicants' email and phone are private unless the applicant chooses to share them.
- News is editorial only. There are no member posts.

## Content

All names, dates, numbers and photos are **sample content** for layout only. Replace them with real data from the API.
