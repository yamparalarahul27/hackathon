# LANDING.md — DeFi Triangle Landing Page Structure

> Extracted from `src/app/(public)/page.tsx` and supporting files.
> Last audited against: `page.tsx`, `layout.tsx` (public group), `providers.tsx`, `logo.svg`, `og.svg`, `/api/og/route.tsx`
> All layout decisions, copy, and component hierarchy documented here for reproduction or redesign.

---

## Route

| Property | Value |
|---|---|
| File | `src/app/(public)/page.tsx` |
| Route | `/` (public group, no auth required) |
| Mode | `'use client'` |
| Layout wrapper | `src/app/(public)/layout.tsx` |
| Root layout | `src/app/layout.tsx` |
| Wallet context | `src/app/providers.tsx` (Jupiter `UnifiedWalletProvider`, lazy-loaded) |

---

## Layout Shell Stack

```
RootLayout (src/app/layout.tsx)
└── <html lang="en" className="h-full antialiased">
    └── <body className="min-h-full flex flex-col bg-[#f1f5f9] text-[#11274d]">
        └── Providers (wallet adapter, lazy-loaded)
            └── PublicLayout (src/app/(public)/layout.tsx)
                ├── <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
                │   └── {children}  ← page.tsx renders here
                └── <Agentation />  ← appended after children (analytics/feedback widget)
```

**Notes:**
- `Agentation` from the `agentation` package is rendered at the end of every public page — it is a floating analytics/feedback widget and should not affect layout
- The `bg-[#f1f5f9]` on `PublicLayout` is the fallback for any gap between gradient and edge; the hero gradient overrides it visually
- `Providers` lazy-imports `@jup-ag/wallet-adapter` — renders children immediately (no loading gate) until the wallet module resolves

## Page-Level Shell

```
<div className="min-h-screen flex flex-col">
  └── Hero (flex-1, full-bleed gradient)
```

The page is a single full-screen column. There is no separate footer — the hero fills the viewport.

---

## Section 1 — Hero (full-bleed)

**Container:**
```
<div className="flex-1 flex flex-col items-center justify-center px-6 py-20 gradient-frost-hero relative overflow-hidden">
```
- `gradient-frost-hero` — the `#000003 → #fcffff` vertical gradient defined in `globals.css`
- `relative overflow-hidden` — clips any decorative overflow
- Padding: `py-20` (80px) vertical, `px-6` (24px) horizontal

**Inner wrapper:**
```
<div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
```
- Max width: `672px` (2xl), centered
- `space-y-6` (24px) between all direct children
- `z-10` floats content above gradient

---

### 1.1 — Logo

```jsx
<div className="flex items-center justify-center gap-3 mb-4">
  <Image src="/logo.svg" alt="DeFi Triangle" width={40} height={40} />
</div>
```
- Logo: `/public/logo.svg`, 40×40px, centered
- Extra `mb-4` (16px) below before headline

---

### 1.2 — Headline (H1)

```jsx
<h1
  className="text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight font-light"
  style={{ fontFamily: "'Geist Pixel Square', 'Geist Mono', monospace" }}
>
  DeFi Triangle
</h1>
```

| Breakpoint | Font size |
|---|---|
| Mobile (`< 640px`) | `1.875rem` (30px) |
| Tablet (`≥ 640px`) | `3rem` (48px) |
| Desktop (`≥ 1024px`) | `3.75rem` (60px) |

- Font: Geist Pixel Square → Geist Mono → monospace
- Weight: `300` (light)
- Color: `#FFFFFF`
- Tracking: `tight` (`-0.025em`)
- Line-height: `tight` (`1.25`)

---

### 1.3 — Tagline

```jsx
<p className="font-ibm-plex-sans text-sm sm:text-base lg:text-lg text-white/75 max-w-lg mx-auto leading-relaxed">
  Your DeFi execution and exposure layer.
</p>
```
- Font: IBM Plex Sans
- Color: `rgba(255,255,255,0.75)`
- Size: 14px → 16px → 18px across breakpoints
- Max-width: `512px` (lg), centered
- Line-height: `relaxed` (1.625)

---

### 1.4 — Context Note

