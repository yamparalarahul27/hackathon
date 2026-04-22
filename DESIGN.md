# Design System — DeFi Triangle / Y-Vault

> Single source of truth for the DeFi Triangle product design language.
> Authored to the [Stitch Design.md specification](https://stitch.withgoogle.com/docs/design-md/specification).
> All AI agents, Stitch prompts, and code generation must follow these specifications.
> Last audited against: `globals.css`, `Button.tsx`, `Card.tsx`, `Pill.tsx`, `Navbar.tsx`, `BottomBar.tsx`, `StatusDot.tsx`, `TokenIcon.tsx`

---

## Identity

**Product name:** TBD (Y-Vault)
**Visual theme:** Refined Institutional DeFi Terminal
**Aesthetic:** A premium, data-dense trading interface that communicates competence and authority. Deep dark-navy hero sections bleed into a clean light-surface body — numbers are the hero, decoration is the enemy.

**Mood words:** Institutional · Precise · Spacious · Trustworthy · Calm authority
**Anti-mood words:** Flashy · Neon · Cluttered · Gamified · Playful

---

## Color

### Palette Naming Convention

The palette uses three named scales — **Frost** (blues), **Hela** (neutrals), **Loki** (greens) — plus semantic and state tokens.

### Frost (Blues)

| Token | Value | Role |
|---|---|---|
| `--frost-200` | `#f1f5f9` | Page background (light body) |
| `--frost-300` | `#cbd5e1` | Muted borders on light surfaces |
| `--frost-400` | `#19549b` | Interactive blue, card gradient end |
| `--frost-500` | `#11274d` | Deep blue surface, card gradient start |
| `--frost-600` | `#091731` | Dark header surface |
| `--frost-700` | `#030f1a` | Deepest navy (hero bottom) |

### Hela (Neutrals)

| Token | Value | Role |
|---|---|---|
| `--hela-600` | `#4c4c5b` | Muted text on dark surfaces |
| `--hela-750` | `#1d2836` | Elevated card surface in dark contexts |
| `--hela-800` | `#061322` | Deep panel background |
| `--hela-900` | `#020e1a` | Absolute background floor |

### Loki (Greens)

| Token | Value | Role |
|---|---|---|
| `--loki-100` | `#e5f7f2` | Subtle success background |
| `--loki-600` | `#0fa87a` | Success / positive PnL / live indicator |
| `--loki-700` | `#157357` | Hover state for success actions |

### Semantic Tokens

| Token | Value | Role |
|---|---|---|
| `--main-bg` | `#f1f5f9` | Body page background |
| `--ink` | `#212121` | Primary text on light surfaces |
| `--muted` | `#6a7282` | Secondary / supporting text |
| `--true-black` | `#111113` | Absolute black for borders and overlays |
| `--green-main` | `#18df74` | High-emphasis positive (hero APY) |
| `--danger` | `#ef4444` | Negative PnL, errors, short positions |
| `--warning` | `#f59e0b` | Warnings, pending states |
| `--cta-color` | `#3B7DDD` | Primary CTA (user-customisable via Settings) |

### Customisable Tokens (Settings Modal)

| Token | Default | Role |
|---|---|---|
| `--card-gradient-from` | `#091731` | Card gradient dark stop |
| `--card-gradient-to` | `#19549b` | Card gradient light stop |
| `--cta-color` | `#3B7DDD` | Button / link accent colour |

### State Messaging Tokens

| Variant | Background | Border | Text | Icon |
|---|---|---|---|---|
| Info | `#EFF6FF` | `#BFDBFE` | `#1D4ED8` | `#2563EB` |
| Warning | `#FFFBEB` | `#FDE68A` | `#B45309` | `#D97706` |
| Error | `#FEF2F2` | `#FECACA` | `#B91C1C` | `#DC2626` |

State surface: `#FFFFFF` · State meta text: `#6B7280` · State divider: `#E5E7EB`

### Dark Surface Overrides (Terminal / Trade Views)

When rendered on dark surfaces use the following instead of the semantic tokens above:

| Role | Value |
|---|---|
| Primary background | `#0F1521` |
| Elevated card | `#1A2332` |
| Dense panel | `#151C28` |
| Bottom status bar | `#0B0F18` |
| Border subtle | `rgba(255,255,255,0.08)` |
| Border light | `rgba(255,255,255,0.12)` |
| Border active | `rgba(255,255,255,0.20)` |
| Text primary | `#FFFFFF` |
| Text secondary | `#9CA3AF` |
| Text muted | `#6B7280` |
| Success | `#10B981` |
| Success bright | `#22C55E` |
| Danger | `#EF4444` |

### Hero Gradient

```css
background: linear-gradient(
  #000003,
  #000036 37.9%,
  #143f79 81.7%,
  #496d93 110%,
  #8cacc6 152.7%,
  #b6d0dc 196.7%,
  #fcffff 285%
);
```

Used on the full-bleed landing hero section only.

---

## Typography

### Font Stack

| Family | Source | Role |
|---|---|---|
| **Geist Mono** | Google Fonts | Hero display headings |
| **Geist Pixel Square** | Self-hosted `/fonts/GeistPixel-Square.woff2` | Financial data (prices, APY, PnL) |
| **IBM Plex Mono** | Google Fonts | Fallback data font, addresses |
| **IBM Plex Sans** | Google Fonts | All UI labels, buttons, descriptions |
| **Instrument Sans** | Google Fonts | Alternative UI sans |
| **Inter** | Google Fonts | Body copy fallback |

**Font smoothing:** `antialiased` on all body text.

### CSS Utility Classes

```css
.font-satoshi        /* Geist Mono → IBM Plex Mono fallback */
.font-ibm-plex-sans  /* IBM Plex Sans → Inter fallback */
.font-instrument     /* Instrument Sans → Inter fallback */
```

### Type Scale

| Class / Level | Font | Weight | Size (mobile → desktop) | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|---|
| Hero Display | Geist Mono | 700 | 2rem → 3rem | 1.2 | −0.02em | Landing headline |
| Page Title (H1) | Geist Mono | 700 | 1.5rem → 2rem | 1.2 | −0.01em | Page headings |
| `.label-section` | IBM Plex Sans | 600 | 0.6875rem | 1 | 0.1em | Dark-bg section dividers (uppercase) |
| `.label-section-light` | IBM Plex Sans | 600 | 0.6875rem | 1 | 0.1em | Light-bg section dividers (uppercase) |
| Nav Item | IBM Plex Sans | 500 | 0.875rem | 1.35 | 0 | Navigation links |
| Body | Inter / IBM Plex Sans | 400 | 0.875rem | 1.5 | 0 | Descriptions, general UI |
| Button | IBM Plex Sans | 600 | 0.875rem | 1 | 0.01em | Button labels |
| `.data-lg` | Geist Pixel Square | 400 | 1.125rem → 1.875rem | 1.2 | 0 | Hero financial figures |
| `.data-md` | Geist Pixel Square | 400 | 0.875rem | 1.2 | 0 | Table values, prices |
| `.data-sm` | Geist Pixel Square | 400 | 0.75rem | 1.2 | 0 | Secondary data, timestamps |
| State notice text | IBM Plex Sans | 500 | 0.75rem | 1.333 | 0 | State/alert messages |
| State severity label | IBM Plex Sans | 600 | 0.625rem | 1.2 | 0.02em | Alert severity badge |

### Rules

- All financial numbers use **Geist Pixel Square** (fallback: IBM Plex Mono). Never a serif or variable-weight font.
- Section labels are always **uppercase with letter-spacing ≥ 0.08em**.
- Dark surface labels use `rgba(255,255,255,0.4)`.
- Light surface labels use `rgba(17,17,19,0.5)`.
- Never use serif fonts anywhere in the UI.

---

## Spacing

**Base unit:** 8px

| Step | Value | Name | Use |
|---|---|---|---|
| 1 | 4px | Micro | Icon-to-text gap, inline |
| 2 | 8px | Tight | Related elements within a group |
| 3 | 12px | Compact | Form field gaps, tight card padding |
| 4 | 16px | Standard | Component spacing, card padding |
| 5 | 24px | Comfortable | Section padding, modal padding |
| 6 | 32px | Spacious | Between major sections |
| 7 | 48px | Generous | Hero section padding, page-level |

**Border radius scale:**
- `4px` — icon boxes, segmented control segments
- `6px` — state notice, inner segments
- `8px` — cards, buttons, inputs, pills (default)
- `12px` — large modals, connect-wallet button
- `9999px` — filter pills, badges

---

## Components

### Button

> Source: `src/components/ui/Button.tsx`
> Base classes: `font-instrument font-semibold rounded-sm transition-all duration-150 inline-flex items-center justify-center gap-2`
> Disabled: `opacity-40 cursor-not-allowed`

**⚠️ Important:** Buttons use `rounded-sm` (2px radius) and `Instrument Sans` — NOT `rounded` (8px) or IBM Plex Sans.

| Variant | Background | Text | Hover |
|---|---|---|---|
| `primary` | `#19549b` (frost-400) | white | `#143f78` |
| `execute` | `#19549b` (frost-400) | white | `#143f78` |
| `secondary` | `#FFFFFF` + `border border-[#cbd5e1]` | `#11274d` | bg `#f1f5f9` |
| `ghost-dark` | `rgba(255,255,255,0.10)` | white | bg `rgba(255,255,255,0.20)` |
| `ghost-light` | transparent | `#6a7282` | text `#212121`, bg `#f1f5f9` |

| Size | Padding | Font size |
|---|---|---|
| `sm` | `6px 12px` | 12px |
| `md` | `8px 16px` | 14px |
| `lg` | `10px 20px` | 14px |

**Transition:** `all 150ms` (not 200ms)

**Connect Wallet button (navbar):**
- Uses `ghost-light` variant + explicit `border border-[#cbd5e1] bg-white hover:bg-[#e2e8f0]`
- Height: `28px` (h-7), padding: `0 12px`

---

### Pills / Filter Tabs

> Source: `src/components/ui/Pill.tsx`
> Base: `rounded-sm` (2px) — NOT fully rounded pills
> Font: IBM Plex Sans medium
> Transition: `all 150ms`

**Active:**
- Background: `#19549b` (frost-400)
- Text: white
- Shadow: `raised-frosted-active` → `0 2px 8px rgba(25,84,155,0.25)`

**Inactive:**
- Background: `#FFFFFF`
- Text: `rgba(17,39,77,0.50)` (frost-500 at 50%)
- Shadow: `raised-frosted-tab` → `0 1px 2px rgba(0,0,0,0.05)`
- Hover text: `rgba(17,39,77,0.70)`

| Size | Height | Padding | Font size |
|---|---|---|---|
| Mobile | `36px` (h-9) | `6px 16px` | 12px |
| Desktop (lg+) | `40px` (h-10) | `8px 18px` | 14px |

**Leverage / Status Badge (inline):**
- Background: `#f1f5f9`
- Text: `#6a7282`, 9px, uppercase, `tracking-wider`
- Border-radius: `rounded-sm`
- Padding: `2px 6px`
- Example: "Soon" badge in navbar disabled items

---

### Cards & Containers

**Light surface (body):**
- Background: `#FFFFFF`
- Border: `1px solid rgba(17,17,19,0.08)`
- Border-radius: `8px`
- Padding: `16–24px`
- Shadow (rest): `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- Shadow (hover): `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)`
- Shadow (active): `0 2px 8px rgba(25,84,155,0.25)`

**Dark surface (terminal):**
- Background: `#1A2332`
- Border: `1px solid rgba(255,255,255,0.08)`
- Border-radius: `8px`
- No shadow (depth via background shift only)
- Hover border: `rgba(255,255,255,0.20)`, `200ms ease`

