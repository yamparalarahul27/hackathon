# Cloud Tasks — Pending (for Rahul)

All local code is done and pushed to `stage`. The following tasks require
cloud dashboards, key signups, or system installs that you need to do manually.

---

## 1. Run Supabase Migration (required for Watchlist + Multi-Wallet)

Open the Supabase dashboard → SQL Editor → paste the contents of:

```
supabase/migrations/0001_init_state.sql
```

This creates three tables with RLS enabled:
- `watchlist` — token watchlist per wallet
- `user_wallets` — multi-wallet support (owner → linked wallets)
- `token_price_cache` — chart data cache (reduces external API calls)

**Project URL:** `https://yffjmvcherbenyxqfvkb.supabase.co`

After running: the "Watch" button on token pages (e.g. `/token/So11…`) will work
once a wallet is connected.

---

## 2. Get Birdeye API Key (recommended for token charts)

Sign up at https://docs.birdeye.so/ → free tier gives 50 req/min.

Add to `.env.local`:
```
BIRDEYE_API_KEY=your_key_here
```

Without it: charts fall back to Binance (for ~6 major tokens) and GeckoTerminal
(for long-tail SPL tokens). With it: any SPL token gets 1Y daily chart data.

---

## 3. Vercel Environment Variables

When deploying to Vercel, set these env vars:

| Variable | Where to get | Required? |
|----------|-------------|-----------|
| `HELIUS_RPC_URL` | Already have | Yes |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Same key | Yes |
| `QUICKNODE_RPC_URL` | Already have | Recommended |
| `QUICKNODE_WSS_URL` | Already have | Optional (for Streams) |
| `NEXT_PUBLIC_QUICKNODE_RPC` | Same as QUICKNODE_RPC_URL | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Already have | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already have | Yes |
| `BIRDEYE_API_KEY` | Step 2 above | Recommended |
| `NEXT_PUBLIC_APP_URL` | `https://defitriangle.xyz` | Yes |
| `ALLOWED_ORIGINS` | `https://defitriangle.xyz` | Yes |

---

## 4. DNS: defitriangle.xyz

Point `defitriangle.xyz` to your Vercel deployment:
- In Cloudflare (or your DNS): add a CNAME record → `cname.vercel-dns.com`
- In Vercel: add `defitriangle.xyz` as a custom domain

---

## 5. Install Solana CLI (optional, for local testing)

```bash
curl -fsSL https://www.solana.new/setup.sh | bash
```

This installs `solana`, `anchor`, and related tools system-wide.
Run this in your terminal (not from Claude — it modifies PATH).

---

## 6. Privacy Track (evaluate separately)

The MagicBlock + SNS privacy track:
https://superteam.fun/earn/listing/privacy-track-colosseum-hackathon-powered-by-magicblock-st-my-and-sns

Would require encrypted watchlists or shielded position views.
Evaluate only after Phases A-F are stable. Separate discussion needed.

---

## What Was Done (this session)

### Environment + Cleanup
- `.env.local` updated: Supabase URL + key, QuickNode HTTPS + WSS, APP_URL, Birdeye placeholder
- `.env.example` rewritten (dropped Dodo, RPC_FAST, added all new vars)
- `constants.ts`: dropped `deriverse.app` fallback, added QuickNode WSS, Birdeye, renamed exports
- `providers.tsx`: wallet metadata uses `APP_BASE_URL` (was hardcoded vercel URL)
- `KaminoVaultService.ts`: token logos via CDN (`getTokenIcon`) not local `/tokens/*.png`

### Kamino Lending Product (NEW)
- `/lend/kamino` route with live klend Main Market reserves
- `KaminoLendService` using `@kamino-finance/klend-sdk` v7 — loads market, iterates reserves,
  returns: symbol, mint, oracle price, supply APY, borrow APY, TVL, utilization, LTV
- `/api/kamino/lend` server route: 30s cache, 120 req/min rate limit
- `LendingMarketTable.tsx`: searchable, sortable, mobile cards at 320px
- Hero stats: total supplied / borrowed / reserve count
- Each reserve links to `/token/{mint}` page
- "Lend" tab added to Navbar

### Token Charts
- `TokenChartService.ts`: multi-source with strategy fallback chain:
  1. Binance Klines (best quality, ~6 majors, no key)
  2. Birdeye `/defi/history_price` (any SPL, needs key)
  3. GeckoTerminal OHLCV (free fallback, finds pool then fetches)
- `TokenChart.tsx` refactored: surfaces source label ("via binance"), shows errors
- Removed dead `fetchCoinGeckoChart` from `TokenDataService.ts`

### RPC Rotator
- `src/lib/rpc.ts`: `withRpcFallback()` tries Helius → QuickNode → public fallbacks
- Both `/api/kamino/overview` and `/api/kamino/lend` wired through it

### Supabase State Layer
- SQL migration: `supabase/migrations/0001_init_state.sql`
  - `watchlist`, `user_wallets`, `token_price_cache` with RLS + anon policies
- `SupabaseWatchlistService.ts`: list / add / remove / isWatched
- `SupabaseWalletService.ts`: list / link / unlink / setLabel
- `useWatchlist.ts` hook: add/remove/isWatched with optimistic updates
- `useLinkedWallets.ts` hook: link/unlink/label
- `TokenHeader.tsx`: "Watch" star button wired to useWatchlist
- `supabaseClient.ts`: proper nullable typing

### Deriverse Adapter
- `@deriverse/kit` v1.0.51 installed
- `DeriverseAdapter.ts`: program ID, `isDerivverseTx()`, mainnet status stub
- When Deriverse goes mainnet: instantiate Engine with mainnet RPC and decode fills

### Build
- `npm run build` passes (all 14 routes compiled, 2.6s)
- `npx tsc --noEmit` clean (zero errors)