```jsx
<p className="font-ibm-plex-sans text-xs text-white/50">
  Building in public for Colosseum Frontier Hackathon
</p>
```
- IBM Plex Sans, 12px, `rgba(255,255,255,0.50)`
- ⚠️ **Appears twice** in the current source — once before the feature card (line 27) and once after it (line 48). This is a known duplication in the code; the second instance (after the card) is the intended position.

---

### 1.5 — Feature Card (Birdeye Pulse)

```jsx
<div className="rounded-sm border border-white/25 bg-white/10 backdrop-blur px-5 py-5 text-left max-w-xl mx-auto">
```

**Container styles:**
- Background: `rgba(255,255,255,0.10)` (frosted)
- Border: `1px solid rgba(255,255,255,0.25)`
- Border-radius: `2px` (`rounded-sm`)
- Padding: `20px` all sides
- `backdrop-blur` — glass effect
- Max-width: `576px` (xl), left-aligned text

**Card header row:**
```jsx
<div className="flex items-center gap-2 mb-2">
  <Radio size={14} className="text-[#7ee5c6]" />   {/* Lucide icon, teal */}
  <p className="text-[11px] tracking-[0.14em] text-white/85 font-ibm-plex-sans">
    BIRDEYE PULSE (NEW)
  </p>
</div>
```
- Icon: `Radio` (Lucide), 14px, color `#7ee5c6` (mint teal)
- Label: 11px, tracking `0.14em`, `rgba(255,255,255,0.85)`, uppercase

**Card body:**
```jsx
<p className="font-ibm-plex-sans text-sm text-white/80 mb-4">
  Discover movers. Validate token safety.
</p>
```
- 14px, `rgba(255,255,255,0.80)`

**CTA Button:**
```jsx
<Link
  href="/cockpit/market"
  className="inline-flex items-center gap-2 h-11 px-6 rounded-sm text-sm font-ibm-plex-sans font-medium bg-white text-[#11274d] hover:bg-white/90 active:scale-[0.97] transition-all duration-200"
>
  <LayoutDashboard size={14} />
  Open Market Pulse
</Link>
```

| Property | Value |
|---|---|
| Height | `44px` (h-11) |
| Padding | `0 24px` |
| Border-radius | `2px` (rounded-sm) |
| Background | `#FFFFFF` |
| Text color | `#11274d` (frost-500) |
| Font | IBM Plex Sans 500, 14px |
| Icon | `LayoutDashboard` (Lucide), 14px |
| Hover | `rgba(255,255,255,0.90)` |
| Active | `scale(0.97)` |
| Transition | `all 200ms` |

---

### 1.6 — Info Grid (2 columns)

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-xl mx-auto">
```
- Single column on mobile, 2 columns on `≥ 640px`
- Gap: `12px`
- Max-width: `576px`

**Cell structure (shared):**
```jsx
<div className="rounded-sm border border-white/20 bg-white/10 px-4 py-3 text-left">
  <p className="text-sm text-white font-ibm-plex-sans">…title…</p>
  <p className="text-xs text-white/70 font-ibm-plex-sans">…subtitle…</p>
  <a/Link className="inline-flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white mt-2 font-ibm-plex-sans">
    …label… <ArrowRight size={10} />
  </a>
</div>
```

| Cell | Title | Subtitle | Link |
|---|---|---|---|
| Left | Yamparala Rahul | Engineer & Builder | `@yamparalarahul1` → `https://x.com/yamparalarahul1` (external) |
| Right | Release Log | Weekly updates + shipped work | `View Release Log` → `/log` (internal) |

**Cell styles:**
- Border-radius: `2px`
- Border: `1px solid rgba(255,255,255,0.20)`
- Background: `rgba(255,255,255,0.10)`
- Padding: `12px 16px`
- Title: white, 14px
- Subtitle: `rgba(255,255,255,0.70)`, 12px
- Link: 11px, `rgba(255,255,255,0.70)` → white on hover, `ArrowRight` icon 10px

---

## Component & Icon Inventory

| Component | Source | Usage |
|---|---|---|
| `Image` | `next/image` | Logo (`/logo.svg`) |
| `Link` | `next/link` | CTA → `/cockpit/market`, Release Log → `/log` |
| `ArrowRight` | `lucide-react` | Info grid links |
| `LayoutDashboard` | `lucide-react` | CTA button icon |
| `Radio` | `lucide-react` | Feature card live indicator |