**Gradient card (customisable):**
```css
background: linear-gradient(var(--card-gradient-from), var(--card-gradient-to));
```

**Card footer tint:**
```css
background-color: rgba(15, 23, 42, 0.03); /* .bg-frost-tint */
```

---

### Inputs & Form Controls

**Text / Search Input:**
- Background: `transparent` or `rgba(255,255,255,0.03)`
- Border: `1px solid rgba(255,255,255,0.12)`
- Border-radius: `8px`
- Padding: `10px 14px`
- Text: white, IBM Plex Sans 400, 14px
- Placeholder: `#6B7280`
- Focus border: `rgba(255,255,255,0.25)`

**Segmented Control (e.g. Slippage):**
- Container: `rgba(255,255,255,0.05)`, border-radius `8px`
- Active segment: `#1A2332`, text white
- Inactive segment: transparent, text `#9CA3AF`
- Segment border-radius: `6px`
- Padding per segment: `8px 12px`

**Slider (Leverage 1x–9x):**
- Track: `rgba(255,255,255,0.1)`, height `4px`
- Filled: `#3B7DDD`
- Thumb: white circle, `16px`

**Toggle Switch:**
- Active: `--cta-color` or teal track
- Inactive: gray track
- Thumb: white circle, height `20px`

---

### State Notice

