# DeFi Cockpit — Feature Ideation Playbook

> **Status:** Draft · Not yet implemented
> **Branch:** `docs/dexscreener-ideation` (off `stage`)
> **Goal:** A single reference for candidate features sourced from external APIs + on-chain data, ranked by impact vs. effort.

This doc covers 4 candidate feature tracks:
1. 🟢 **DexScreener** — pair-level DEX analytics
2. 🟢 **Sanctum** — LST universe + validator data
3. 🟢 **Messari** — fundamental asset analytics
4. 🟡 **Covalent** — multi-chain wallet view
5. 🟡 **icy.tools** — NFT portfolio tracking

---

## TRACK 1 — DexScreener

### What it is

A **free, no-signup real-time DEX analytics aggregator** — the de facto "Bloomberg terminal" for on-chain DEX trading. Makes pair-level truth visible: tokens trade as pairs on specific pools, each pool has different liquidity/volume/price.

### How it works (technical)

| Layer | What they do |
|-------|-------------|
| Indexing | Own Solana/EVM nodes; parses raw tx logs directly |
| Aggregation | Normalizes swap events from hundreds of DEX ABIs (Raydium, Orca, Meteora, Uniswap…) |
| Distribution | Sub-100ms latency, 5M+ req/day |
| Revenue | Paid "Token Boosts" — projects pay for visibility on trending feed |

### Free API (no key, ~300 req/min)

Base: `https://api.dexscreener.com`

| Endpoint | Purpose |
|----------|---------|
| `GET /latest/dex/search?q={query}` | Search pairs by name/symbol/address |
| `GET /latest/dex/pairs/{chain}/{pairAddress}` | Specific pair details |
| `GET /latest/dex/tokens/{addresses}` | Pairs for token mint(s), up to 30 comma-separated |
| `GET /token-boosts/top/v1` | Top boosted tokens (good proxy for trending) |
| `GET /orders/v1/{chain}/{tokenAddress}` | Paid orders check |

**Limitations:** No historical OHLCV candles on free tier; no WebSocket streaming; no direct "trending" endpoint.

### Feature proposals

| ID | Feature | Impact | Effort |
|----|---------|--------|--------|
| A | **Pair Explorer** (`/pairs` route) — dense table of DEX pairs, filter by chain/token | HIGH | MEDIUM |
| B | **"Trending on Solana" rail** on Market page — fetch `/token-boosts/top/v1` | MED | LOW |
| C | **Pair details drill-down** — click pair → `/pair/{chain}/{address}` | HIGH | MEDIUM |
| D | **Vault → underlying pairs** — "Where this pair trades" section on vault detail | HIGH | LOW ⭐ |
| E | **New Pool Radar** — poll `/token-profiles/latest/v1` for new Solana pools | LOW | MEDIUM |
| F | **Watchlist** — star tokens/pairs, persist via Supabase | MED | HIGH |

### Unique Cockpit angle

**Feature D is the killer one** — nobody else combines Kamino vault view + "where the vault's pair actually trades." DexScreener is generic; we become a vertical cockpit tied to the vaults you own.

### Effort estimate

Phase 1 (service + hook): 2-3h · Phase 2 (Pair Explorer page): 3-4h · Phase 3 (navbar integration): 30min · Phase 4 (pair detail): 3-4h.

**Total for A+B+D: ~1-1.5 days.**

---

## TRACK 2 — Sanctum (LST Universe)

### What it is

Solana's **universal LST infrastructure** by Igneous Labs. Unlike Marinade (mSOL) or Jito (jitoSOL), Sanctum is protocol-agnostic — anyone can create an LST. Three core products:

- **Infinity Pool** — zero-slippage LST ↔ LST swaps; `INF` = LST-of-LSTs
- **Router** — cheapest path LST ↔ SOL (integrated into Jupiter)
- **Reserve** — instant SOL liquidity skipping the 2-day unstake cooldown

**Coverage:** 245 LSTs in canonical registry; 1,361+ on-platform including validator LSTs.

### ⚠️ Critical: HTTP API is private

```
Base URL:   https://sanctum-api.ironforge.network
Reality:    403 Forbidden with x-deny-reason: host_not_allowed
```

Origin-gated to `sanctum.so` domains. No public dev signup. **Don't waste time working around it.**

### ✅ The viable path — on-chain + TOML

| Source | What you get | Cost |
|--------|-------------|------|
| `@glamsystems/sanctum-lst-list` (npm) | Parses official TOML → every LST's mint, pool address, validators, logo | Free |
| Helius RPC | Pool account data: `totalLamports`, `poolTokenSupply` → SOL value + TVL | Free |
| Compute ourselves | APY = epoch-over-epoch SOL value change (5-epoch avg, drop outliers) | Free |

### Feature proposals