---

## Logo (`/public/logo.svg`)

- Dimensions: `400×400` viewBox, square
- Shape: rounded square (`rx=104` — ~26% radius, iOS-style squircle)
- Background: diagonal gradient `#467FFF → #5F7CF8 → #1847BB` (top-left to bottom-right)
- Content: stylised triangle / prism mark made of white stroke paths at `stroke-opacity: 0.5`
  - Solid white outline triangle shape (1.53px stroke)
  - Left fill: gradient `#F5FFFF → white/50 → #0083FF transparent`
  - Multiple construction lines at 0.46px stroke forming the internal detail grid
  - Three dashed diagonal lines extending beyond the triangle boundary
- Usage sizes: `40×40` (landing hero), `24×24` (navbar)

**App icon route (`src/app/icon.tsx`):**
- Output: `32×32` PNG, Edge runtime
- Background: `linear-gradient(135deg, #467FFF, #5F7CF8, #1847BB)` — matches logo colours
- Content: `△` character, white, 18px, weight 700, `border-radius: 8px`
- This is the browser tab favicon

---

## Wallet Provider (`src/app/providers.tsx`)

- Package: `@jup-ag/wallet-adapter` (Jupiter unified wallet)
- Lazy-loaded via dynamic `import()` inside `useEffect` — renders children immediately without a loading state
- Theme: `'dark'` — the wallet modal uses Jupiter's dark theme
- `autoConnect: false`
- `localStorageKey`: `yvault.wallet.{cluster}` — cluster defaults to `DEFAULT_WALLET_CLUSTER` from constants
- Wallet list: `[]` (empty — wallets auto-detected from browser extensions)
- `metadata.iconUrls`: `['/logo.svg']`

---

## Public Routes Summary

| Route | File | Notes |
|---|---|---|
| `/` | `(public)/page.tsx` | Landing page (documented above) |
| `/log` | `(public)/log/page.tsx` | Release log — linked from info grid |

---

## Metadata (`src/app/layout.tsx`)

```ts
export const metadata: Metadata = {
  title: "DeFi Triangle — Real-Time DeFi Intelligence",
  description: "Your DeFi execution and exposure app. Vaults, swaps, analytics, and privacy — powered by real on-chain data on Solana.",
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
  openGraph: {
    title: "DeFi Triangle",
    description: "Your DeFi execution and exposure app.",
    siteName: "DeFi Triangle",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "DeFi Triangle" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeFi Triangle",
    description: "Your DeFi execution and exposure app.",
    images: ["/api/og"],
  },
};
```

---

## OG Image

### Dynamic Route — `src/app/api/og/route.tsx`

Runtime: **Edge** (`export const runtime = 'edge'`).
Output: `1200 × 630` via `next/og` `ImageResponse`.

**Visual layers (top to bottom):**
1. **Background gradient** — `linear-gradient(180deg, #000003 0%, #000036 38%, #143f79 82%, #496d93 100%)`
2. **Title** — "DeFi Triangle", 72px, weight 300, white, `letter-spacing: -1px`
3. **Tagline** — "Your DeFi execution and exposure app.", 26px, `rgba(255,255,255,0.65)`
4. **Divider** — 120px wide, 1px, `rgba(255,255,255,0.15)`, `mt-40 mb-20`
5. **Badge** — "BUILT ON SOLANA", 14px, weight 500, `rgba(255,255,255,0.35)`, `letter-spacing: 3px`, uppercase

### Static Fallback — `public/og.svg`

Same visual as the dynamic route, built as an SVG with:
- `frost` gradient (vertical, same stops)
- `shimmer` overlay gradient (diagonal, `opacity 0.02–0.08`)
- Subtle grid lines: 2 horizontal + 2 vertical at `stroke-opacity: 0.04`
- Same text layers (system-ui font, SVG `<text>` elements)

```
Dimensions: 1200 × 630
```

### App Icon — `src/app/icon.tsx`

Runtime: **Edge**, output `32 × 32` PNG.

```
Background: linear-gradient(135deg, #467FFF, #5F7CF8, #1847BB)
Border-radius: 8px
Content: △ (white, 18px, weight 700)
```

---

## Full Visual Hierarchy Summary