```
.state-notice           padding: 10px 12px; border-radius: 6px; border: 1px solid;
.state-info             bg #EFF6FF, border #BFDBFE
.state-warning          bg #FFFBEB, border #FDE68A
.state-error            bg #FEF2F2, border #FECACA
.state-notice-text      IBM Plex Sans 500, 12px/16px
.state-severity-label   IBM Plex Sans 600, 10px/12px, tracking 0.02em
.state-stale-badge      pill, warning colours, 10px/12px 600
.state-action-btn       #19549B, IBM Plex Sans 500, 12px; hover #143F78
```

---

### Navigation (Top Bar)

> Source: `src/components/layout/Navbar.tsx`

**Container:**
- `sticky top-0 z-20`
- Background: `rgba(241,245,249,0.95)` (`bg-[#f1f5f9]/95`) + `backdrop-blur-lg`
- Border: `border-b border-[#cbd5e1]`
- Height: **48px** (h-12) — not 56–64px
- Max-width: `1400px`, centered
- Padding: `0 16px` mobile, `0 24px` desktop (lg+)

**Logo area (left):**
- Logo `/logo.svg` — `24×24px`
- Wordmark: Geist Mono (`.font-satoshi`) bold 14px `#11274d` — hidden on mobile, visible `lg+`

**Nav items (desktop, hidden on mobile):**
- Font: IBM Plex Sans, `12px`, weight `400`
- Inactive: `#6a7282` → `#11274d` on hover
- Active: `#11274d`
- Transition: `colors 150ms`
- Gap between items: `24px`