| ID | Feature | Impact | Effort |
|----|---------|--------|--------|
| S1 | **LST Directory** (`/lst` route) — sortable table: name, symbol, TVL, APY, price | HIGH | MEDIUM |
| S2 | **LST detail page** — validators, epoch APY history, who holds it | MED | MEDIUM |
| S3 | **Vault → LST drill-down** — for vaults using LSTs (jitoSOL/SOL etc), show the LST's validators + APY alongside vault APY | HIGH | LOW ⭐ |
| S4 | **INF Composition** viz — breakdown of what LSTs are in the Infinity pool | MED | MEDIUM |
| S5 | **LST Compare tool** — pick 2-3 LSTs, stack APY/TVL/validator diversity charts | LOW | MEDIUM |

### Unique Cockpit angle

**Feature S3** is unique — Kamino vaults frequently LP into jitoSOL/SOL, mSOL/SOL, etc. Showing the **stacked yield** (LST staking APY + Kamino LP APY) as one number that traders understand would be **the** compelling differentiator.

### Effort estimate

**Weekend scope (S1 + S3): 2-3 days**
- Parse TOML → LST catalog
- Batch-fetch pool accounts via Helius → TVL/price per LST
- Directory page + sortable table
- Cross-link from vault detail pages

**Week scope (add S2 + S4):** +2-3 days for APY history storage in Supabase + INF composition viz.

---

## TRACK 3 — Messari (Fundamental Analytics)

### What it is

Crypto data provider specializing in **fundamental analytics** — not just price, but structured asset profiles: network health, developer activity, ROI metrics, tokenomics, asset categories.

### API — free tier, no key required

Base: `https://data.messari.io/api`

| Endpoint | Purpose |
|----------|---------|
| `GET /v2/assets` | List all assets with metadata |
| `GET /v1/assets/{slug}/metrics` | Full metric suite: supply, ROI, volatility, dev activity |
| `GET /v1/assets/{slug}/profile` | Project profile: tokenomics, team, governance |
| `GET /v1/news/{slug}` | Recent news per asset |

**Rate limit:** ~20 req/min free (generous for our use case — we cache).

### Feature proposals

| ID | Feature | Impact | Effort |
|----|---------|--------|--------|
| M1 | **Asset Profile enrichment** — add Messari data to existing `/token/[mint]` page: network health, dev activity, category, "investor thesis" | HIGH | LOW ⭐ |
| M2 | **"Fundamental Score" rail** on Market page — blend Messari's metrics into a simple score (e.g. dev activity + TVL + supply concentration) | MED | MEDIUM |
| M3 | **News feed per token** — latest 3 articles on token detail page | MED | LOW |
| M4 | **Asset discovery** — filter tokens by category (L1, DEX, Memecoin, LST, etc.) on Market page | MED | LOW |

### Unique Cockpit angle

Messari data is **public and well-known** but **underused in DeFi cockpit UIs** — CoinGecko shows prices, Birdeye shows holders, but nobody puts Messari's network-health data next to vault APY. Makes Cockpit feel like a research tool, not just a trading terminal.

### Effort estimate

M1 alone: **half a day** (service + enrich existing token page).
M1 + M3 + M4 bundle: **1 day**.

---

## TRACK 4 — Covalent (Multi-Chain Wallet View)

### What it is

Multi-chain data aggregator — single unified API for 100+ chains including Solana, Ethereum, Base, Arbitrum, BSC. Returns balances, NFTs, transaction history, DeFi positions — all in one normalized schema.

### API — requires key (free tier generous)

- Free tier: 100K credits/month, ~4 req/sec
- Sign up: `covalenthq.com`
- Base: `https://api.covalenthq.com/v1`

| Endpoint | Purpose |
|----------|---------|
| `GET /{chainId}/address/{address}/balances_v2/` | All token balances |
| `GET /{chainId}/address/{address}/transactions_v3/` | Transaction history |
| `GET /{chainId}/address/{address}/balances_nft/` | NFT holdings |
| `GET /{chainId}/address/{address}/stacks/aave_v2/balances/` | DeFi positions (limited protocols) |

### Feature proposals

| ID | Feature | Impact | Effort |
|----|---------|--------|--------|
| C1 | **Wallet Overview page** (`/wallet/[address]`) — all tokens, NFTs, value, chain breakdown | HIGH | MEDIUM |
| C2 | **Portfolio page** (your own wallet, auto-linked when connected) | HIGH | MEDIUM |
| C3 | **Multi-chain Switcher** — see same wallet across Solana + ETH + Base etc | MED | LOW |
| C4 | **Historical Balance Chart** — portfolio value over time | MED | MEDIUM |

### Unique Cockpit angle

Right now Cockpit shows **only Solana vault positions** when a wallet connects. Adding Covalent extends this to the **entire user's Web3 portfolio** — Cockpit becomes their cross-chain command center, not just their Kamino dashboard.

### Concerns