```
Landing Page (/)
│
└── Hero (gradient-frost-hero, full viewport)
    │
    ├── Logo — /logo.svg, 40×40
    ├── H1 — "DeFi Triangle" (Geist Pixel Square, 30→60px, light)
    ├── Tagline — "Your DeFi execution and exposure layer." (IBM Plex Sans, white/75)
    ├── Context note — "Building in public…" (IBM Plex Sans, white/50, 12px)
    │
    ├── Feature Card (frosted glass, rounded-sm)
    │   ├── Header row — Radio icon (teal) + "BIRDEYE PULSE (NEW)" label
    │   ├── Body — "Discover movers. Validate token safety."
    │   └── CTA Button → /cockpit/market (white bg, frost-500 text)
    │
    ├── Context note — "Building in public…" (duplicate)
    │
    └── Info Grid (1 col → 2 col @ sm)
        ├── Left cell — Builder card (Yamparala Rahul → Twitter)
        └── Right cell — Release Log card (→ /log)
```

---

## Release Log Page (`/log`)

> Source: `src/app/(public)/log/page.tsx`
> Linked from info grid on landing page. Same `PublicLayout` wrapper (gradient capable, `Agentation` appended).

### Route

| Property | Value |
|---|---|
| File | `src/app/(public)/log/page.tsx` |
| Route | `/log` |
| Mode | `'use client'` |
| Data | Static — `LOG` array hardcoded in file, sorted newest-first |

### Data Shape (`DayEntry`)

```ts
interface DayEntry {
  date: string;   // ISO date e.g. "2026-04-20"
  added: string;  // Features shipped
  fixed: string;  // Bugs resolved
  learned: string; // Engineering insights
}
```

⚠️ The current `LOG` array has **duplicate entries for Apr 10–15** — each appears twice (likely a copy-paste issue). Dates Apr 11–15 appear at both indexes 10–14 and 79–108.

### Page Layout

```
<div className="flex-1 bg-[#f1f5f9] px-4 sm:px-6 lg:px-10 pt-6 pb-16 min-h-screen">
  ├── Hero Strip (full-bleed gradient)
  └── Timeline feed (max-w-[900px])
      └── Relative container with vertical rule
          └── space-y-6 list of day entries
```

### Hero Strip

```jsx
<div
  className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-6 border-b border-white/20"
  style={{
    marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
    paddingLeft: 'calc(50vw - 50%)',  paddingRight: 'calc(50vw - 50%)',
  }}
>
```
- Uses the same `gradient-frost-hero` as the landing hero
- **Full-bleed trick:** negative horizontal margins + matching padding break out of the parent's padding to span the full viewport width
- `border-b border-white/20` — subtle bottom edge at gradient end
- Inner content: `max-w-[1400px] mx-auto`, centered

**Title:**
```jsx
<h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-2">
  Project Log
</h1>
```
- Font: Geist Mono (`.font-satoshi`), weight 300
- Size: 24px → 36px (lg)

**Subtitle:**
```jsx
<p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70">
  Day-by-day evolution of DeFi Triangle...
</p>
```
- IBM Plex Sans, 12px → 14px, `rgba(255,255,255,0.70)`

### Timeline Component

**Outer container:**
```jsx
<div className="relative">
  <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-px bg-[#cbd5e1]" />  {/* vertical rule */}
  <div className="space-y-6">…entries…</div>
</div>
```
- Vertical rule: `1px solid #cbd5e1`, absolutely positioned at `left: 12px` (mobile) / `16px` (sm+)

**Each day entry:**
```jsx
<div className="relative pl-9 sm:pl-12">
```
- Left padding reserves space for the dot + rule

**Timeline dot:**
```jsx
<div className="absolute left-1.5 sm:left-2.5 top-4 w-3 h-3 rounded-full border-2 border-white {color}" />
```
- Size: `12×12px`, `rounded-full`
- Border: `2px solid white` (ring on top of rule line)
- First entry (index 0): `bg-[#19549b]` (active blue — frost-400)
- All others: `bg-[#cbd5e1]` (inactive grey — frost-300)

**Card:**
```jsx
<Card className="p-4 sm:p-5">
```
- Uses `<Card>` component — white bg, `rounded-sm`, `raised-frosted` shadow
- Padding: `16px` mobile, `20px` sm+

