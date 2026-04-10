# DexPilot — Hackathon Project Documentation

> Fiat → Kamino LP Vaults → Yield Analytics Dashboard
> **Deadline:** May 12, 2026 | **Base repo:** Deriverse + ConceptDJ

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [Problem Statement](#problem-statement)
3. [Target Users](#target-users)
4. [Track Submissions](#track-submissions)
5. [Research Findings](#research-findings)
6. [Competitive Analysis](#competitive-analysis)
7. [Architecture](#architecture)
8. [Built Components](#built-components)
9. [Integration Details](#integration-details)
10. [Environment Setup](#environment-setup)
11. [Remaining Work](#remaining-work)
12. [Demo Flow](#demo-flow)

---

## Product Vision

**DexPilot** is a one-stop platform where users can:
1. Pay with fiat (UPI, cards via Dodo Payments) → receive USDC on Solana
2. Deposit into Kamino LP vaults with one click
3. Track yield performance, impermanent loss, and P&L with professional analytics
4. Withdraw to fiat when ready

It bridges TradFi users into DeFi yield — "Pay with UPI, earn DeFi yield."

---

## Problem Statement

### For retail users in India and emerging markets
Getting money into Solana DeFi is painful. You need to: buy crypto on an exchange → transfer to a wallet → learn about LP vaults → manually deposit → then have NO way to track if you're making money. Each step loses people.

### For existing LPs
Kamino manages ~$1B+ TVL across concentrated liquidity vaults. But LPs have no unified dashboard to see: Am I actually profiting? How much IL am I eating? Which vault performs best? They check DefiLlama for TVL, Birdeye for prices, spreadsheets for P&L — fragmented and manual.

### Validated Evidence
- 6 hackathon teams tried LP analytics/management → none won prizes (execution gap, not demand gap)
- Solana DEX volume: $1.5T in 2025, DeFi TVL: $6.26B
- Savings & yield farming = 36.5% of all DeFi application revenue (largest segment)
- No product on The Grid is branded as "DEX analytics" (0 keyword results)
- Kamino is dominant automated LP protocol on Solana — no analytics competitor exists

---

## Target Users

**Primary:** Indian crypto-curious retail user who has fiat but finds DeFi intimidating. "I want to earn better than my savings account but I don't understand DeFi."

**Secondary:** Existing Solana LP who uses Kamino but needs better analytics to track performance across vaults.

---

## Track Submissions

All share the same deadline: **May 12, 2026**

| # | Track | Prize Pool | What We Show | Key Requirement | Priority |
|---|-------|-----------|-------------|-----------------|----------|
| 1 | **Dodo Payments (India)** | $5K / $3K / $2K cash | Fiat on-ramp → Solana DeFi | Meaningful Dodo Payments integration, India-only | HIGH |
| 2 | **Eitherway — Kamino** | $2K-$5K cash | Deep Kamino SDK vault analytics | Live mainnet dApp, deep partner integration, 30-day uptime | HIGH |
| 3 | **Umbra Privacy** | $5K / $3K / $2K cash | Private vault deposits, shielded balances | Integrate Umbra SDK for confidential transfers | HIGH |
| 4 | **100xDevs Frontier** | $500-$2.5K cash (10 winners!) | Overall product quality | Build on Solana, submit to Colosseum + Superteam | MEDIUM |
| 5 | **Jupiter DX** | 1K / 750 / 500 jupUSD + 3x250 DX reports | Jupiter API combos + DX feedback report | Use Jupiter Developer Platform APIs + write DX Report | MEDIUM |
| 6 | **Eitherway — QuickNode** | $2K cash | QuickNode Streams for real-time data | Data-heavy app using QuickNode infra | LOW |
| 7 | **Dune Analytics Data** | $6K Dune Enterprise plan | On-chain data analytics via Dune SIM | Integrate Dune SIM API (wallet balances, tx history, metadata) | LOW |
| 8 | **RPC Fast** | $1K-$5K infra credits | RPC integration | Use RPC Fast endpoint | LOW |
| 9 | **KiraPay** | $500 USDC + $8.5K rebates/waivers | Cross-chain payment checkout | Integrate KiraPay SDK | SKIPPED — mostly non-cash, overlaps Dodo |

**Total potential: $19.5K - $32.5K cash + 3K jupUSD + $6K Dune credits + RPC credits**

### Track-Specific Links
1. https://superteam.fun/earn/listing/payments-track-or-superteam-india-x-dodo-payments
2. https://superteam.fun/earn/listing/build-a-live-dapp-with-solflare-kamino-dflow-or-quicknode-with-eitherway-app
3. https://superteam.fun/earn/listing/umbra-side-track
4. https://superteam.fun/earn/listing/100xdevs-frontier-hackathon-track
5. https://superteam.fun/earn/listing/not-your-regular-bounty
6. https://superteam.fun/earn/listing/dune-analytics-x-superteam-earn-or-frontier-data-sidetrack
7. https://superteam.fun/earn/listing/dollar10000-in-rpc-infrastructure-credits-for-colosseum-frontier-hackathon
8. https://superteam.fun/earn/listing/build-with-kirapay (SKIPPED)

### Judging Criteria by Track
**Eitherway (Kamino/QuickNode):** Real-world utility 30%, Product quality 30%, Integration depth 25%, Adoption potential 15%
**Umbra:** SDK integration depth (essential, not superficial), Innovation, Technical quality, Commercial viability, UX, Completeness
**Jupiter DX:** DX Report quality 35%, AI Stack feedback 25%, Technical execution 25%, Creativity 15%
**Dune:** Requirements fulfillment 50%, Quality of SIM use 20%, Creativity/UX 20%, Innovation 10%
**100xDevs:** Technical quality, innovation, real-world problem-solving, UX, polish

---

## Research Findings

### What Wins in DeFi vs Infrastructure

**DeFi track winners built NEW PROTOCOLS, not dashboards:**
| Project | Hackathon | Prize | What |
|---------|-----------|-------|------|
| Kormos | Cypherpunk | 2nd DeFi ($20K) + Accelerator | Fractional reserve yield aggregator |
| Encifher | Breakout | 3rd DeFi ($15K) | Privacy layer for DeFi |
| Exponent | Renaissance | 5th DeFi ($5K) | Yield derivatives (ex-Kamino team) |

**Analytics/data products win in INFRASTRUCTURE:**
| Project | Hackathon | Prize | What |
|---------|-----------|-------|------|
| Tokamai | Radar | 2nd Infra ($20K) + Accelerator | Program monitoring |
| Ionic | Cypherpunk | 3rd Infra ($15K) | Data aggregation layer |
| Pine Analytics | Cypherpunk | 4th Infra ($10K) | Queryable on-chain analytics |
| CONYR | Breakout | 5th Infra ($5K) | AI intelligence engine |

**Our strategy:** We're NOT competing in DeFi track. We compete in Eitherway (integration quality), 100xDevs (polish), and Dodo Payments (India fiat-to-DeFi). These reward execution + utility, not novel primitives.

### Why 6 Previous LP Teams Lost

| Project | Hackathon | Why They Lost |
|---------|-----------|---------------|
| Brokk Pools (team of 6) | Cypherpunk | Too broad, no novel primitive, 0 updates |
| Hypebiscus Garden | Cypherpunk | Telegram bot + Meteora only, single-DEX |
| Maiker.fun | Breakout | Competing with Kamino (already exists) |
| LP Bot | Renaissance | Telegram bot + Orca only, single-DEX |
| Asteora | Radar | Meteora DLMM only, single-DEX |
| Toby - LP AI Agent | Breakout | MVP stage, 2 updates but not enough |

**Our differentiation vs these 6:**
1. Multi-protocol via Kamino (aggregates Raydium/Orca/Meteora internally)
2. Fiat on-ramp — nobody combined payments + DeFi yield
3. Real SDK integration with Kamino kliquidity-sdk
4. 60+ polished UI components from ConceptDJ heritage
5. India-specific payments = smaller competition pool
6. Live mainnet with 30-day uptime requirement (forces real product)

### Existing Landscape (The Grid)

**Yield Aggregators on Solana (25 products):**
- Meteora Dynamic Vaults (score: 29), HawkFi (11), Voltr (10), LP Agent (4), Maiker Vaults (1, early access)
- Plus CEX earn products (Bybit, KuCoin, Bitget) — not competitors

**Data Terminals on Solana:**
- Birdeye (score: 38) — token screener, not LP analytics
- Nansen (score: 21) — wallet labels + AI trading, not LP-focused
- Grid Phase 2 keyword "DEX analytics" → **0 results** — no product branded this way

**Grid Saturation:** 168 products / 145 roots across `onchain_data_api` + `block_explorer` + `dex_aggregator`

### Partner Research

**Kamino Finance:**
- Solana's largest automated liquidity protocol
- Products: CL vaults, K-Lend (borrow/lend), Multiply (leverage), yield strategies
- SDKs: `@kamino-finance/kliquidity-sdk` (TypeScript) — strategies, positions, share prices, deposits/withdrawals
- `@kamino-finance/klend-sdk` — lending market data
- REST API for historical data
- Curators: Gauntlet, Allez Labs, Steakhouse, Rockaway, Sentora

**Dodo Payments:**
- Fiat billing platform — Merchant of Record for global payments
- 40+ payment methods, 220+ countries, 80+ currencies
- Node.js SDK: `dodopayments` — checkout sessions, payments, webhooks
- Test mode + live mode environments
- NOT crypto-native — the bridge from fiat to DeFi is our innovation

**QuickNode:**
- Solana RPC + Streams (real-time filtered data push)
- Functions (serverless), Webhooks
- Free hackathon credits available

---

## Architecture

### Repo Structure
- **Deriverse** = functional backbone (Helius RPC, Jupiter wallet, Supabase, real Solana data)
- **ConceptDJ** = UI component library (60+ widgets, TradingView charts, AI behavioral tools, IL calculator)
- Both merged: ConceptDJ components ported into Deriverse

### Data Flow
```
User (Browser)
  ├── Fiat Payment Path:
  │   └── DepositFlow → POST /api/checkout → DodoPaymentService
  │       → Dodo Payments checkout → webhook → USDC on Solana → Kamino vault
  │
  ├── Crypto Deposit Path:
  │   └── DepositFlow → Jupiter Wallet Adapter → Kamino SDK → vault deposit tx
  │
  └── Analytics Path:
      └── useKaminoVaults hook
          ├── Wallet connected? → KaminoVaultService (real SDK on mainnet)
          │   ├── getUserPositions() via kliquidity-sdk
          │   ├── getStrategyShareData() for prices
          │   └── TokenPriceService (Jupiter Price API v2)
          └── No wallet? → Mock data (8 vaults, 5 positions)
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Charts | Recharts, Visx (d3), TradingView Lightweight Charts |
| Wallet | Jupiter Wallet Adapter (@jup-ag/wallet-adapter) |
| Blockchain | @solana/web3.js, @solana/kit (via Kamino SDK) |
| DeFi | @kamino-finance/kliquidity-sdk, @kamino-finance/klend-sdk |
| Payments | dodopayments SDK |
| Prices | Jupiter Price API v2 |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

---

## Built Components

### Services (5 files)
| Service | File | Status |
|---------|------|--------|
| Kamino Vault Service | `src/services/KaminoVaultService.ts` | Done — real SDK, getVaults(), getUserPositions() |
| Token Price Service | `src/services/TokenPriceService.ts` | Done — Jupiter API, 30s cache, fallback prices |
| Dodo Payment Service | `src/services/DodoPaymentService.ts` | Done — checkout sessions, status, payments |
| Helius Service | `src/services/HeliusService.ts` | Existing — transaction history |
| Deriverse Trade Service | `src/services/DeriverseTradeService.ts` | Existing — trade parsing |

### API Routes (1 file)
| Route | File | Method |
|-------|------|--------|
| `/api/checkout` | `src/app/api/checkout/route.ts` | POST — creates Dodo checkout session |

### Hooks (2 files)
| Hook | File | Status |
|------|------|--------|
| useKaminoVaults | `src/lib/hooks/useKaminoVaults.ts` | Done — real SDK + mock fallback |
| useWalletConnection | `src/lib/hooks/useWalletConnection.ts` | Existing — Jupiter adapter |

### Types & Data (3 files)
| File | Contents |
|------|----------|
| `src/lib/lp-types.ts` | KaminoVaultInfo, KaminoVaultPosition, LPPortfolioSummary, DodoPaymentSession, VaultRiskMetrics, etc. |
| `src/lib/mockKaminoData.ts` | 8 vaults, 5 positions, perf history, yield breakdown, risk metrics |
| `src/lib/constants.ts` | Updated with Kamino program IDs, Jupiter API, Dodo config, QuickNode, RPC Fast |

### UI Components (8 new + 1 ported)
| Component | File | Description |
|-----------|------|-------------|
| VaultDashboard | `src/components/features/VaultDashboard.tsx` | Main LP tab — summary stats, position grid, IL calculator, detail drawer |
| PositionCard | `src/components/features/PositionCard.tsx` | Individual vault position — pair, APY, PnL, yield, IL, pulse indicator |
| LPSummaryStats | `src/components/features/LPSummaryStats.tsx` | 4 stat cards — Portfolio Value, Total Yield, Net P&L, Avg APY |
| VaultExplorer | `src/components/features/VaultExplorer.tsx` | Browse all vaults — search, sort, filter, deposit buttons |
| VaultDetailDrawer | `src/components/features/VaultDetailDrawer.tsx` | Slide-out detail — metrics, performance chart, risk radar, IL calc |
| YieldAnalytics | `src/components/features/YieldAnalytics.tsx` | Yield vs IL bar chart, distribution pie chart, breakdown table |
| DepositFlow | `src/components/features/DepositFlow.tsx` | 4-step wizard — select vault → enter amount → Dodo payment → confirmation |
| ImpermanentLossCalculator | `src/components/features/ImpermanentLossCalculator.tsx` | Ported from ConceptDJ + enhanced with position prop |

### Navigation
**File:** `src/components/layout/TabNavigation.tsx`

Main tabs: **Vaults** | **Explore** | **Yield** | **Deposit**
Dropdown: Trades | Journal | Wallet(s) | About | Help | Roadmap

Default landing tab: **Vaults**

---

## Integration Details

### Kamino SDK Integration
- Uses `@kamino-finance/kliquidity-sdk` v-latest
- `Kamino` class initialized with `createSolanaRpc()` from `@solana/kit`
- Type assertion needed due to `@solana/kit` version mismatch between our deps and Kamino's bundled deps
- Key methods used:
  - `getStrategyShareDataForStrategies({ strategyCreationStatus: 'LIVE' })` — all vaults
  - `getUserPositions(walletAddress, { strategyCreationStatus: 'LIVE' })` — user positions
  - `getStrategyShareData(strategyAddress)` — share price per strategy
  - `getStrategyByAddress(address)` — strategy details (token mints, etc.)
- Dynamic import in hook to avoid SSR issues

### Dodo Payments Integration
- Uses `dodopayments` SDK v2.26.0
- Server-side only (API route)
- Checkout flow: `checkoutSessions.create()` → returns `checkout_url`
- Metadata passes vault address, wallet address, fiat amount for post-payment processing
- Test mode by default, live mode via env var
- Client calls `POST /api/checkout`, gets checkout URL, opens in new tab

### Jupiter Price API
- `GET https://api.jup.ag/price/v2?ids=<comma-separated-mints>`
- 30-second in-memory cache to avoid re-fetching during renders
- Hardcoded fallback prices for 7 major tokens (SOL, USDC, USDT, ETH, JUP, JTO, BONK)

---

## Environment Setup

### Required Environment Variables

Create `.env.local` in the Deriverse root:

```bash
# === Dodo Payments (for fiat checkout) ===
DODO_PAYMENTS_API_KEY=dodo_sk_test_xxx        # Get from dodopayments.com dashboard
DODO_VAULT_PRODUCT_ID=prod_xxx                # Create a product in Dodo dashboard
DODO_PAYMENTS_ENV=test_mode                   # test_mode or live_mode

# === Helius RPC (for Solana data) ===
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# === Supabase (for persistence) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx

# === Optional: QuickNode / RPC Fast ===
NEXT_PUBLIC_QUICKNODE_RPC=https://xxx.solana-mainnet.quiknode.pro/xxx
NEXT_PUBLIC_RPC_FAST_URL=https://xxx
```

### What to get from where
| Variable | Where |
|----------|-------|
| `DODO_PAYMENTS_API_KEY` | [dodopayments.com](https://dodopayments.com) → Dashboard → API Keys |
| `DODO_VAULT_PRODUCT_ID` | Dodo Dashboard → Create Product (one-time, name: "Vault Deposit") |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | [helius.dev](https://helius.dev) → Free plan → Mainnet API key |
| Supabase credentials | [supabase.com](https://supabase.com) → Project settings → API |

---

## Build Status Per Track

| # | Track | Backend | Frontend | Ready to Submit? | What's Missing |
|---|-------|---------|----------|-----------------|----------------|
| 1 | **Dodo Payments** | **BUILT** — `DodoPaymentService.ts` + `/api/checkout` route | **BUILT** — `DepositFlow.tsx` with fiat checkout | **NO** — needs API key + product ID | Dodo API key, Dodo product, test run |
| 2 | **Eitherway/Kamino** | **BUILT** — `KaminoVaultService.ts` with real kliquidity-sdk | **BUILT** — Dashboard, Explorer, Drawer, YieldAnalytics | **NO** — needs mainnet RPC to test real data | Helius mainnet key |
| 3 | **Umbra Privacy** | **NOT BUILT** | **NOT BUILT** | **NO** | Full Umbra SDK integration needed |
| 4 | **100xDevs Frontier** | **BUILT** — same core product | **BUILT** — same core product | **ALMOST** — needs deploy + polish | Branding, deploy, demo video |
| 5 | **Jupiter DX** | **PARTIAL** — `TokenPriceService.ts` uses Jupiter Price API | **NOT BUILT** — no Swap API in UI | **NO** | Add Jupiter Swap API + write DX Report |
| 6 | **Eitherway/QuickNode** | **NOT BUILT** — placeholder constant only | **NOT BUILT** | **NO** | QuickNode Streams integration |
| 7 | **Dune Analytics** | **NOT BUILT** — placeholder only | **NOT BUILT** | **NO** | Dune SIM API integration |
| 8 | **RPC Fast** | **NOT BUILT** — placeholder constant only | N/A | **NO** | Swap RPC URL (trivial) |

### What's Actually Built & Working (with mock data)
- `src/services/KaminoVaultService.ts` — Real Kamino SDK, `getVaults()`, `getUserPositions()`
- `src/services/DodoPaymentService.ts` — Real Dodo SDK, `createCheckoutSession()`, `getSessionStatus()`
- `src/services/TokenPriceService.ts` — Jupiter Price API v2, 30s cache, fallback prices
- `src/app/api/checkout/route.ts` — `POST /api/checkout` API route
- `src/lib/hooks/useKaminoVaults.ts` — Real SDK call on wallet connect, mock fallback
- `src/components/features/VaultDashboard.tsx` — Summary stats + position grid + IL calc + drawer
- `src/components/features/VaultExplorer.tsx` — Search, sort, filter across all vaults
- `src/components/features/VaultDetailDrawer.tsx` — Perf chart, risk radar, IL analysis
- `src/components/features/YieldAnalytics.tsx` — Bar/pie charts, breakdown table
- `src/components/features/DepositFlow.tsx` — 4-step wizard, calls real Dodo API
- `src/components/features/ImpermanentLossCalculator.tsx` — Ported from ConceptDJ
- `src/components/features/LPSummaryStats.tsx` — 4 portfolio stat cards
- `src/components/features/PositionCard.tsx` — Vault position card with PnL/yield/IL
- Navigation updated with 6 tabs (Vaults, Explore, Yield, Deposit + dropdown)

### What's Just a Placeholder (constant or config, no real code)
- QuickNode RPC URL in `constants.ts` — no Streams integration
- RPC Fast URL in `constants.ts` — no usage
- Umbra — not even a placeholder, zero code
- Dune SIM — not even a placeholder, zero code
- Jupiter Swap API — only Price API used, no swap/trigger/recurring APIs

---

## Remaining Work

### Execution Plan (ordered by priority)

**P0 — Unlock core submission (need API keys from Rahul)**
| Task | Effort | Unlocks Tracks |
|------|--------|---------------|
| Get Dodo Payments API key + create product | Rahul | Dodo ($10K) |
| Get Helius mainnet API key | Rahul | Kamino ($5K), 100xDevs ($10K) |
| Confirm Supabase credentials still work | Rahul | All tracks |
| Wire API keys into `.env.local`, test end-to-end | 1 hour | All tracks |

**P1 — Polish & deploy (submittable after this)**
| Task | Effort | Unlocks Tracks |
|------|--------|---------------|
| Update branding to "DexPilot" (layout.tsx, logo, favicon) | 1 hour | All tracks |
| Test mock data flow + wallet connect + real Kamino data | 1 hour | Kamino, 100xDevs |
| Test Dodo checkout flow end-to-end | 1 hour | Dodo |
| Deploy to Vercel | 30 min | All tracks |
| Record 2-3 minute demo video | 1 hour | All tracks |
| Submit to tracks 1, 2, 4 | 30 min | Dodo, Kamino, 100xDevs |

**P2 — High-value add-ons (best ROI for extra effort)**
| Task | Effort | Unlocks Tracks | Cash Value |
|------|--------|---------------|-----------|
| Umbra SDK — private vault deposits, shielded balances, viewing keys | 4-6 hours | Umbra ($10K) | $2K-$5K |
| Jupiter Swap API + DX Report | 2-3 hours | Jupiter DX (3K jupUSD) | 250-1K jupUSD |
| RPC Fast — swap one URL in constants | 30 min | RPC Fast (credits) | Credits |

**P3 — If time permits**
| Task | Effort | Unlocks Tracks | Value |
|------|--------|---------------|-------|
| Dune SIM API — replace some data calls | 3-4 hours | Dune ($6K credits) | $6K API credits |
| QuickNode Streams — real-time vault push | 4-5 hours | QuickNode ($2K) | $2K cash |
| Webhook for Dodo payment → auto vault deposit | 2 hours | Improves Dodo submission | UX improvement |
| Kamino APY enrichment via separate API | 2 hours | Improves Kamino submission | Data quality |
| Port more ConceptDJ components | 2-3 hours | Visual polish | Demo impact |
| Register domain (dexpilot.xyz) | 15 min | Branding | ~$1 |

### Summary: What Rahul Needs to Provide
```
1. DODO_PAYMENTS_API_KEY     → dodopayments.com → Dashboard → API Keys
2. DODO_VAULT_PRODUCT_ID     → Dodo Dashboard → Create Product (one-time, "Vault Deposit")
3. NEXT_PUBLIC_HELIUS_RPC_URL → helius.dev → Free plan → Mainnet API key
4. Supabase status           → Confirm existing creds still work
```

---

## User Story: "Fiat to Private DeFi Yield"

This is the unified user story that naturally covers ALL tracks with ONE product flow.

### The Persona: Priya — Software Engineer, Mumbai

She has ₹50,000 in savings earning 4% in her bank. She's heard DeFi yields are better but:
- Doesn't know how to buy crypto
- Worried about privacy (doesn't want on-chain activity traced to her)
- Has no idea which vault/pool to pick
- Wants to track if she's actually making money

### Her Journey Through DexPilot

```
Step 1: DISCOVER          → Browse vaults, compare yields
Step 2: PAY WITH FIAT     → ₹50,000 via UPI
Step 3: SWAP TO RIGHT TOKEN → Auto-swap USDC to vault token pair
Step 4: PRIVATE DEPOSIT   → Shield deposit so it's not publicly visible
Step 5: EARN YIELD        → Kamino vault auto-manages her LP position
Step 6: TRACK PERFORMANCE → Real-time analytics, IL tracking, P&L
Step 7: WITHDRAW TO FIAT  → Back to her bank when ready
```

### How Each Track Maps to This Story

| Step | User Action | Technology | Track |
|------|------------|------------|-------|
| **1. Discover** | Browses vault explorer, sees APY/TVL/risk for each vault | **Kamino SDK** fetches vault data, **Dune SIM** enriches with historical metrics, **QuickNode Streams** pushes real-time updates | Kamino, Dune, QuickNode |
| **2. Pay** | Clicks "Deposit ₹50,000", pays via UPI | **Dodo Payments** checkout → receives USDC on Solana | Dodo Payments |
| **3. Swap** | USDC auto-swaps to SOL+USDC (for the vault pair) | **Jupiter Swap API** finds best route across DEXes | Jupiter DX |
| **4. Private Deposit** | Toggles "Private Mode" → deposit is shielded | **Umbra SDK** confidential transfer into vault, viewing key saved for tax compliance | Umbra |
| **5. Earn** | Vault auto-manages concentrated liquidity position | **Kamino** vault strategy handles rebalancing | Kamino |
| **6. Track** | Dashboard shows: position value, yield earned, IL, risk score | All data fetched via **RPC Fast** endpoint, rendered in polished UI | RPC Fast, 100xDevs |
| **7. Withdraw** | Clicks withdraw → USDC → fiat back to bank | Reverse flow: Kamino → Jupiter swap → Dodo off-ramp | Dodo, Jupiter |

### Feature Breakdown by Track

**Track 1: Dodo Payments ($10K) — "Pay & Earn"**
- User enters INR/USD amount
- Dodo Payments opens UPI/card checkout
- On success: USDC arrives in user's wallet
- Auto-routes to selected Kamino vault
- Reverse: Withdraw from vault → off-ramp to fiat

**Track 2: Kamino ($5K) — "Vault Intelligence"**
- Vault Explorer: browse all Kamino vaults with APY, TVL, risk, strategy type
- My Positions: track all vault positions with P&L, yield, IL
- Vault Detail: performance chart, risk radar, fee breakdown
- One-click deposit/withdraw via Kamino SDK transactions

**Track 3: Umbra ($10K) — "Private DeFi"**
- "Shield My Deposit" toggle in deposit flow
- Uses Umbra confidential transfers → deposit amount hidden on-chain
- Private balance view — only user sees their vault position value
- Viewing key export for tax compliance ("Prove to tax authority without making public")
- User story angle: "My employer/colleagues can't see my DeFi activity"

**Track 4: Jupiter DX (3K jupUSD) — "Smart Routing"**
- User has USDC but vault needs SOL-USDC pair → Jupiter Swap API converts
- Best route across Raydium/Orca/Meteora for minimum slippage
- Show swap route visualization ("Your USDC → Jupiter → SOL + USDC → Kamino vault")
- DX Report: Written feedback about Jupiter Developer Platform experience (35% of judging!)

**Track 5: 100xDevs ($10K) — "Polish & Quality"**
- 60+ UI components from ConceptDJ heritage
- Glassmorphism design, animations, responsive
- Mock data fallback for demo
- Real mainnet data when wallet connected
- This track rewards execution quality across everything

**Track 6: RPC Fast (credits) — "Infrastructure"**
- Use RPC Fast endpoint for all Solana RPC calls
- Show latency metrics in UI ("Data refreshed in 45ms via RPC Fast")
- 30 min to swap URL

**Track 7: Dune SIM ($6K credits) — "Rich Analytics"**
- Wallet balance history via Dune SIM
- Transaction history enrichment
- Token metadata for vault displays
- Historical on-chain activity feed

**Track 8: QuickNode ($2K) — "Real-Time"**
- QuickNode Streams for real-time vault TVL/APY updates
- No polling — data pushes to dashboard as it changes
- "Live" indicator on dashboard showing real-time feed

### Build Effort to Complete User Story

| What to Build | Effort | Tracks It Serves | Status |
|---------------|--------|-----------------|--------|
| Vault Explorer + Dashboard | **BUILT** | Kamino, 100xDevs, Dune | Done |
| Fiat checkout flow | **BUILT** | Dodo | Done (needs API key) |
| Jupiter Swap before deposit | 2-3 hrs | Jupiter DX | Not started |
| Umbra private deposit toggle | 4-6 hrs | Umbra | Not started |
| RPC Fast endpoint swap | 30 min | RPC Fast | Not started |
| Dune SIM data enrichment | 3-4 hrs | Dune | Not started |
| QuickNode Streams | 4-5 hrs | QuickNode | Not started |
| DX Report (written doc) | 1 hr | Jupiter DX | Not started |

### Unified Demo Script (3 minutes)

> "Meet Priya. She has ₹50,000 and wants better yield than her bank."
>
> 1. She opens DexPilot → **Vault Explorer** shows Kamino vaults sorted by APY *(Kamino + Dune)*
> 2. She picks SOL-USDC vault at 28% APY → clicks **"Deposit with Fiat"**
> 3. Enters ₹50,000 → **Dodo Payments** opens UPI checkout → she pays *(Dodo)*
> 4. She toggles **"Private Deposit"** → her deposit is shielded *(Umbra)*
> 5. USDC auto-swaps to SOL+USDC via **Jupiter** → deposited into Kamino vault *(Jupiter)*
> 6. She sees her **Dashboard** — real-time position value, yield accruing, risk radar *(QuickNode, RPC Fast, 100xDevs)*
> 7. 30 days later, she's earned ₹1,200 in yield — visible only to her *(Umbra viewing key)*
>
> "Fiat in. Private yield. Full analytics. One app."

### Eligibility Confirmation

All tracks are global except Dodo Payments (India-only). Rahul is based in India → eligible for ALL tracks.

| Track | Global/Regional | Eligible? |
|-------|-----------------|-----------|
| 100xDevs Frontier | Global | YES |
| Eitherway/Kamino | Global | YES |
| Dodo Payments | India-only | YES |
| Umbra Privacy | Global | YES |
| Jupiter DX | Global | YES |
| Eitherway/QuickNode | Global | YES |
| Dune Analytics | Global | YES |
| RPC Fast | Global | YES |

---

## Demo Flow

For hackathon judges (3-minute walkthrough):

1. **Landing** → "DexPilot — Earn DeFi yield from your fiat" → Connect Wallet button
2. **Vaults tab** → Shows 5 vault positions with APY, yield earned, IL percentages, live pulse indicators
3. **Click a position** → Detail drawer opens: performance chart, risk radar, IL calculator with real numbers
4. **Explore tab** → Browse all Kamino vaults sorted by APY/TVL, search by token
5. **Yield tab** → Bar chart (yield vs IL per vault), pie chart (yield distribution), breakdown table
6. **Deposit tab** → Select vault → Enter ₹5000 → See estimated USDC + yearly yield → "Pay with Dodo Payments" → Checkout opens
7. **Back to Vaults** → New position appears (demo mode)

**Mock data fallback:** If judges don't have wallets/Kamino positions, the app shows realistic demo data with a yellow "Demo Mode" banner. All features fully functional on mock data.

---

## Colosseum Copilot Setup

For continued research during the hackathon:

```bash
export COLOSSEUM_COPILOT_API_BASE="https://copilot.colosseum.com/api/v1"
export COLOSSEUM_COPILOT_PAT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImNvbG9zc2V1bV9jb3BpbG90OnJlYWQiLCJ1c2VybmFtZSI6InlhbXBhcmFsYSIsImRpc3BsYXlOYW1lIjoiWWFtcGFyYWxhIiwicm9sZXMiOltdLCJ0b2tlblZlcnNpb24iOjEsImlhdCI6MTc3NTA1OTkzOCwiYXVkIjoiY29sb3NzZXVtX2NvcGlsb3QiLCJzdWIiOiI4ODgyMyIsImV4cCI6MTc4MjgzNTkzOCwianRpIjoiZjQwNzRlMzQtYjM3NC00MjhkLTgyYmEtZTcyN2Y4ZTIzNDlhIn0.9pE1YLlqeeAe68obBzvxuffH8MAkCdjQEcjX6okEcsU"
```

Copilot skill installed at: `.agents/skills/colosseum-copilot/`
