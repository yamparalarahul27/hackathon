# Y-Vault — Unified Research & Strategy

> Last updated: 2026-04-17
> Deadline: **May 12, 2026** (Colosseum Frontier Hackathon)

---

## Product Vision

**Y-Vault** is a **DeFi Cockpit** for Solana — real-time yield intelligence, vaults, swaps, analytics, and privacy. Powered by real on-chain data, not mocks.

**Pivot (April 2026):** Original vision was fiat→vault deposit pipeline, but Kamino deposits are mainnet-only and can't be demoed without real money. Pivoted to experience-first DeFi cockpit — real data flowing through a stunning UI.

**Core philosophy:** Design Engineering > Problem Solving. The product wins on **experience** — real data, beautiful visualization, zero mocks.

---

## Track Submissions

| # | Track | Prize | Status | What We Show |
|---|-------|-------|--------|-------------|
| 1 | **Eitherway — Kamino** | $2K-$5K cash | **90% ready** | Deep Kamino SDK vault analytics, real mainnet data |
| 2 | **Umbra Privacy** | $5K / $3K / $2K cash | **SDK installed, UI partial** | Shielded deposits, private balances, compliance grants |
| 3 | **Jupiter DX** | 1K/750/500 jupUSD | **Ultra integrated** | Ultra swap + shield + search + DX Report |
| 4 | **100xDevs Frontier** | $500-$2.5K cash (10 winners) | **Strong** | Overall product quality, UX polish |
| 5 | **Torque MCP** | TBD | **Research done** | AI-managed reward programs, leaderboards |
| 6 | **LI.FI** | TBD | **Research done** | Cross-chain bridge via widget or SDK |
| 7 | **Eitherway — QuickNode** | $2K cash | Not started | QuickNode Streams for real-time data |
| 8 | **RPC Fast** | $1K-$5K infra credits | RPC in use | Already using as fallback RPC |