**Card header:**
```jsx
<time className="font-mono text-xs text-[#6a7282]">{formatDate(day.date)}</time>
<span className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-ibm-plex-sans">Day {n}</span>
```
- Date: `font-mono` 12px `#6a7282`, formatted as "Mon, Apr 20"
- Day number: 10px uppercase `#94a3b8`, counts down from total entries

### LogPoint Component

```jsx
function LogPoint({ tag, tagColor, text }) {
  return (
    <div className="flex gap-2.5">
      <span className="flex-shrink-0 inline-flex items-center h-5 px-1.5 rounded-sm text-[9px] uppercase tracking-wider font-ibm-plex-sans border {tagColor}">
        {tag}
      </span>
      <p className="text-xs text-[#11274d] font-ibm-plex-sans leading-relaxed">{text}</p>
    </div>
  );
}
```

**Tag colour system:**

| Tag | Background | Text | Border |
|---|---|---|---|
| Added | `#ecfdf5` | `#059669` | `#a7f3d0` |
| Fixed | `#fef3c7` | `#92400e` | `#fde68a` |
| Learned | `#dbeafe` | `#1e40af` | `#bfdbfe` |

- Tag badge: `rounded-sm`, 9px, uppercase, `tracking-wider`, height `20px` (h-5)
- Text: IBM Plex Sans 12px, `#11274d`, `leading-relaxed` (1.625)
- Three `LogPoint` items per card in `space-y-3` column

### `formatDate` helper

```ts
function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  // → "Mon, Apr 20"
}
```
- Appends `T00:00:00` to avoid timezone shift on ISO date strings

---

### Log Content — Full Entry Data

> Deduplicated. Source has duplicate entries for Apr 10–15 (copy-paste bug). Unique entries below, newest first.

---

#### Day 11 — Sun, Apr 20

**Added:**
Birdeye BIP Sprint 1 integration — token safety score on token detail pages, trending tokens rail, new listings radar with safety badges. Torque MCP event tracking (swap, deposit, wallet connect) + leaderboard component. Palm USD Freedom Swap card (pending Solana mint).