**Nav items (mobile):**
- Horizontal scroll row below main bar (`pb-2`, `overflow-x-auto scrollbar-hide`)
- Same font as desktop but no hover (touch)
- Visible only below `lg` breakpoint

**Right side controls:**

| Control | Style |
|---|---|
| Settings button | `h-7 px-2 rounded-sm bg-white border border-[#cbd5e1] text-[#11274d] hover:bg-[#e2e8f0]` |
| Connect Wallet | `Button ghost-light sm` + `border border-[#cbd5e1] bg-white hover:bg-[#e2e8f0]` |
| Hamburger | Same as settings button, `lg:hidden` |
| Wallet chip (connected) | `h-7 px-3 bg-white border border-[#cbd5e1] rounded-sm text-xs IBM Plex Sans hover:bg-[#e2e8f0]` |

---

### Dropdown Menus

> Used in: Settings menu, Wallet menu (Navbar)

- Background: `#FFFFFF`
- Border: `1px solid #cbd5e1`
- Border-radius: `rounded-sm` (2px)
- Shadow: `raised-frosted`
- `z-30`, `min-w-[180px]` (settings) / `min-w-[240px]` (wallet)
- Position: `absolute right-0 top-8`
- Padding: `py-1`

**Menu item:**
- `w-full flex items-center gap-2 px-3 py-2`
- Font: IBM Plex Sans, 12px, `#11274d`
- Hover: `bg-[#f1f5f9]`, transition `colors`
- Icon: 12px, `#6a7282`

