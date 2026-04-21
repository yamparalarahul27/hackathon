# Birdeye API — Reference & Status

**Our plan:** Starter (free tier) — key `8192…f449` (prefix-preview only, full value in Vercel env `BIRDEYE_API_KEY`).
**Upstream base:** `https://public-api.birdeye.so`
**Our proxy:** `/api/birdeye/*` → server-side forwards with `X-API-KEY` header, allow-list enforced, per-endpoint caching.
**Health check:** `GET /api/birdeye/health` — returns configured state + a live ping.
**Last audited:** 2026-04-21.

This doc supersedes the earlier BIRDEYE_STATUS.md. If anything here drifts from Birdeye's own docs, trust the docs and update this file.

---

## TL;DR

- Our Starter plan unlocks **substantially more** than we originally thought. In particular, `/defi/v3/token/list` replaces anything we'd have needed `token_trending` or `tokenlist` for, and it ships with filter/sort over 40+ fields.
- Smart Money, wallet PnL, top traders, top holders, search, and OHLCV are all on Starter.
- Only **batched** variants (`*/multiple`, `*/scroll`) and Base-chain exit-liquidity are gated to Business/Enterprise.
- One **empirical conflict** to resolve in the Birdeye dashboard: `/defi/token_trending` says "Starter" in the docs but 403s with our key. Likely a domain/IP allow-list on the key, not a plan issue.
- One **proxy bug** caught while reading docs: `v2/tokens/new_listing` should be `defi/v2/tokens/new_listing` (missing `/defi/` prefix).

---

## Endpoints available on Starter (the catalog)

Grouped by capability. For each, the path is relative to `https://public-api.birdeye.so` (i.e. `/defi/v3/token/list` means hit `/api/birdeye/defi/v3/token/list` through our proxy).

### 1. Market list & discovery

| Path | Notes |
|---|---|
| **`/defi/v3/token/list`** ⭐ | Max 100 per call. **Sort by any of** 40+ fields (`liquidity`, `market_cap`, `fdv`, `recent_listing_time`, `last_trade_unix_time`, `holder`, `volume_{1m,5m,30m,1h,2h,4h,8h,24h,7d,30d}_usd`, `volume_*_change_percent`, `price_change_*_percent`, `trade_*_count`). **Filter by** min/max on all of the same. **Returns per row:** address, logo, name, symbol, decimals, extensions (socials), mcap, fdv, total/circulating supply, liquidity, last_trade_unix_time, price + price change at 10 timeframes, volume USD + change % at 10 frames, trade count at 10 frames, buy/sell counts + USD volumes, unique_wallet_24h, holder, recent_listing_time. |
| `/defi/tokenlist` (V1) | Legacy, max 50, sort by `mc` / `v24hUSD` / `v24hChangePercent` / `liquidity`. **Prefer V3.** |
| `/defi/v2/tokens/new_listing` | Recently listed tokens (max 20). Optional `meme_platform_enabled=true` for pump.fun etc. on Solana. **Our proxy currently has the wrong path — see "Known issues" below.** |
| `/defi/v2/markets` | All pools trading a specific token (base/quote/source/liquidity/volume_24h per pool). |
| `/defi/token_trending` | Trending (up to 20). **Empirically 403s for us — see "Known issues".** |
| `/defi/v3/search` | Full-text search across tokens AND pools. `target=all|token|market`, `search_mode=exact|fuzzy`, `search_by=symbol|name|address|combination`, filter by `verify_token`, filter by `markets` source (Raydium, Meteora, Orca, Pump.fun, etc.). |

### 2. Price & volume

| Path | Notes |
|---|---|
| `/defi/price` | USD price, one mint. |
| `/defi/multi_price` | USD price, batched up to ~100 mints. One-call price grid. |
| `/defi/price_volume/single` | Price + volumeUSD + both change % for one token at `type=1h|2h|4h|8h|24h`. |
| `/defi/v3/price/stats/single` | Per-token price stats per timeframe: `price`, `price_change_percent`, `high`, `low`. Timeframes: `1m,5m,30m,1h,2h,4h,8h,24h,2d,3d,7d`. Multi-timeframe in one call. |
| `/defi/history_price` | Line-chart points `[{unixTime, value}]` for a token/pair, frame `1m…1M`. |
| `/defi/historical_price_unix` | Value + priceChange24h at a specific unix timestamp (Solana only). |

### 3. OHLCV (candlesticks)

| Path | Notes |
|---|---|
| `/defi/v3/ohlcv/pair` | Candlesticks by pair contract. Max 5000. Adds `1s`, `15s`, `30s` intervals (retained 2w / 3mo respectively). |
| `/defi/ohlcv/base_quote` | Candlesticks by base + quote token (no pool address needed — aggregates across all pools). Max 1000. |

### 4. Per-token deep data