**Fixed:**
Resolved all 23 lint errors/warnings (0 remaining). Regenerated package-lock.json for clean npm ci. API middleware: origin check + rate limit + CORS on all /api/* routes.

**Learned:**
Birdeye token_security endpoint gives freeze authority, mint authority, top holder concentration — free safety layer complementing Jupiter Shield. Torque event ingestion requires custom events to be registered first via MCP before incentive queries work.

---

#### Day 10 — Sat, Apr 19

**Added:**
OG image (edge-rendered 1200×630 frost gradient) + social meta tags (openGraph + twitter card). Dynamic favicon via Next.js icon.tsx replacing default Vercel triangle. ALARM.md research doc — PagerDuty for DeFi concept.

**Fixed:**
Swap page Suspense boundary for useSearchParams (build was failing on Vercel prerender). Stale branch cleanup (4 deleted). Interested counter storing user rank in localStorage.

**Learned:**
Next.js 16 requires Suspense around useSearchParams for static prerendering — without it the build fails silently. SVG favicons work in modern browsers but some platforms (Slack, Discord) still need ICO or dynamic PNG.

---

#### Day 9 — Fri, Apr 18

**Added:**
Rebranded to DeFi Triangle (15 files, 0 old Y-Vault/DeFi Cockpit refs). TESTS.md with 22 sections covering best/worst cases for every integration. Consolidated 4 research docs into unified RESEARCH.md (1532 → 277 lines).

**Fixed:**
Umbra SDK: added deferMasterSeedSignature + explicit anonymous:false (from reference implementation). PublicMints propagation to ShieldedBalances. Recovery form completed with amount + destination inputs.

**Learned:**
Reference implementation (crypto-pay-umbra) showed deferMasterSeedSignature prevents unexpected wallet popup on client init. anonymous:true requires a ZK Prover not bundled in SDK v4 — must be explicitly false.

---

#### Day 8 — Thu, Apr 17

**Added:**
Public landing page with "Interested" counter (Supabase-backed) and "View Log" CTA. Route restructure: cockpit moves under /cockpit, landing at /.

**Fixed:**
Project Log page reversed to show latest day first. Unified all side-track research (Umbra, Torque, LI.FI) into single TRACKS.md.

**Learned:**
Build in public works best when the landing page is a funnel, not a gate — judges and testers still need direct access to the cockpit.

---

#### Day 7 — Wed, Apr 16

**Added:**
Jupiter Ultra upgrade — swap page now uses /ultra/v1 (order/execute/shield/search/holdings). Live SPL token search combobox. Wallet balances section via Ultra holdings. Side track research: Umbra Privacy, Torque MCP, LI.FI.

**Fixed:**
Purged all mocks: deleted MockJupiterSwapService, ServiceFactory, useServices (dead code), FALLBACK_PRICES, stale cache. Prices return null when unavailable — UI shows "Price unavailable" instead of fake numbers.

**Learned:**
Jupiter Ultra's /shield endpoint detects scam tokens before swap execution — free safety layer. Umbra SDK uses @solana/kit (not web3.js) — adapter needed. Torque MCP is an AI-agent tool, not a traditional SDK.

---

#### Day 6 — Tue, Apr 15

**Added:**
Rich NFT view — attributes, creators, royalty, ownership, cNFT compression, collection filter pills, detail modal with Magic Eden/Tensor/Solscan links. Wallet chip dropdown (copy/disconnect/switch-soon).

**Fixed:**
Migrated Kamino + Jupiter + Deriverse services to current official docs. HeliusNftService expanded from 8 to 20+ parsed DAS fields. Pagination fix: 50 → 1000 NFT cap.

**Learned:**
Helius DAS response already contains all the NFT richness (attributes, creators, royalties) — we were just throwing it away in the parser. No new API needed.

---

#### Day 5 — Mon, Apr 14

**Added:**
Sprint 1+2: DexScreener pairs, Sanctum LST Directory, NFT Holdings gallery, Trending tokens rail. Deriverse DEX devnet trade analytics with real on-chain parsing.

**Fixed:**
Vault APY/TVL/symbols now match kamino.finance exactly. RPC Fast + round-robin rotation across 3 providers eliminated single-point RPC failures.

**Learned:**
Pre-push hooks (lockfile sync + lint + typecheck + build + audit gate) catch issues before they reach CI — saves 10 min per push cycle.

---

#### Day 4 — Sun, Apr 13

**Added:**
Market page with live CoinGecko token list. Kamino Lending product integration. Multi-source token chart service (Binance → Birdeye → GeckoTerminal).

**Fixed:**
Removed fiat/Dodo deposit flow — enforced crypto-only deposits. Optimized build by removing 4 unused deps, externalizing Solana SDKs, lazy-loading Recharts.

**Learned:**
Agentation must be stripped from main on every merge — added a checklist in CLAUDE.md. Vault data split (general every 1hr, positions on wallet connect) cut RPC calls by 60%.

---

#### Day 3 — Sat, Apr 12

**Added:**
Pivoted to DeFi Triangle. Built route architecture (10 pages), protocol-agnostic DEX analytics, token detail with multi-source oracles, vault detail page, Project Overview dashboard.

**Fixed:**
Removed ALL hardcoded mock data — real Kamino SDK data or error banner, nothing fake. Liveline chart rendering fixed with explicit pixel height.

**Learned:**
Experience-first design wins hackathons — real data flowing through a stunning UI that people screenshot is more compelling than a half-working deposit pipeline.

---

#### Day 2 — Fri, Apr 11

**Added:**
Logo, live SOL price in bottom bar, clickable vault cards linking to detail view. Devnet vault strategy documented using SPL Token PDAs.

**Fixed:**
ETH token icon was wrong Wormhole-wrapped asset. Green text contrast on light background improved for accessibility.

**Learned:**
Kamino vault deposits are mainnet-only — can't demo without real money. This constraint drove the pivot to read-only cockpit.

---

#### Day 1 — Thu, Apr 10

**Added:**
Jupiter Swap wired into deposit flow — 5-step user story complete. Asgard UI design system (frost/hela/loki tokens) applied across all components.

**Fixed:**
Scalable token icons using Solana CDN replaced local images. Mobile 320px responsive pass on all cards and grids.

**Learned:**
No single CDN has all Solana token icons — need a multi-source fallback chain (known URLs → runtime cache → CDN → avatar).