**Wallet chip (connected state):**
- Green dot (`w-1.5 h-1.5 rounded-full bg-[#0fa87a]`) + truncated address (`0x1234...5678`) + `ChevronDown` icon
- Address label: `font-mono text-xs text-[#11274d]`
- "Connected" badge header inside dropdown: `text-[10px] uppercase tracking-wider text-[#6a7282]`
- Full address: `font-mono text-[11px] text-[#11274d] break-all`

**Dismiss:** Click outside or `Escape` key

---

### Tables

**Dark background:**
- Header: `#6B7280`, uppercase, IBM Plex Sans 500, 12px, `letter-spacing: 0.05em`
- Row border: `1px solid rgba(255,255,255,0.08)`
- Row hover: `rgba(255,255,255,0.02)`
- Cell padding: `12–16px` vertical, `16px` horizontal
- Numbers: Geist Pixel Square / IBM Plex Mono
- Text cells: IBM Plex Sans

**Light modal:**
- Header: `#6B7280`, uppercase, 12px
- Row border: `1px solid #E5E7EB`
- Row hover: `rgba(0,0,0,0.02)`

---

### Modals & Overlays

- Background: `#FFFFFF`
- Border-radius: `12–16px`
- Padding: `24px`
- Max-width: `480px` (settings), `640px` (pair selector)
- Shadow: `0 25px 50px rgba(0,0,0,0.5)`
- Backdrop: `rgba(0,0,0,0.6)`, `backdrop-filter: blur(4px)`
- Title: `#111827`, IBM Plex Sans 600, 18px
- Body text: `#111827` primary, `#6B7280` secondary
- Dividers: `#E5E7EB`
- Mobile: full-width bottom-sheet, border-radius top only

---

### Frosted Icon Box

```css
.frosted-icon-box {
  width: 2rem; height: 2rem; border-radius: 0.25rem;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.70);
}
```
Icon size: `1rem`.

---

### Token Icons

> Source: `src/components/ui/TokenIcon.tsx`

| Size prop | Class | Pixels |
|---|---|---|
| `sm` | `w-5 h-5` | 20×20 |
| `md` (default) | `w-6 h-6` | 24×24 |
| `lg` | `w-8 h-8` | 32×32 |

- Shape: `rounded-full object-cover shrink-0`
- Source: Solana token-list CDN via `getTokenIcon(mint, symbol)`
- Fallback: `handleIconError` replaces with avatar URL

**Token Pair (`TokenPairIcons`):**
- Wrapper: `flex -space-x-1` (4px overlap)
- Each icon: `border-2 border-white` (white separator ring)

### StatusDot

> Source: `src/components/ui/StatusDot.tsx`

- Size: `w-1.5 h-1.5` (6×6px), `rounded-full`
- Wrapper: `relative inline-flex`

| Variant | Color |
|---|---|
| `live` | `#0fa87a` (loki-600) |
| `success` | `#0fa87a` (loki-600) |
| `danger` | `#ef4444` |
| `warning` | `#f59e0b` |

**Pulse mode** (`pulse={true}`):
- Adds `absolute` behind-dot ring: `animate-ping opacity-75` in same color
- Use sparingly — only for "live" real-time indicators

---

### Bottom Status Bar

> Source: `src/components/layout/BottomBar.tsx`

**⚠️ Correction:** Bottom bar is **light**, not dark.

- `fixed bottom-0 left-0 right-0 z-40`
- Background: `rgba(255,255,255,0.95)` + `backdrop-blur`
- Border: `border-t border-[#cbd5e1]`
- Height: `36px` (h-9)
- Max-width: `1400px`, centered, padding `0 16px` / `0 24px` desktop

**Left side:**
- `StatusDot` (live, no pulse) + "Live" label — IBM Plex Sans 12px `#6a7282`
- SOL price — `font-mono text-xs text-[#6a7282]`, fetched from Binance every 30s, shows `...` while loading

**Right side:**
- "Design & Engineered by Yamparala Rahul" — IBM Plex Sans 12px `#94a3b8`

---

### Banner / CTA Strip

- Background: `linear-gradient(#0D9373, <darker>)`
- Text: white, IBM Plex Sans 500, 14px
- Border-radius: `8px`
- Padding: `12px 16px`
- Left: emoji or icon

---

## Layout

### Page Structure