| Path | Notes |
|---|---|
| `/defi/token_overview` | Richest single-call stats: mcap, fdv, liquidity, holder, total/circulating supply, numberMarkets, extensions (website, twitter, etc.), **and** priceChange, uniqueWallet, trade/buy/sell counts, volume USD + buy/sell splits for 10 timeframes. |
| `/defi/v3/token/market-data` | Lean: price, liquidity, supply, mcap, fdv, holder. |
| `/defi/v3/token/meta-data/single` | Just metadata: address, symbol, name, decimals, logo, socials. |
| `/defi/v3/token/trade-data/single` | Trade data depth: buy/sell USD split, unique wallets, trade counts per timeframe (1m–24h). Use for a spotlight card. |
| `/defi/v3/all-time/trades/single` | Lifetime totals: total_volume, total_volume_usd, buy/sell split, buy/sell counts. Frame `1m…alltime`. |
| `/defi/token_creation_info` | Creation tx, slot, unix time, owner, decimals. |
| `/defi/token_security` | Mint/freeze authority, top-10 holder %, mutability, Token-2022, non-transferable. **Powers our Safety Scanner.** |

### 5. Holders & holder-tag insights

| Path | Notes |
|---|---|
| `/defi/v3/token/holder` | Top 100 holders of a token: owner, token_account, ui_amount. |
| `/holder/v1/distribution` | Distribution stats (mode=`top` or `percent` range), with optional wallet list. *Accessibility tab not listed in docs — probe first.* |
| `/token/v1/holder-positions` | Per-wallet hold/buy/sell/pnl + tag labels (`bundler`, `sniper`, `insider`, `dev`). *Probe first. Bundler tag accurate only for tokens created after 2026-03-01.* |
| `/token/v1/holder-profile` | Aggregated holder profile + breakdown by tag (buy/sell volumes, avg buy price, pnl per tag). *Probe first.* |

### 6. Traders & PnL

| Path | Notes |
|---|---|
| `/defi/v2/tokens/top_traders` | Top wallets trading a token. Timeframes 30m → 90d. Sort by `volume`, `trade`, `total_pnl`, `realized_pnl`, `unrealized_pnl`, `volume_usd`. (Some sort fields Solana only.) |
| `/trader/gainers-losers` | Global top gainers/losers by PnL (`today` / `yesterday` / `1W`). Returns wallet + PnL + trade count + volume. |

### 7. Smart money ⭐

| Path | Notes |
|---|---|
| `/smart-money/v1/token/list` | Tokens the smart wallets are net-buying, segmented by trader style (`risk_averse` / `risk_balancers` / `trenchers`), with `net_flow`, `smart_traders_no`, buy/sell USD, `price_change_percent`. Solana only, interval `1d|7d|30d`. |

### 8. Wallet (connected user)

| Path | Notes |
|---|---|
| `/wallet/v2/current-net-worth` | Wallet portfolio: total USD + per-token balance/price/value. Optional `filter_value` and low-liquidity flag. Solana only. |
| `/wallet/v2/net-worth-details` | Net worth at a specific unix time (for time-travel). |
| `/wallet/v2/pnl/summary` | Wallet PnL: total_buy/sell/win/loss, win_rate, realized/unrealized USD, avg profit per trade. Duration `24h|7d|30d|90d|all`. Solana + Base. |
| `/wallet/v2/pnl/multiple` | Per-wallet PnL for up to 50 wallets on a specific token. |
| `/v1/wallet/tx_list` | Beta. Wallet tx history with per-tx balanceChange + tokenTransfers. Solana only. |

### 9. Blockchain utilities

| Path | Notes |
|---|---|
| `/defi/networks` | List of supported chains. |
| `/defi/v3/txs/latest-block` | Latest block number per chain. |

---

## NOT available to us on Starter

All batched/scroll/multiple variants of the above, plus Base-chain-only exit-liquidity.

| Path | Tier | What we lose |
|---|---|---|
| `/defi/v3/token/market-data/multiple` | Business/Enterprise | Batched market data (up to 20) |
| `/defi/v3/token/trade-data/multiple` | Business/Enterprise | Batched trade data (up to 20) |
| `/defi/v3/pair/overview/multiple` | Business/Enterprise | Batched pair overviews |
| `/defi/v3/token/meta-data/multiple` | Business/Enterprise | Batched metadata |
| `/defi/v3/token/list/scroll` | Business/Enterprise | Scroll up to 5000 tokens |
| `/defi/v3/all-time/trades/multiple` | Business/Enterprise | Batched all-time trades |
| `/defi/v3/token/exit-liquidity{/,/multiple}` | Premium/Business (Base chain only anyway) | Exit liquidity signals |

**Impact:** we can't batch rich per-token data; instead use `/defi/multi_price` for batched prices + loop `/defi/v3/token/market-data` (or just use `/defi/v3/token/list` which bundles everything pre-sorted).

---

## Uncertain / probe-first

Docs don't show an Accessibility tab for the three holder-tag endpoints. Assume gated until confirmed:

- `/token/v1/holder-positions`
- `/token/v1/holder-profile`
- `/holder/v1/distribution`

To probe: add them temporarily to our proxy `ALLOWED_PATHS` and hit each once with a known mint, checking for 200 vs 403.

---

## Known issues

### 1. Proxy URL bug — `new_listing`

