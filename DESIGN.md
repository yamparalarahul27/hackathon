# DESIGN.md — TBD Design System

> Single source of truth for the TBD product design language.
> Inspired by Asgard Finance's institutional DeFi aesthetic.
> All AI agents and code generation must follow these specifications.

---

## 1. Visual Theme & Atmosphere

The design embodies a **"refined institutional DeFi terminal"** — a premium, trustworthy, and data-dense trading interface that communicates competence and authority without visual noise.

**Key Characteristics:**
- Deep navy darkness with generous breathing room between elements
- Clean data presentation — financial numbers are the hero, not decorative elements
- Light-on-dark modals and overlays create clear layering hierarchy
- Rounded, approachable shape language softening the institutional density
- Minimal borders — separation through spacing and subtle background shifts
- Quiet confidence — no neon glows, no aggressive gradients, no visual gimmicks

**Mood Words:** Institutional, clean, spacious, trustworthy, premium, precise, calm authority

**Anti-Mood Words:** Flashy, neon, aggressive, cluttered, playful, gamified

---

## 2. Color Palette & Roles

### Primary Backgrounds
- **Deep Navy** (#0F1521) — Primary application background, the canvas everything sits on
- **Elevated Surface** (#1A2332) — Cards, side panels, elevated containers; slightly lighter to create depth
- **Panel Dark** (#151C28) — Alternative surface for dense data areas (chart backgrounds, table containers)
- **Bottom Bar** (#0B0F18) — Deepest tone for persistent status bars and footers

### Light Surfaces (Modals & Overlays)
- **Modal White** (#FFFFFF) — Modal backgrounds, search overlays, settings panels
- **Modal Gray** (#F8F9FA) — Secondary modal surface for subtle sectioning
- **Modal Border** (#E5E7EB) — Light borders within modal components

### Accent & Interactive
- **Primary Blue** (#3B7DDD) — Primary CTA buttons (Execute, active tabs, BUY actions), links
- **Primary Blue Hover** (#2B6BC4) — Hover state for primary actions
- **Primary Blue Subtle** (rgba(59, 125, 221, 0.12)) — Soft background tint for active/selected states

### Semantic Colors
- **Success Green** (#10B981) — Positive PnL, APY values, live indicators, long positions
- **Success Green Bright** (#22C55E) — Higher emphasis positive values (large APY numbers)
- **Danger Red** (#EF4444) — Negative PnL, price drops, short positions, errors
- **Danger Red Soft** (#F87171) — Lower emphasis negative values
- **Warning Amber** (#F59E0B) — Warnings, pending states, caution indicators
- **Teal Banner** (#0D9373) — Promotional/info banners, special CTA backgrounds

### Typography Colors
- **Text Primary** (#FFFFFF) — Headings, key values, primary content on dark backgrounds
- **Text Secondary** (#9CA3AF) — Labels, descriptions, nav items, supporting text
- **Text Muted** (#6B7280) — Placeholders, disabled text, tertiary information
- **Text Subtle** (#4B5563) — Barely visible hints, watermarks
- **Text Dark** (#111827) — Primary text on light/modal backgrounds
- **Text Dark Secondary** (#6B7280) — Secondary text on light/modal backgrounds

### Borders & Dividers
- **Border Subtle** (rgba(255, 255, 255, 0.08)) — Table rows, card edges on dark backgrounds
- **Border Light** (rgba(255, 255, 255, 0.12)) — Input borders, more visible separation
- **Border Active** (rgba(255, 255, 255, 0.20)) — Focus/hover state borders
- **Border Modal** (#E5E7EB) — Borders within light modals

---

## 3. Typography Rules

### Font Families
- **Display/Headings:** Satoshi — a modern geometric sans-serif with distinctive character. Used for hero headlines, page titles, and display text.
- **Body/UI:** IBM Plex Sans — clean, highly readable geometric sans-serif for all interface text, labels, buttons, descriptions.
- **Data/Monospace:** IBM Plex Mono — financial figures, prices, APY values, percentages, wallet addresses, code.

### Hierarchy & Weights

| Level | Font | Weight | Size | Letter-Spacing | Use |
|-------|------|--------|------|----------------|-----|
| Hero Display | Satoshi | 700 | 2.5-3rem (40-48px) | -0.02em | Landing headlines, feature titles |
| Page Title (H1) | Satoshi | 700 | 1.75-2rem (28-32px) | -0.01em | Page headings |
| Section Label | IBM Plex Sans | 600 | 0.75rem (12px) | 0.08em | Uppercase section dividers ("MOST EXECUTED CBP'S") |
| Nav Item | IBM Plex Sans | 500 | 0.875rem (14px) | 0 | Navigation links |
| Body | IBM Plex Sans | 400 | 0.875rem (14px) | 0 | General UI text, descriptions |
| Body Small | IBM Plex Sans | 400 | 0.8125rem (13px) | 0 | Supporting text, footnotes |
| Label | IBM Plex Sans | 500 | 0.75rem (12px) | 0 | Form labels, table headers |
| Button | IBM Plex Sans | 600 | 0.875rem (14px) | 0.01em | Button text |
| Data Large | IBM Plex Mono | 500 | 1.25-1.5rem (20-24px) | -0.01em | Hero financial numbers (APY, PnL) |
| Data Medium | IBM Plex Mono | 500 | 0.875rem (14px) | 0 | Table values, prices |
| Data Small | IBM Plex Mono | 400 | 0.75rem (12px) | 0 | Secondary data, timestamps |

### Spacing Principles
- Body text line-height: 1.5 for readability
- Data/numbers line-height: 1.2 for compact display
- Headings line-height: 1.2-1.3
- Uppercase labels always use expanded letter-spacing (0.05-0.08em)

---

## 4. Component Stylings

### Buttons

**Primary CTA (Execute, BUY, Connect Wallet):**
- Background: Primary Blue (#3B7DDD)
- Text: White (#FFFFFF), IBM Plex Sans 600
- Padding: 10px 20px (0.625rem 1.25rem)
- Border-radius: 8px (0.5rem)
- Hover: Darken to Primary Blue Hover (#2B6BC4), 200ms ease
- Min-height: 40px for accessibility

**Connect Wallet (Large):**
- Background: Deep Navy (#1A2332) or dark surface
- Text: White, IBM Plex Sans 600
- Padding: 14px 24px
- Border-radius: 12px (0.75rem)
- Full-width within its container
- Border: 1px solid Border Light

**Secondary/Outlined:**
- Background: Transparent
- Border: 1px solid Border Light (rgba(255,255,255,0.12))
- Text: Text Secondary (#9CA3AF)
- Hover: Background rgba(255,255,255,0.05), text brightens to white
- Border-radius: 8px

**BUY Action:**
- Background: Transparent
- Border: 1px solid Success Green (#10B981)
- Text: Success Green
- Border-radius: 8px
- Hover: Background rgba(16,185,129,0.08)

**SHORT SELL Action:**
- Text: Text Muted (#6B7280)
- No border, text-only with hover brightening

### Pills / Filter Tabs

**Active State:**
- Background: Primary Blue (#3B7DDD)
- Text: White
- Border-radius: 9999px (fully rounded pill)
- Padding: 8px 16px

**Inactive State:**
- Background: Transparent
- Border: 1px solid Border Light
- Text: Text Secondary
- Border-radius: 9999px
- Hover: Border brightens, text brightens

**Leverage Badge (9.00x, 4.50x):**
- Background: Primary Blue Subtle
- Text: Primary Blue or white
- Border-radius: 9999px
- Padding: 2px 8px
- Font: IBM Plex Mono, 12px, weight 500

### Cards & Containers

- Background: Elevated Surface (#1A2332)
- Border: 1px solid Border Subtle (rgba(255,255,255,0.08))
- Border-radius: 8px (0.5rem)
- Padding: 16-24px (1-1.5rem)
- No shadow by default (depth via background color)
- Hover: Border brightens to Border Active, 200ms ease

### Inputs & Form Controls

**Text Input:**
- Background: Transparent or rgba(255,255,255,0.03)
- Border: 1px solid Border Light
- Border-radius: 8px
- Padding: 10px 14px
- Text: White (IBM Plex Sans 400, 14px)
- Placeholder: Text Muted (#6B7280)
- Focus: Border brightens to rgba(255,255,255,0.25)

**Search Input:**
- Same as text input with left search icon (Text Muted color)
- Border-radius: 8px
- Icon: 16px, Text Muted color

**Segmented Control (Slippage: 0.01% | 0.1% | 0.5% | 1.0%):**
- Container: Background rgba(255,255,255,0.05), border-radius 8px
- Active segment: Background Deep Navy (#1A2332) or dark, text white
- Inactive: Transparent, text Text Secondary
- Individual segment border-radius: 6px
- Padding: 8px 12px per segment

**Slider (Credit Line 1x-9x):**
- Track: rgba(255,255,255,0.1), height 4px, border-radius 2px
- Filled: Primary Blue (#3B7DDD)
- Thumb: White circle, 16px, with subtle shadow
- Step markers: Small dots at intervals

**Toggle Switch:**
- Active: Teal/Primary Blue background
- Inactive: Gray track
- Thumb: White circle
- Size: 20px height

### Navigation (Top Bar)

- Background: Deep Navy (#0F1521) with subtle bottom border
- Height: ~56-64px
- Logo: Left-aligned, brand icon + wordmark
- Nav items: IBM Plex Sans 500, 14px, Text Secondary color
- Active nav item: Text Primary (white), may have underline or bold
- Right side: Notification bell icon, Connect Wallet button, hamburger menu
- Padding: 0 24px (desktop), 0 16px (mobile)

### Modals & Overlays

**Modal Container:**
- Background: Modal White (#FFFFFF)
- Border-radius: 12-16px (0.75-1rem)
- Padding: 24px
- Max-width: 480px (settings), 640px (search/pair selector)
- Shadow: 0 25px 50px rgba(0,0,0,0.5) (heavy shadow on dark backdrop)

**Modal Backdrop:**
- Background: rgba(0,0,0,0.6)
- Backdrop-filter: blur(4px)

**Modal Header:**
- Title: Text Dark (#111827), IBM Plex Sans 600, 18px
- Close button: X icon, top-right, Text Dark Secondary

**Modal Content:**
- Text: Text Dark (#111827) for primary, Text Dark Secondary (#6B7280) for descriptions
- Dividers: Border Modal (#E5E7EB)
- Accordions: Chevron icons, clean section separation

**Search/Pair Selector Modal:**
- Search input at top with icon
- Table below: sortable columns with hover rows
- Favorite star icons (left side)
- Clean alternating row hover: rgba(0,0,0,0.02)

### Tables

**Dark Background Tables (main app):**
- Header: Text Muted (#6B7280), uppercase, IBM Plex Sans 500, 12px, letter-spacing 0.05em
- Rows: Border-bottom 1px solid Border Subtle
- Row hover: rgba(255,255,255,0.02)
- Cell padding: 12-16px vertical, 16px horizontal
- Values: IBM Plex Mono for numbers, IBM Plex Sans for text

**Light Background Tables (modals):**
- Header: Text Dark Secondary, uppercase, 12px
- Rows: Border-bottom 1px solid Modal Border
- Row hover: rgba(0,0,0,0.02)

### Bottom Status Bar

- Background: Bottom Bar (#0B0F18)
- Height: ~36px
- Left: Green dot + "Live" label, SOL price with hamburger icon
- Right: Links (Book a call, Docs), social icons
- Text: IBM Plex Sans 400, 12-13px, Text Secondary
- Sticky to bottom of viewport

### Token Icons

- Size: 24-28px (table rows), 32px (selected pair)
- Shape: Circular
- Stacking: Overlapping with -4px margin for pairs
- Fallback: First 2-3 letters of symbol on colored circle

### Banner / CTA Strip

- Background: Linear gradient from Teal Banner (#0D9373) to slightly darker
- Text: White, IBM Plex Sans 500, 14px
- Icon: Left-aligned emoji or icon
- Border-radius: 8px
- Padding: 12px 16px

---

## 5. Layout Principles

### Grid & Structure
- **Max content width:** 1400px, centered
- **Page padding:** 24px desktop, 16px tablet, 12px mobile
- **Grid system:** CSS Grid / Flexbox, no rigid column count
- **Trade layout:** 70/30 split (chart area / order panel), collapsible on mobile

### Spacing Scale (8px base unit)
- **4px** — Micro: icon-to-text gaps, inline spacing
- **8px** — Tight: related elements within a group
- **12px** — Compact: form field gaps, tight card padding
- **16px** — Standard: component spacing, card padding
- **24px** — Comfortable: section padding, modal padding
- **32px** — Spacious: between major sections
- **48px** — Generous: hero section padding, page-level separation

### Content Density
- **Dashboard/Invest page:** Medium density — generous spacing, scannable
- **Trade terminal:** High density — maximize data visibility, compact spacing
- **Modals/Settings:** Low density — generous whitespace, focused attention

---

## 6. Depth & Elevation

### Surface Hierarchy (darkest to lightest)
1. **Layer 0 — Bottom Bar:** #0B0F18 (deepest)
2. **Layer 1 — Page Background:** #0F1521 (main canvas)
3. **Layer 2 — Elevated Surface:** #1A2332 (cards, panels, right sidebar)
4. **Layer 3 — Active Element:** rgba(255,255,255,0.05) (hovered cards, active inputs)
5. **Layer 4 — Modal Backdrop:** rgba(0,0,0,0.6) with blur
6. **Layer 5 — Modal Surface:** #FFFFFF (floating modals, overlays)

### Shadow Strategy
- **No shadows on dark surfaces** — depth communicated purely through background color shifts
- **Heavy shadow on modals** — `0 25px 50px rgba(0,0,0,0.5)` to lift white modals off dark background
- **Subtle shadow on dropdowns** — `0 4px 12px rgba(0,0,0,0.3)`
- Never use colored glows or neon shadows

---

## 7. Do's and Don'ts

### Do
- Use background color shifts for depth (not shadows on dark surfaces)
- Keep numbers in monospace (IBM Plex Mono) — always
- Use fully-rounded pills for filter tabs and badges
- Use 8px border-radius for cards, buttons, inputs
- Use white modals on dark backdrop for clear layer separation
- Keep uppercase labels with expanded letter-spacing for section dividers
- Show green for positive financial values, red for negative — always
- Maintain generous padding (16-24px) inside containers

### Don't
- Don't use `border-radius: 0` (rounded-none) — everything is rounded
- Don't use neon glows, text shadows, or colorful drop shadows
- Don't use glassmorphism/backdrop-blur on cards (reserve blur for modal backdrops only)
- Don't use decorative corner accents or shine effects
- Don't use pixel/bitmap fonts — only the three specified font families
- Don't use gradients on cards or buttons (flat colors only, except banners)
- Don't put borders on everything — use them sparingly, most separation is through spacing
- Don't use serif fonts anywhere in the UI
- Don't use colored backgrounds for table rows (no alternating stripe pattern)

---

## 8. Responsive Behavior

### Breakpoints
- **Mobile:** < 640px (sm)
- **Tablet:** 640-1024px (md)
- **Desktop:** 1024-1400px (lg)
- **Wide:** > 1400px (xl)

### Navigation
- **Desktop (lg+):** Horizontal top nav with all items visible
- **Tablet (md):** Horizontal top nav, items may compress
- **Mobile (sm):** Hamburger menu, full-screen overlay menu

### Trade Layout
- **Desktop:** 70/30 split — chart left, order panel right
- **Tablet:** Stack — chart on top, order panel below (full width)
- **Mobile:** Stack — chart on top (reduced height), order panel below

### Tables
- **Desktop:** Full columns visible
- **Tablet:** Hide less critical columns (24h Vol, Borrow Rate) with `hidden md:table-cell`
- **Mobile:** Horizontal scroll with visual indicator, or card layout for key data

### Modals
- **Desktop:** Centered, max-width constrained
- **Mobile:** Full-width, bottom-sheet pattern (slides up from bottom), border-radius only on top

### Touch Targets
- Minimum 44px height for all interactive elements on mobile
- 48px recommended for primary CTAs on mobile

### Typography Scaling
- Hero display: 3rem desktop → 2rem mobile
- Page titles: 2rem desktop → 1.5rem mobile
- Body/data: No scaling needed (14px works across all sizes)

---

## 9. Agent Prompt Guide

### Quick Color Reference
When generating UI code, use these Tailwind-compatible tokens:

```
Background:        bg-[#0F1521]
Surface:           bg-[#1A2332]
Panel:             bg-[#151C28]
Bottom bar:        bg-[#0B0F18]

Modal bg:          bg-white
Modal border:      border-[#E5E7EB]

Primary CTA:       bg-[#3B7DDD] hover:bg-[#2B6BC4] text-white
Success:           text-[#10B981]
Danger:            text-[#EF4444]
Banner teal:       bg-[#0D9373]

Text primary:      text-white
Text secondary:    text-[#9CA3AF]
Text muted:        text-[#6B7280]
Text dark (modal): text-[#111827]

Border subtle:     border-white/8
Border light:      border-white/12
Border active:     border-white/20
```

### Font Application
```
Hero headings:     font-satoshi font-bold text-[2.5rem]
Page titles:       font-satoshi font-bold text-[1.75rem]
Section labels:    font-['IBM_Plex_Sans'] font-semibold text-xs uppercase tracking-widest
Body text:         font-['IBM_Plex_Sans'] text-sm
Buttons:           font-['IBM_Plex_Sans'] font-semibold text-sm
Financial data:    font-['IBM_Plex_Mono'] font-medium
```

### Component Prompts

**Creating a data table:**
"Create a table with dark background (#1A2332), uppercase gray headers in IBM Plex Sans 12px with wide tracking, IBM Plex Mono for numerical values, subtle border-bottom on rows (white/8), and row hover at white/2. Green for positive values, red for negative."

**Creating a modal:**
"Create a white-background modal (#FFFFFF) with 12px border-radius, 24px padding, heavy shadow (0 25px 50px rgba(0,0,0,0.5)), over a dark backdrop (black/60 with 4px blur). Title in dark text (#111827) 18px semibold, close X button top-right."

**Creating a CTA button:**
"Create a rounded button (8px radius) with #3B7DDD background, white text in IBM Plex Sans 600 14px, 10px 20px padding, hover darkens to #2B6BC4 with 200ms ease transition."

**Creating filter pills:**
"Create fully-rounded pill tabs. Active: #3B7DDD background, white text. Inactive: transparent with white/12 border, #9CA3AF text. Hover inactive: border brightens, text brightens. 8px 16px padding."

**Creating the trade layout:**
"Create a 70/30 responsive split. Left: chart area with #151C28 background. Right: order panel with #1A2332 background and white/8 left border. Collapses to stacked on mobile."

---

## Appendix: Font Loading

```html
<!-- IBM Plex Sans + Mono from Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">

<!-- Satoshi — free from Indian Type Foundry, self-hosted -->
<!-- Download from https://www.fontshare.com/fonts/satoshi -->
<!-- Place .woff2 files in /public/fonts/ and load via @font-face in globals.css -->
```

```css
@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```