**Dropped:** Dodo Payments (India excluded from crypto payments — can't do INR→USDC), KiraPay (mostly non-cash), Dune (low priority).

### Judging Criteria

- **Kamino/QuickNode:** Real-world utility 30%, Product quality 30%, Integration depth 25%, Adoption 15%
- **Umbra:** SDK integration depth (essential, not superficial), Innovation, Technical quality, UX
- **Jupiter DX:** DX Report quality 35%, AI Stack feedback 25%, Technical execution 25%, Creativity 15%
- **100xDevs:** Technical quality, innovation, real-world problem-solving, UX, polish

---

## Competitive Intelligence

### Why "DeFi Dashboards" Don't Win

12 similar projects across 4 Colosseum hackathons — **zero won prizes.** Judges reward novel primitives, not visualization.

| Cluster | Projects | Winners | Win Rate |
|---------|----------|---------|----------|
| Data & Monitoring | 257 | 31 | 12.1% |
| DeFi Optimization | 257 | 29 | 11.3% |
| DEX & Trading | 323 | 23 | 7.1% |

**Winner pattern:** Overindex on fragmented liquidity (2x lift), capital inefficiency (1.8x lift). Skip: high platform fees (0 winners), tokenized rewards (0 winners).

### Our Strategy

Don't submit as "a DeFi dashboard." Submit to specific tracks where integration depth is the differentiator:
- **Kamino track** — deep SDK integration, real data
- **Umbra track** — privacy + DeFi is genuinely novel (no prior Colosseum winner did this)
- **Jupiter DX** — write the DX report about Ultra API experience
- **100xDevs** — product quality speaks for itself

---

## Side-Track Research

### Umbra Privacy

**What:** Confidential compute for Solana SPL tokens via Arcium MPC + Groth16 ZK proofs.

| Item | Value |
|------|-------|
| Package | `@umbra-privacy/sdk` v4.0.0 |
| Networks | mainnet / **devnet** / localnet |
| Bundle | 16 MB (lazy-load mandatory) |
| Solana lib | `@solana/kit` (NOT web3.js) |
| Indexer devnet | `https://utxo-indexer.api-devnet.umbraprivacy.com` |
| Indexer mainnet | `https://utxo-indexer.api.umbraprivacy.com` |

**What's built:** UmbraService (205 lines), useUmbra hook (186 lines), PrivacyPanel UI (partial), constants configured, SDK installed.

**Integration plan:** Tier 1 — shielded deposit + private balance view + compliance grant (~6h). Tier 2 — key rotation + recovery (+4h). Tier 3 — mixer/UTXO transfers (+10h).

**Gotchas:** Uses `@solana/kit` not web3.js (adapter needed), 16 MB bundle (dynamic import only), devnet WSS RPC needed, async MPC can strand funds (recovery UI required).

### Torque MCP

**What:** MCP server connecting AI assistants to the Torque incentive platform. Create reward programs (leaderboards, rebates, raffles) through natural language.

| Item | Value |
|------|-------|
| Package | `@torque-labs/mcp` v0.4.2 |
| Setup | `claude mcp add torque -e TORQUE_API_TOKEN=... -- npx @torque-labs/mcp` |
| API base | `https://server.torque.so` |

**30+ MCP tools:** Auth, projects, incentive queries, custom events, IDL parsing, Dune event sources, results/analytics.

**Integration:** Layer 1 — MCP-powered campaign management (dev-time). Layer 2 — Leaderboard section on dashboard, claim rewards page (runtime).

### LI.FI

**What:** Cross-chain bridge + DEX aggregator. Any token on any chain → any token on any other chain.

| Product | Package | Notes |
|---------|---------|-------|
| SDK | `@lifi/sdk` v3.16.3 (43K weekly DLs) | Programmatic cross-chain |
| Widget | `@lifi/widget` v3.40.12 | Drop-in React component |

**Uses `@solana/web3.js` — same as our app.** No adapter needed. Free API, no key.

**Integration:** Path A — Widget on `/bridge` page (~2h). Path B — SDK in deposit flow (~5h).

### Comparison

| | Jupiter Ultra | LI.FI | Umbra | Torque |
|---|---|---|---|---|
| **Scope** | Solana → Solana | Any chain → Any chain | Solana privacy | Solana rewards |
| **Our status** | Done ✅ | Research done | SDK installed | Research done |
| **Effort** | Done | 2h (widget) | 6h (Tier 1) | 4h (MCP + UI) |
| **Blocker** | None | None | Devnet WSS RPC | TORQUE_API_TOKEN |

---

## DEX Integration Assessment

### Tier 1: Solana-Native, Free APIs

| DEX | Type | API | Confirmed |
|-----|------|-----|-----------|
| **Jupiter Perps** | Perps | `perps-api.jup.ag/v1/*` (OpenAPI) | Yes — positions, PnL, funding, trades, leaderboard |
| **Orca** | AMM (CLMM) | `api.mainnet.orca.so/v1/whirlpool/list` | Yes — 14,983 pools |
| **Raydium** | AMM | `api-v3.raydium.io/pools/info/list` | Yes — CLMM + legacy |
| **Meteora** | AMM (DLMM) | `dlmm-api.meteora.ag` | Partial — timeouts, use SDK |

**Jupiter Perps endpoints (all free, no auth):**

| Endpoint | Returns |
|----------|---------|
| `GET /v1/positions?walletAddress=` | User's open perp positions |
| `GET /v1/trades?walletAddress=` | User's trade history |
| `GET /v1/jlp-info` | JLP pool AUM, price, APR |
| `GET /v1/market-stats?mint=` | Per-market price, 24h change, volume |
| `GET /v1/top-traders?marketMint=&year=&week=` | Trader leaderboard |

### Tier 2: Viable But More Work

| DEX | Notes |
|-----|-------|
| Pacifica | Perps (crypto/forex/equities), $31.5M TVL, free API |
| Hyperliquid | 229 perp markets, free, NOT Solana (own L1) |
| PancakeSwap | Official Solana SDK, lower TVL |

### Tier 3: Skip

Pumpswap (no official API), ORO Finance (not a DEX), DFlow (redundant with Jupiter).

---

## Feature Ideation

### Built ✅

| Feature | Source | Status |
|---------|--------|--------|
| LST Directory (`/cockpit/lst`) | Sanctum TOML | Done — searchable, filterable |
| NFT Holdings + Detail Modal | Helius DAS | Done — rich attributes, collection filters |
| Wallet Balances | Jupiter Ultra `/holdings` | Done — USD values, shield button |
| Token Search Combobox | Jupiter Ultra `/search` | Done — live SPL search |
| Shield Check on Swap | Jupiter Ultra `/shield` | Done — scam detection |
| Market Token List | CoinGecko | Done — sortable, categorized |
| Vault Explorer + Dashboard | Kamino SDK | Done — real mainnet data |
| DEX Analytics | Deriverse SDK | Done — devnet trades |
| Token Detail Pages | Multi-source oracles | Done — Binance, Birdeye, CoinGecko |
| Shielded Balances | Umbra SDK | Partial — registration + query |

### High-Value Unbuilt

| Priority | Feature | Source | Effort | Impact |
|----------|---------|--------|--------|--------|
| 1 | **Jupiter Perps positions** on wallet | `perps-api.jup.ag` | 3-4h | Adds perps PnL to cockpit |
| 2 | **Vault → LST drill-down** (stacked yield) | Sanctum TOML + Helius | 1 day | Unique angle nobody has |
| 3 | **Messari Asset Profile** on token pages | Messari API (free) | 0.5 day | Deeper token intelligence |
| 4 | **Cross-chain bridge** page | LI.FI Widget | 2h | Multi-chain on-ramp |
| 5 | **Torque leaderboard** on dashboard | Torque MCP + API | 4h | Gamification layer |
| 6 | **Orca/Raydium pool data** on vault detail | REST APIs | 2-3h | "Where this pair trades" |
| 7 | **Umbra shield/unshield UI** | Umbra SDK | 2-3h | Completes privacy flow |
| 8 | **Jupiter DX Report** (written doc) | N/A | 2h | Jupiter track submission |

---

## Infrastructure Status

### RPC

| Provider | Status | Network |
|----------|--------|---------|
| **Helius** | Active (primary) | Mainnet + Devnet |
| **QuickNode** | Active (WSS fallback) | Mainnet |
| **RPC Fast** | Active (round-robin) | Mainnet |
| Fallback chain | `Helius → QuickNode → RPCFast → public` | — |

### Umbra Devnet Readiness

| Item | Status |
|------|--------|
| SDK installed | ✅ `@umbra-privacy/sdk ^4.0.0` |
| UmbraService | ✅ 205 lines — register, shield, unshield, query, compliance, recovery |
| useUmbra hook | ✅ 186 lines — full lifecycle |
| Constants | ✅ Devnet + mainnet indexer URLs configured |
| Devnet WSS RPC | ⚠️ Add `NEXT_PUBLIC_UMBRA_WSS_RPC=wss://api.devnet.solana.com` |
| Shield/Unshield UI | ⚠️ Not built — need mint input, amount input, buttons |

### Dodo Payments

**Verdict: Dropped.** India is excluded from crypto payments. Dodo can accept INR (UPI) OR accept crypto (USDC), but NOT convert between them. No fiat-to-crypto on-ramp.

---

## Recommended Priority (Current)

| # | Action | Effort | Unlocks |
|---|--------|--------|---------|
| 1 | **Umbra devnet test** — add WSS, build shield/unshield UI, run E2E | 2-3h | Umbra track ($5K/$3K/$2K) |
| 2 | **Jupiter DX Report** — write up Ultra API experience | 2h | Jupiter DX (1K jupUSD) |
| 3 | **Jupiter Perps positions** — add to wallet page | 3-4h | Dashboard richness |
| 4 | **LI.FI Widget** — `/cockpit/bridge` page | 2h | Cross-chain on-ramp |
| 5 | **Kamino polish + demo video** | 2-3h | Kamino track ($2K-$5K) |
| 6 | **Torque MCP setup + leaderboard** | 4h | Gamification + Torque track |
| 7 | **Deploy verification** — confirm stage/main sites live and stable | 30min | All tracks |

**Total estimated: ~18h for all 7.** Cherry-pick based on remaining time before May 12.

---

## Design Constraints

- Asgard UI design system (light base `#f1f5f9`, dark hero gradient, `rounded-sm`)
- 320px mobile viewport safe (every component)
- No file > 700 lines — split components
- Dynamic imports for anything > 200KB
- Use existing primitives: `Card`, `Pill`, `TokenIcon`, `Button`, `StatusDot`
- **No mocks** — real data or explicit error state
- Agentation on `stage` only, stripped from `main`

---

## Environment Variables

```bash
# Helius RPC (primary)
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
NEXT_PUBLIC_HELIUS_RPC_URL=...          # Same, client-accessible
HELIUS_DEVNET_RPC_URL=...               # Devnet

# QuickNode (WSS fallback)
QUICKNODE_RPC_URL=...
QUICKNODE_WSS_URL=wss://...

# RPC Fast (round-robin)
RPCFAST_RPC_URL=...

# Jupiter
JUPITER_API_KEY=...                     # Set on Vercel ✅

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Umbra
NEXT_PUBLIC_UMBRA_NETWORK=devnet
NEXT_PUBLIC_UMBRA_WSS_RPC=wss://api.devnet.solana.com  # ⚠️ add this

# Optional
BIRDEYE_API_KEY=...
TORQUE_API_TOKEN=...                    # Needed for Torque MCP
```