- **Split layout:** dark gradient hero header → light `#f1f5f9` body
- **Max content width:** `1400px`, centered
- **Page padding:** `24px` desktop · `16px` tablet · `12px` mobile
- **Trade terminal:** `70/30` split — chart left, order panel right

### Breakpoints

| Name | Width | Behaviour |
|---|---|---|
| Mobile | `< 640px` | Single column, hamburger nav, bottom-sheet modals |
| Tablet | `640–1024px` | Stacked layouts, compressed nav |
| Desktop | `1024–1400px` | Full layouts, horizontal nav |
| Wide | `> 1400px` | Capped at 1400px content width |

### Content Density

| Context | Density | Notes |
|---|---|---|
| Dashboard / Invest | Medium | Generous spacing, scannable |
| Trade Terminal | High | Maximise data, compact |
| Modals / Settings | Low | Generous whitespace, focused |

### Touch Targets

- Minimum `44px` height for all interactive elements on mobile
- `48px` recommended for primary CTAs

---

## Depth & Elevation

### Surface Hierarchy (dark-first)

| Layer | Token / Value | Role |
|---|---|---|
| 0 | `#0B0F18` | Bottom status bar (floor) |
| 1 | `#0F1521` / `#030f1a` | Page background |
| 2 | `#1A2332` / `#1d2836` | Cards, side panels |
| 3 | `rgba(255,255,255,0.05)` | Hovered cards, active inputs |
| 4 | `rgba(0,0,0,0.6) + blur(4px)` | Modal backdrop |
| 5 | `#FFFFFF` | Modals, overlays |

### Shadow Rules

| Class | Value | Use |
|---|---|---|
| `.raised-frosted` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Default light card |
| `.raised-frosted:hover` | `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | Hovered light card |
| `.raised-frosted-active` | `0 2px 8px rgba(25,84,155,0.25)` | Active/selected state |
| `.raised-frosted-tab` | `0 1px 2px rgba(0,0,0,0.05)` | Pill inactive state |
| Modal on dark | `0 25px 50px rgba(0,0,0,0.50)` | White modal over dark backdrop |

- **Dark surfaces:** no shadows — depth via background colour shift only
- Never use coloured glows or neon shadows

---

## Motion

| Interaction | Duration | Easing | Property |
|---|---|---|---|
| Button / Pill hover | **`150ms`** | `ease` | all (background, color, border) |
| Nav item color | `150ms` | — | color |
| Card hover (interactive) | `150ms` | `ease-in-out` | all |
| `.animate-fade-up` | `400ms` | `ease-out` | opacity, transform (Y +8px → 0) |
| Active card press | — | — | `scale(0.98)` |
| Active CTA press (landing) | — | `200ms` | `scale(0.97)` |
| Chevron rotate (dropdown) | — | — | `rotate-180` on open |
| Modal entry | `300ms` | `ease-out` | opacity, transform |

**Note:** The standard transition is `150ms` across all interactive UI components — the old doc incorrectly stated `200ms`.

### `fade-up` keyframe
```css
@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Rules:**
- Reserve `backdrop-filter: blur()` for modal backdrops only — never on cards
- No shine, sweep, or parallax effects
- No looping animations on data elements

---

## Scrollbar

```css
::-webkit-scrollbar        { width: 6px; height: 6px; }
::-webkit-scrollbar-track  { background: var(--main-bg); }
::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.10); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.20); }
.scrollbar-hide            { scrollbar-width: none; }
```

---

## Do's & Don'ts

### Do ✅
- Use background-color shifts for depth on dark surfaces (not shadows)
- Keep all financial numbers in **Geist Pixel Square** or IBM Plex Mono
- Use `rounded-sm` (2px) on buttons, pills, cards, inputs — it is the system default radius
- Use `#19549b` (frost-400) as the primary interactive blue on light surfaces
- Use white modals over dark blurred backdrops for clear layer separation
- Show green (`#0fa87a` / `#18df74`) for positive values, red (`#ef4444`) for negative — always
- Use 0.08–0.10em letter-spacing on all uppercase section labels
- Keep a minimum `44px` touch target on mobile
- Use `150ms` for all hover/active transitions

