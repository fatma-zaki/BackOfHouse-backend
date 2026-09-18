---
name: Back Of House
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#484556'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#797587'
  outline-variant: '#c9c4d8'
  surface-tint: '#5d39eb'
  primary: '#4000cc'
  on-primary: '#ffffff'
  primary-container: '#5832e6'
  on-primary-container: '#d3caff'
  inverse-primary: '#c9bfff'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc641'
  on-secondary-container: '#715300'
  tertiary: '#762900'
  on-tertiary: '#ffffff'
  tertiary-container: '#9d3900'
  on-tertiary-container: '#ffc4ad'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5deff'
  primary-fixed-dim: '#c9bfff'
  on-primary-fixed: '#1a0063'
  on-primary-fixed-variant: '#440bd4'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f6be39'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb598'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7e2c00'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes an executive, polished, and institutional environment for elite practitioners within Saudi Arabia’s expanding event, production, and cultural execution ecosystem. Drawing aesthetic balance between premier enterprise software and high-trust professional networks, the interface prioritizes credibility, professional standing, and streamlined career mobility.

The design philosophy marries **Modern Corporate Polish** with **Airy Editorial Structure**. It delivers:
- **Quiet Authority:** Eliminates playful gradients, high-saturation clutter, or gamified visuals in favor of deliberate composition, generous white space, and purposeful color application.
- **Institutional Confidence:** Surfaces clear verification markers, validated credentials, operational roles, and formal business networking tools.
- **Restrained Focus:** Visual accents are surgical; interface real estate is dedicated to showcasing verified industry experience, gig opportunities, and professional portfolios without distraction.

## Colors

The palette leverages high-order contrast anchored by a deep purple primary brand voice and balanced with warm, metallic amber accents to signify distinction, recognition, and tier advancement.

### Palette Architecture
- **Primary Brand Purple (`#5832E6` / Hover: `#5227CC`):** Reserved strictly for high-priority interactive affordances (Primary CTAs, focused tabs, selected segment pills, and system-level actions).
- **Secondary Distinction Gold (`#D4A017` / Deep: `#C69214` / Soft Tint: `#FEF9EC`):** Deployed sparingly for premium membership indicators, verified executive badges, production tenure ribbons, and achievement tokens. It must never be used for standard system actions or alerts.
- **Neutral Hierarchy:**
  - `text-primary` (`#12131A`): Slate-tinted near-black for authoritative readability on headings and titles.
  - `text-secondary` (`#545869`): Balanced cool slate for sustained reading in summaries, bios, and experience entries.
  - `text-tertiary` (`#8B90A0`): Subordinate cool gray for timestamps, breadcrumbs, tags, and micro-copy.
- **Canvas & Surface System:**
  - `canvas-base` (`#FFFFFF`): Pure white base for high-clarity focal cards and modals.
  - `canvas-muted` (`#F8F9FA` / `#F4F5F8`): Primary background canvas providing depth separation behind white containers.
  - `surface-tint` (`#F7F6FC`): Gentle lavender undertone for structural regions, active table rows, and secondary blockquotes.
- **Structural Hairstyle Outlines:**
  - `border-default` (`#EAEBF0`): Baseline hairline definition across unselected containers.
  - `border-tint` (`#E4E2F0`): Subtle purple-infused boundary applied to interactive surfaces and card groups.

## Typography

Typography is set exclusively in **Plus Jakarta Sans**, chosen for its crisp geometry, open counters, and executive clarity across English and international content layouts. 

### Rules of Usage
- **Display & Headlines:** Set in weights `600` and `700` with subtle negative tracking (`-0.01em` to `-0.02em`) to maintain editorial punch without appearing decorative.
- **Body Text:** Always rendered in weight `400` with comfortable line height factors (`1.55` to `1.625`) to preserve scannability across technical resumes, contract briefs, and stage specifications.
- **Labels & Badges:** Use `600` weight with deliberate tracking expansions (`0.01em` to `0.03em`) for small-scale verification labels, status indicators, and pill tags. All metadata tags must prioritize clear optical balance.

## Layout & Spacing

The layout runs on a strict **8-point geometric scale** (using a 4px half-step for micro-alignment). Structural compositions utilize a responsive fluid-column framework that gracefully shifts across three main screen paradigms.

### Breakpoints & Adaptive Layouts
- **Mobile (0 – 767px):** Single-column fluid view with `1rem` (16px) margins. Floating 5-item bottom dock anchored safely above the system home indicator. Complex horizontal card decks scroll with snap physics.
- **Tablet (768px – 1023px):** 8-column layout with `1.5rem` (24px) gutters and `2rem` (32px) margins. Bottom bar transitions to an adaptive side navigation rail.
- **Desktop (1024px+):** 12-column layout capped at an inner maximum container of `1280px` with `2rem` (32px) gutters and `3rem` (48px) margins. Uses an asymmetric 3-column distribution (Primary Nav: 3 cols, Feed & Working Canvas: 6 cols, Meta & Network Sidebar: 3 cols).

