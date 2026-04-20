@AGENTS.md

# DeFi Triangle — Claude Code Project Instructions

## STRICT RULES (apply to every session, every agent)

### 1. Scalability-First Rule
**ALWAYS choose the scalable solution over the quick fix.**
Before implementing ANY solution, ask: "What happens when there are 100x more of these?"

- Token icons → Use CDN URL from mint address (NOT local image files)
- Data → Use APIs/SDKs (NOT hardcoded lists that break for new entries)
- UI → Handle empty/missing/unknown states with graceful fallbacks
- Config → Use environment variables (NOT hardcoded values)
- If a local/static approach is tempting, flag it and suggest the scalable alternative

### 2. Mobile 320px Test Rule
**Every UI change MUST work at 320px viewport width.**
After ANY UI change, verify it won't break on small screens.

- Use responsive Tailwind: base for mobile, `sm:` for 640px, `lg:` for 1024px
- Financial numbers (`.data-lg`, `.data-md`): MUST scale down on mobile
- Grids: `grid-cols-1` on mobile, expand on larger screens
- Tables: hide non-critical columns with `hidden md:table-cell`
- No fixed large font sizes without mobile breakpoints
- Cards stack vertically on mobile, no horizontal overflow

### 3. Design System Compliance
Follow `DESIGN.md` strictly. Do NOT deviate from the Asgard-based design system.

### 4. Code Quality
- No file exceeds 700 lines of code
- Split large components into sub-components
- Use React.memo on expensive renders
- Dynamic imports for heavy/rare modules
- Zero `any` types in new code

### 5. Branching & Agentation Rule
**All new work lands on `stage` first, then promotes to `main` after verification.**

- **Development flow:** feature branch → `stage` → `main`
- Never push directly to `main`. Always verify on `stage` first.
- Merging to `main` is a fast-forward/merge AFTER changes are confirmed working on `stage`.

**Agentation is stage-and-local only — NEVER on `main`:**
- `agentation` package must NOT be in `main`'s `package.json` or `layout.tsx`
- `stage` branch keeps Agentation (for agent-assisted dev overlay)
- Local dev branches may use Agentation freely
- When merging stage → main, strip the `Agentation` import + `<Agentation />` element + the `agentation` dep before committing to main
- Quick checklist before pushing to main:
  - [ ] `package.json` has no `"agentation"` entry
  - [ ] `src/app/(cockpit)/layout.tsx` has no `Agentation` import or render
  - [ ] `package-lock.json` has no `agentation` references

---

## Project Overview

**DeFi Triangle** is a real-time Solana DeFi intelligence platform for the Colosseum Frontier Hackathon (deadline: May 12, 2026).

**Pivot (April 2026):** Original vision was fiat→vault deposit pipeline, but Kamino deposits are mainnet-only and can't be demoed without real money. Pivoted to **experience-first DeFi cockpit** — real on-chain data, beautiful visualization, zero mocks.

**Core philosophy:** Design Engineering > Problem Solving. The product wins on **experience** — real data flowing through a stunning UI that people screenshot and share.

### What's Real (Not Mocked)

| Data Source | What It Provides | Cost |
|------------|-----------------|------|
| Helius RPC | Parse on-chain txs, wallet history | Free (100K/day) |
| Deriverse SDK | Dex trade analytics, PnL, fills | Free (proven, won hackathon) |
| Kamino SDK | Read vault positions, APY, TVL | Free (mainnet reads) |
| Jupiter Price API | Token prices, swap quotes | Free (no key) |
| Binance API | Crypto prices, candlesticks, 24h tickers | Free (public, no key) |
| CoinGecko API | Token prices, market data, historical charts | Free (30 req/min, no key) |
| Pyth Network | Real-time on-chain oracle prices (350+ assets) | Free (on-chain public good) |
| Liveline | Chart components (from ConceptDJ) | Free (own lib) |
| ConceptDJ | 60+ UI widgets, experimental UIs | Free (own lib) |

### Heritage Projects

- **Deriverse** (separate branch) — Trade journal + analytics, won previous hackathon
- **ConceptDJ** (separate branch) — 60+ UI widget library, experimental designs

---

**Design system:** Asgard UI — see `DESIGN.md` for full spec.
- Light base (`#f1f5f9`), white cards, dark text — light-first theme
- Dark gradient hero section for contrast
- Compact 48px navbar, light bottom bar
- `rounded-sm` (4px) everywhere
- Satoshi for headings, Geist Pixel Grid for numbers, IBM Plex Sans for body

**Full project docs:** See `RESEARCH.md` for track details, research, build status, execution plan.

## Token Icons

Use Solana token-list CDN — scalable for any token:
```
https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/{MINT_ADDRESS}/logo.png
```
Helper: `src/lib/tokenIcons.ts` — `getTokenIcon(mint)` with fallback

## Free Data APIs (No Keys Required)

```bash
# Jupiter Price API
curl "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112"

# CoinGecko (30 req/min free)
curl "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true"
curl "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=30"

# Binance (public, no key)
curl "https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT"
curl "https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=1h&limit=100"

# Pyth Hermes (real-time oracle)
curl "https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"
```

## Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts, Framer Motion
Kamino kliquidity-sdk, @solana/web3.js, @jup-ag/wallet-adapter
Jupiter Price API, CoinGecko API, Binance API, Pyth Network
dodopayments (fiat on-ramp), Supabase (persistence)

## Key Files

```
src/app/providers.tsx                 — Jupiter Wallet Adapter (wraps app)
src/app/page.tsx                      — Main app
src/services/KaminoVaultService.ts    — Real Kamino SDK (read vaults/positions)
src/services/JupiterSwapService.ts    — Jupiter Swap API (quotes + execution)
src/services/TokenPriceService.ts     — Jupiter Price API
src/services/DodoPaymentService.ts    — Dodo Payments checkout
src/services/KaminoDepositService.ts  — Kamino deposit (mock for demo)
src/services/ServiceFactory.ts        — Service initialization (real/mock)
src/lib/hooks/useWalletConnection.ts  — Wallet state hook
src/lib/hooks/useKaminoVaults.ts      — Vault data + mock fallback
src/lib/hooks/useServices.ts          — Service layer hook
src/lib/tokenIcons.ts                 — Token icon CDN helper
src/lib/lp-types.ts                   — Type definitions
src/lib/supabaseClient.ts             — Supabase client
src/components/features/              — VaultDashboard, VaultExplorer, DepositFlow, YieldAnalytics
src/components/ui/                    — Card, Button, Pill, StatusDot, TokenIcon
DESIGN.md                             — Asgard UI design system spec
DEXPILOT.md                           — Full project documentation
```

## Environment Variables

See `.env.example` for full list. Critical ones:
```bash
NEXT_PUBLIC_SUPABASE_URL=        # Free tier at supabase.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Free tier
DODO_PAYMENTS_API_KEY=           # Free test mode at dodopayments.com
NEXT_PUBLIC_HELIUS_RPC_URL=      # Free tier at helius.dev
ALLOWED_ORIGINS=                 # Production domain for CSRF
```