### Don't ❌
- Don't use `border-radius: 0` — minimum is `rounded-sm` (2px)
- Don't use `rounded-full` (9999px) on buttons or pills — that's for status dots only
- Don't use neon glows, coloured shadows, or text shadows
- Don't use `backdrop-filter: blur()` on cards (Navbar and BottomBar use it — but not data cards)
- Don't use decorative corner accents or shine/sweep animations
- Don't use serif fonts anywhere
- Don't use gradients on cards or buttons (flat colours only, except banners and hero)
- Don't alternate table row background colours
- Don't override `--cta-color` in component code — it's user-controlled
- Don't use `#3B7DDD` as the primary blue on **light surfaces** — that's for dark-terminal context; use `#19549b` on light backgrounds

---

## Font Loading

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

```css
/* Self-hosted: place .woff2 in /public/fonts/ */
@font-face {
  font-family: 'Geist Pixel Square';
  src: url('/fonts/GeistPixel-Square.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

---

## Quick Reference for AI Agents

### Colour Tokens (Tailwind arbitrary values)

```
/* Light body */
bg-[#f1f5f9]          /* page background */
text-[#212121]        /* body text */
text-[#6a7282]        /* muted text */

/* Dark terminal */
bg-[#0F1521]          /* page bg */
bg-[#1A2332]          /* surface / card */
bg-[#151C28]          /* dense panel */
bg-[#0B0F18]          /* status bar */

/* Accents */
bg-[#3B7DDD] hover:bg-[#2B6BC4] text-white   /* primary CTA */
text-[#10B981]        /* success / positive */
text-[#18df74]        /* success bright (hero) */
text-[#ef4444]        /* danger / negative */
text-[#f59e0b]        /* warning */

/* Borders */
border-white/[0.08]   /* subtle */
border-white/[0.12]   /* light */
border-white/[0.20]   /* active */
```

### Font Tokens

```
/* Hero numbers */
font-['Geist_Pixel_Square','IBM_Plex_Mono',monospace]

/* Headings */
font-['Geist_Mono','IBM_Plex_Mono',monospace] font-bold

/* UI / Labels */
font-['IBM_Plex_Sans','Inter',sans-serif]

/* Section labels */
font-['IBM_Plex_Sans'] font-semibold text-[11px] uppercase tracking-[0.1em]
```

### Component Prompt Recipes

**Data table (dark):**
> "Table with `#1A2332` background. Headers: IBM Plex Sans 500, 12px, uppercase, `letter-spacing: 0.05em`, `#6B7280`. Numbers: Geist Pixel Square. Row border: `rgba(255,255,255,0.08)`. Row hover: `rgba(255,255,255,0.02)`. Green positive, red negative."

**Card (light surface):**
> "White card, `rgba(17,17,19,0.08)` border, `8px` radius, `16–24px` padding. Shadow: `0 1px 3px rgba(0,0,0,0.06)`. Hover: `0 4px 12px rgba(0,0,0,0.08)`."

**Modal:**
> "White modal, `12–16px` radius, `24px` padding, shadow `0 25px 50px rgba(0,0,0,0.5)`, over `rgba(0,0,0,0.6)` backdrop with `blur(4px)`. Title: `#111827`, IBM Plex Sans 600, 18px."

**Primary button:**
> "`#3B7DDD` background, white IBM Plex Sans 600 14px, `10px 20px` padding, `8px` radius. Hover `#2B6BC4`, `200ms ease`."

**Filter pills:**
> "Fully-rounded pills (`9999px`). Active: `#3B7DDD` bg, white text. Inactive: transparent, `rgba(255,255,255,0.12)` border, `#9CA3AF` text. Hover: brighten border and text."

**Trade layout:**
> "70/30 CSS Grid. Left: chart, `#151C28`. Right: order panel, `#1A2332`, `rgba(255,255,255,0.08)` left border. Stack vertically below `1024px`."

**Hero section:**
> "Full-bleed gradient: `#000003 → #000036 (37.9%) → #143f79 (81.7%) → #fcffff (285%)`. Geist Mono bold display heading. Fade-up animation on entry (`400ms ease-out`)."