Our proxy `src/app/api/birdeye/[...path]/route.ts` has `v2/tokens/new_listing` in `ALLOWED_PATHS`. That forwards to `https://public-api.birdeye.so/v2/tokens/new_listing` — but the actual endpoint is `/defi/v2/tokens/new_listing`. We've been 404/403ing every call. Fix: change the entry to `defi/v2/tokens/new_listing`.

### 2. `/defi/token_trending` 403 despite Starter access

Health check response:
```json
{
  "configured": true,
  "keyPreview": "8192…f449",
  "upstream": { "status": 403, "bodyPreview": "{\"status\":false,\"message\":\"Access Denied\"}" }
}
```

Docs (this reference) say Starter has access. Most likely cause: the key has a **domain/IP allow-list** set in the Birdeye dashboard. Open birdeye.so → API Keys → this key → restrictions. Either remove the restriction or add `defitriangle.xyz`, `stagev.vercel.app`, and Vercel's outbound IPs.

If dashboard shows no restrictions, it's a plan-definition drift — contact Birdeye support, or ignore this endpoint and rely on `/defi/v3/token/list` for trending (it's a superset).

---

## Feature menu this catalog unlocks

Organized by where each would live.

### Landing page (public, no wallet required)

1. **Safety Scanner hero** — paste any mint, get `/defi/token_security` scored. Already built.
2. **Market table with tabs** — one call to `/defi/v3/token/list`, different `sort_by` per tab: Trending (volume_24h_usd), Gainers (price_change_24h_percent desc), Losers (asc), New (recent_listing_time), Most-Held (holder).
3. **Market Pulse strip** — aggregate of top-50 from the same call (% green, avg 24h change, total 24h volume).
4. **Featured Majors rail** — 6-10 curated mints, one `/defi/multi_price` call + cached `/defi/token_security` per mint for safety badges.
5. **Smart Money rail** ⭐ — "Smart wallets are buying" using `/smart-money/v1/token/list`. Solana-native differentiator.
6. **Gainers/Losers leaderboard** — `/trader/gainers-losers` (traders, not tokens).
7. **Token of the Day spotlight** — `/defi/v3/token/trade-data/single` + `/defi/ohlcv/base_quote` for sparkline + `/defi/token_security`.
8. **Global search bar** — `/defi/v3/search` with both token + pool results.

### Token detail page `/cockpit/token/:mint`

- Overview (`/defi/token_overview` or `/defi/v3/token/market-data`).
- Price stats multi-timeframe (`/defi/v3/price/stats/single`).
- Chart (`/defi/ohlcv/base_quote` or `/defi/v3/ohlcv/pair` or `/defi/history_price`).
- Safety (`/defi/token_security`).
- Creation info (`/defi/token_creation_info`).
- Top pools trading this token (`/defi/v2/markets`).
- Top holders (`/defi/v3/token/holder`).
- Top traders (`/defi/v2/tokens/top_traders`).
- Lifetime volume (`/defi/v3/all-time/trades/single`).

### Connected-wallet story

- Portfolio + net worth (`/wallet/v2/current-net-worth`).
- PnL headline (`/wallet/v2/pnl/summary`) — "You're up $X this week."
- Historical net worth trend (`/wallet/v2/net-worth-details` at several unix points).
- Recent activity (`/v1/wallet/tx_list`).

---

## Implementation notes

### Proxy pattern (already in place)

`src/app/api/birdeye/[...path]/route.ts`:
- Allow-list of paths (keeps the proxy from being an open relay).
- Attaches `X-API-KEY` + `x-chain: solana` server-side.
- Per-endpoint TTL cache in-memory.
- Returns structured error envelope on upstream non-OK: `{ upstreamStatus, upstreamBodyPreview, path, hint }`.
- Serves stale on upstream fetch failure if cache exists.

When adding a new endpoint to `ALLOWED_PATHS`, also add a TTL to `CACHE_TTL_MS`. Suggested TTLs:
- Security / creation info: 10 min (~static)
- Overview / price / top-list: 60 s
- Market/pool / chart history: 60 s
- Trending / new listings / smart money: 60 s

### Curated mint list

Instead of paginating the whole universe, keep a `CURATED_MINTS` array of 10–20 blue-chip Solana mints (SOL, USDC, ETH, JUP, JTO, BONK, WIF, PYTH, RAY, ORCA, and whatever else is relevant). Most landing widgets can run off a single `/defi/multi_price` call + cached per-mint data. Rate-limit pressure stays low.

### Diagnostic endpoint

`GET /api/birdeye/health` pings `/defi/token_trending?limit=1` and reports:
- `configured: boolean` — is `BIRDEYE_API_KEY` set?
- `keyPreview: "abcd…wxyz"` — prefix+suffix only (never the full value)
- `upstream: { status, ok, bodyPreview }` — live Birdeye response

Use this whenever 403s reappear, before jumping to conclusions about middleware or routing.

---

## Change log

- **2026-04-21** — Initial consolidated reference. Replaces `BIRDEYE_STATUS.md`. Catalog is current through the API specs the user pasted on 2026-04-20 / 04-21.