- Requires API key (first paid-tier dep in our stack)
- Data normalization across chains has edge cases (e.g. Solana SPL vs ERC-20 decimals, NFT standards differ)
- Need to be careful about caching to stay under 100K credits/month

### Effort estimate

C1 alone: **1 day** (service + page + normalization)
C1 + C2: **1.5 days** (add wallet auto-detection)

---

## TRACK 5 — icy.tools (NFT Tracking)

### What it is

GraphQL-based NFT API — collection floor prices, sales history, rarity data, holder distribution. Primarily EVM-focused but has Solana support.

### API

- Requires API key (free tier)
- GraphQL only: `https://api.icy.tools/graphql`

**Primary Solana alternative:** If Solana-NFT-first is priority, consider **Helius NFT API** (already in our RPC stack, no new dep) or **Tensor API**.

### Feature proposals

| ID | Feature | Impact | Effort |
|----|---------|--------|--------|
| N1 | **NFT holdings on Wallet page** — grid of user's NFTs with floor/estimated value | HIGH | MEDIUM |
| N2 | **Collection explorer** — browse top Solana collections (floor, volume, holders) | MED | MEDIUM |
| N3 | **NFT-backed lending context** — Kamino also has NFT collateral; link the two | HIGH | HIGH |
| N4 | **NFT valuation in portfolio total** — "Your portfolio is worth $X, of which $Y is NFTs" | MED | LOW |

### Recommendation

**Use Helius NFT API first** (free, already in our stack) — it covers Solana NFTs well. Only reach for icy.tools if you expand to EVM NFTs.

### Effort estimate

N1 with Helius: **1 day**
N1 + N2 with Helius: **1.5 days**

---

## 🎯 Cross-Track Priority Matrix

Ranked by **impact × leverage** (does this unlock multiple features?):

| Priority | Feature | Track | Why |
|----------|---------|-------|-----|
| 🥇 1 | **Vault → LST drill-down (S3)** | Sanctum | Unique angle, low effort, stacks with existing Kamino work |
| 🥈 2 | **Messari Asset Profile on token page (M1)** | Messari | Half-day ship, makes every `/token/[mint]` page deeper |
| 🥉 3 | **LST Directory (S1)** | Sanctum | New surface, weekend-scoped, natural nav item |
| 4 | **Wallet Overview (C1)** | Covalent | Cross-chain angle, needs API key strategy |
| 5 | **NFT holdings on wallet (N1)** | Helius | Complements Covalent, leverages existing RPC |
| 6 | **Vault → underlying pairs (D)** | DexScreener | Unique context, very low effort |
| 7 | **LST detail pages (S2)** | Sanctum | Follow-on after S1 ships |
| 8 | **Pair Explorer (A)** | DexScreener | Full page, higher effort, overlaps with DexScreener.com itself |

---

## Suggested rollout sequence

### Sprint 1 (1 week): "Deeper Context"
- **M1** Messari Asset Profile on token pages (half day)
- **S3** Vault → LST drill-down (1 day)
- **D** Vault → underlying pairs (half day)

These all **add context to pages that already exist** — no new routes. Low risk, high polish impact.

### Sprint 2 (1 week): "New Surfaces"
- **S1** LST Directory `/lst` (2 days)
- **N1** NFT holdings via Helius (1 day)
- **C1** Wallet Overview `/wallet/[address]` (1 day, experimental)

### Sprint 3 (optional): "Expansion"
- **C3** Multi-chain switcher
- **S2** LST detail pages
- **A** Full Pair Explorer
- **M2** Fundamental Score

---

## Design constraints (apply to every track)

- Stay within Asgard design system (light base, dark hero, `rounded-sm`)
- Work at 320px mobile viewport
- No file > 700 lines — split components from the start
- Dynamic imports for anything > 200KB
- Use existing `Card`, `Pill`, `TokenIcon`, `TokenPairIcons` primitives
- **No mocks** — real data or clear error state

---

## Open questions (for discussion)

1. **Sprint 1 scope:** Does the M1 + S3 + D bundle feel right, or pick a different starter combo?
2. **Chain coverage:** Solana-first and expand later, or multi-chain (via Covalent) from day 1?
3. **API key strategy:** Covalent needs a key — ok to add as our first paid-tier dep? Or stall C-track until needed?
4. **NFT approach:** Helius NFT (free, existing) vs icy.tools (paid, richer)?
5. **"Fundamental Score" (M2):** Useful differentiator, or adds noise to Market page?
6. **Rebrand timing:** Ship `y-vault` → `defi-cockpit` rename alongside Sprint 1, or separate?

---

## Next steps

- [ ] Answer the 6 open questions above
- [ ] Lock Sprint 1 scope (default: M1 + S3 + D)
- [ ] Create a spec doc per locked feature (e.g. `SPEC-SANCTUM-LST.md`)
- [ ] Start each on a new branch off `stage`
- [ ] Merge flow: branch → stage → main (strip Agentation on main merge)

---

*Last updated: 2026-04-13*