## Elevation & Depth

Visual hierarchy is communicated through subtle tonal separation and ultra-diffused atmospheric shadows rather than heavy drop shadows or sharp layering.

### Depth Archetypes
- **Base Level (`level-0`):** Surfaces rely exclusively on `#F8F9FA` background color paired with `#EAEBF0` hairline borders for structural partitioning.
- **Floating Card Depth (`level-1`):** Default card and standard surface elements sit on pure white (`#FFFFFF`) with a hair border (`#EAEBF0`) and diffused purple-tinted ambient shadow:  
  `box-shadow: 0 4px 20px -2px rgba(20, 16, 45, 0.05);`
- **Raised Interactive Surfaces (`level-2`):** Dropdowns, active menu panels, context menus, and elevated cards use:  
  `box-shadow: 0 10px 28px -4px rgba(20, 16, 45, 0.08);`
- **Overlays & Modals (`level-3`):** Fixed bottom navigation and modal alerts use:  
  `box-shadow: 0 20px 40px -8px rgba(20, 16, 45, 0.12);`
- **Concave Surface Modeling:** The primary navigation dock uses subtle background clipping or SVG masking to present an organic, inward-curving notch behind raised central actions, preserving structural elegance without harsh cutout corners.

## Shapes

The design system employs a **Rounded (Level 2)** shape vocabulary, establishing modern approachability while maintaining a clean, architectured demeanor.

### Border Radius Hierarchy
- **Standard Structural Modules (`rounded-2xl` / 16px):** Used for cards, event panels, professional profile cards, and modal dialogs.
- **Interactive Elements (`rounded-lg` / 10px to 12px):** Used for form inputs, standard action buttons, selector dropdowns, and split panes.
- **Contextual Chips & Avatars (`rounded-full` / 9999px):** Used for verification badges, skill pills, status indicators, and user avatars.

## Components

### Buttons
- **Primary:** Background `#5832E6`, text `#FFFFFF`, radius 10px. Hover transitions to `#5227CC`. Active state introduces subtle inner scale (`transform: scale(0.99)`). 
- **Secondary:** Background `#F7F6FC`, text `#5832E6`, border hairline `#E4E2F0`. Hover uses `#F0EDFA`.
- **Tertiary/Ghost:** Transparent background with `#545869` text. Hover uses `#F4F5F8` with `#12131A` text.
- **Executive/Premium:** Reserved for verified tier features. Background `#FEF9EC`, text `#C69214`, border `1px solid rgba(212, 160, 23, 0.3)`.

### Cards & Grouping Panels
- **Structure:** Background `#FFFFFF`, border `1px solid #EAEBF0`, corner radius `16px` (`rounded-2xl`), shadow `0 4px 20px -2px rgba(20, 16, 45, 0.05)`.
- **Padding:** Inner standard padding is `1.5rem` (`space-lg`), reducing to `1rem` on mobile layouts.
- **Interactive State:** Hover elevates to `level-2` with a subtle outline shift to `#E4E2F0`.

### Chips & Pill Tags
- **Skill/Role Pills:** `#F4F5F8` background, `#545869` text, radius `9999px`, padding `0.25rem 0.75rem`.
- **Verified Industry Badge:** Background `#FEF9EC`, text `#C69214`, gold border hairline, featuring an icon of professional authenticity.
- **Status Indicator:** Solid 8px circular node with associated status text (Available: `#16A34A`, In Production: `#5832E6`, Fully Booked: `#8B90A0`).

### Input Fields & Controls
- **Text Inputs:** Height 44px, background `#FFFFFF`, border `1px solid #EAEBF0`, radius 10px, typography `body-md`. Focus state uses border `1.5px solid #5832E6` and an ambient purple glow (`0 0 0 3px rgba(88, 50, 230, 0.1)`).
- **Checkboxes & Radios:** Base outline `1.5px solid #8B90A0`. Active checked state fills `#5832E6` with crisp white iconography.

### Bottom Navigation Bar (Mobile / Standalone App)
- **Container:** Height 64px, surface `#FFFFFF` with glassmorphic edge, top hairline `#EAEBF0`, shadow `level-3`.
- **Items:** 5 persistent icons with micro-labels (`label-sm`).
- **Floating Center Action:** Center tab is raised 12px above bar line, housed within a continuous concave negative curve cut into the top border, finished with `#5832E6` background and a pure white glyph.