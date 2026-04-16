# DEX & Integration Research — April 16, 2026

> Status: **Research complete**
> Scope: DEX integrations, Umbra readiness, Helius verification, Dodo assessment

---

## Table of Contents

1. [DEX Integration Assessment](#dex-integration-assessment)
2. [Helius RPC Status](#helius-rpc-status)
3. [Umbra Privacy — Devnet Readiness](#umbra-privacy--devnet-readiness)
4. [Dodo Payments — INR to USDC Assessment](#dodo-payments--inr-to-usdc-assessment)
5. [Colosseum Competitive Intelligence](#colosseum-competitive-intelligence)
6. [Recommended Priority](#recommended-priority)

---

## DEX Integration Assessment

### Tier 1: Solana-Native, Free APIs, Easy Integration

| DEX | Type | SDK / API | Free? | Data Available | Docs |
|-----|------|-----------|-------|----------------|------|
| **Jupiter Perpetuals** | Perps | `@jup-ag/perpetuals-sdk` (npm), REST at `perps-api.jup.ag` | Yes | Positions, PnL, funding rates, OI, pool stats, JLP info | [OpenAPI](https://perps-api.jup.ag/v1/docs), [Station](https://station.jup.ag/docs/perpetual-exchange) |
| **Orca** | AMM (CLMM) | `@orca-so/whirlpools-sdk` v0.20.0, REST at `api.mainnet.orca.so` | Yes | 14,983 pools, TVL, volume, fee APR, reward APRs | [GitHub](https://github.com/orca-so/whirlpools), [Docs](https://orca-so.github.io/whirlpools/) |
| **Meteora** | AMM (DLMM) | `@meteora-ag/dlmm` v1.9.4 (467 versions), REST at `dlmm-api.meteora.ag` | Yes | Pair data, pool stats, positions, fee APR, bin liquidity | [GitHub](https://github.com/MeteoraAg/dlmm-sdk), [Docs](https://docs.meteora.ag/) |
| **Raydium** | AMM (CLMM + Standard) | `@raydium-io/raydium-sdk-v2` v0.2.41-alpha, REST at `api-v3.raydium.io` | Yes | Pool info, TVL, volume, fees, LP positions | [GitHub](https://github.com/raydium-io/raydium-sdk-V2), [Docs](https://docs.raydium.io/) |

### Jupiter Perpetuals — Confirmed Live Endpoints (No Auth)

| Endpoint | Returns |
|----------|---------|
| `GET /v1/jlp-info` | JLP pool AUM ($977M), JLP price ($3.87), APR (8.71%), per-custody breakdown |
| `GET /v1/market-stats?mint=` | Per-market price, 24h change, high/low, volume |
| `GET /v1/positions?walletAddress=` | User's open perp positions |
| `GET /v1/trades?walletAddress=` | User's trade history |
| `GET /v1/loans/info` | Borrow APR, utilization, LTV limits |
| `GET /v1/top-traders?marketMint=&year=&week=` | Trader leaderboard |

### For Read-Only Dashboard (No Heavy SDKs Needed)

| DEX | REST API (free, no key) | Confirmed |
|-----|-------------------------|-----------|
| Orca | `api.mainnet.orca.so/v1/whirlpool/list` — 14,983 pools | Yes |
| Raydium | `api-v3.raydium.io/pools/info/list` — CLMM + legacy pools | Yes |
| Jupiter Perps | `perps-api.jup.ag/v1/*` — full OpenAPI spec | Yes |
| Meteora | REST unreliable (timeouts) — use SDK instead | Partial |

### Tier 2: Viable But More Work

| DEX | Type | Chain | SDK / API | Notes |
|-----|------|-------|-----------|-------|
| **Pacifica** | Perps (crypto, forex, equities) | Solana | REST at `api.pacifica.fi`, [Docs](https://docs.pacifica.fi/) | $31.5M TVL, 25+ instruments, free API, no official npm SDK |
| **Hyperliquid** | Perps (order book) | Own L1 | `@nktkas/hyperliquid` v0.32.2, REST at `api.hyperliquid.xyz` | 229 perp markets, 455 spot tokens, free, no key. NOT Solana. |
| **Backpack** | CEX (Solana-focused) | Off-chain | REST at `api.backpack.exchange`, `@cks-systems/backpack-client` v3.0.15 | 162 markets, free public data. CEX, not on-chain. |
| **PancakeSwap** | AMM | Solana + EVM | `@pancakeswap/swap-sdk-solana` v1.1.7, `@pancakeswap/solana-clmm-sdk` | Official Solana SDK, lower TVL on Solana |

### Tier 3: Skip for Hackathon

| DEX | Why Skip |
|-----|----------|
| **Pumpswap** | Community SDKs only (v0.0.2), no official API, fragile |
| **ORO Finance** | Not a DEX — gold RWA product, $0 TVL, no API/SDK |
| **DFlow Pond** | Redundant — Jupiter already covers swap routing. Dev-only APIs. |

---

## Helius RPC Status

**Confirmed: Mainnet Helius RPC is configured and in use.**

| Variable | Value | Network |
|----------|-------|---------|
| `HELIUS_RPC_URL` | `mainnet.helius-rpc.com/?api-key=...` | Mainnet |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Same | Mainnet |
| `HELIUS_DEVNET_RPC_URL` | `devnet.helius-rpc.com/?api-key=...` | Devnet |

**RPC fallback chain:** Helius → QuickNode → RPCFast → public (via `withRpcFallback()` in `src/lib/rpc.ts`)

Both mainnet and devnet Helius keys use the same API key. WSS is provided by QuickNode and RPCFast (mainnet only).

---

## Umbra Privacy — Devnet Readiness

### What's Built (Complete)

| Component | File | Status |
|-----------|------|--------|
| UmbraService | `src/services/UmbraService.ts` (205 lines) | Complete — register, shield, unshield, query, compliance grants, recovery |
| useUmbra hook | `src/lib/hooks/useUmbra.ts` (186 lines) | Complete — full lifecycle |
| PrivacyPanel UI | `src/components/features/PrivacyPanel.tsx` (182 lines) | Partial — registration + compliance + recovery, NO shield/unshield controls |
| Constants | `src/lib/constants.ts` | Complete — indexer URLs, WSS fallback, network config |
| SDK installed | `@umbra-privacy/sdk ^4.0.0` | Yes |

### Indexer URLs (Already Configured)

```
Devnet:  https://utxo-indexer.api-devnet.umbraprivacy.com
Mainnet: https://utxo-indexer.api.umbraprivacy.com
```

Auto-selected via `UMBRA_NETWORK` env var. Note: devnet indexer root returns 404 — may only respond on specific API paths. For Tier 1 (encrypted balances, not mixer), the indexer may not even be needed.

### Blockers for Devnet Test

| Blocker | Fix | Effort |
|---------|-----|--------|
| **No devnet WSS RPC** | Add `NEXT_PUBLIC_UMBRA_WSS_RPC=wss://api.devnet.solana.com` to `.env.local` | 1 min |
| **RPC_HTTP points to mainnet** | For devnet test, temporarily point to devnet RPC or use `HELIUS_DEVNET_RPC_URL` | 1 min |
| **No shield/unshield UI** | Add mint input, amount input, shield/unshield buttons to PrivacyPanel | 1-2 hours |
| **Devnet indexer health unclear** | Test specific API paths, not just root. Encrypted balance ops may work without indexer. | 15 min |

### Steps to Run Devnet E2E Test

1. In `.env.local`, add:
   ```
   NEXT_PUBLIC_UMBRA_WSS_RPC=wss://api.devnet.solana.com
   NEXT_PUBLIC_UMBRA_NETWORK=devnet
   ```
2. Add shield/unshield controls to `PrivacyPanel.tsx`
3. Connect Phantom wallet in devnet mode
4. Fund wallet with devnet SOL (airdrop) + devnet USDC
5. Register → Shield → Query Balance → Unshield
6. Verify transactions on Solana Explorer (devnet)

**Estimated time to test: 2-3 hours** (mostly building the shield/unshield UI + debugging the first run)

---

## Dodo Payments — INR to USDC Assessment

### Verdict: Cannot do INR → USDC. Confirmed.

**Dodo Payments India support:**
- Accepts INR via **UPI Collect**, **Rupay Credit Cards**, **Rupay Debit Cards**
- Minimum: ₹1
- Supports recurring payments via RBI-compliant mandates
- 48-hour processing delay on mandates (customer can cancel within window)

**Dodo Payments crypto support:**
- Accepts USDC on **Ethereum, Solana, Polygon, Base**
- Also USDP (Ethereum, Solana) and USDG (Ethereum)
- Settlement: merchants receive **USD, not crypto**
- Minimum: $0.50

**The critical limitation:**
> **India is explicitly excluded from crypto payments.**

Dodo can accept INR (via UPI) OR accept crypto (USDC on Solana), but NOT convert between them. There is:
- No fiat-to-crypto on-ramp
- No INR → USDC conversion
- No crypto payouts to users
- India excluded from crypto payment method entirely

**Decision: Drop Dodo Payments track.** The use case we needed (Indian user pays INR → receives USDC on Solana) is not possible with Dodo.

### Alternative On-Ramp Options (For Future Reference)

| Service | INR → USDC | Method |
|---------|-----------|--------|
| Transak | Yes | Aggregator, supports UPI → USDC on Solana |
| MoonPay | Yes | Cards → USDC on Solana (limited in India) |
| Onramper | Yes | Meta-aggregator of on-ramps |
| Direct CEX | Yes | Buy USDC on WazirX/CoinSwitch → withdraw to Solana wallet |

These would require separate integration and are out of scope for this hackathon.

---

## Colosseum Competitive Intelligence

### Similar Projects (0 Winners Out of 12)

| Project | Hackathon | Won? |
|---------|-----------|------|
| Solix Finance | Radar | No |
| DefiPulse | Renaissance | No |
| Sakra | Cypherpunk | No |
| DeFi Depths | Radar | No |
| Laniakea | Cypherpunk | No |
| PlutoFi | Cypherpunk | No |
| WhaleWise | Renaissance | No |
| Flexanon | Cypherpunk | No |
| STRATOS DEFI POD | Breakout | No |
| Credovira | Breakout | No |
| defibound | Renaissance | No |
| Glaize | Breakout | No |

**Pattern:** "DeFi dashboard showing real data" has been tried 12 times. None won. Judges reward novel primitives and protocol-level solutions, not visualization.

### Winner Pattern (What Judges Actually Reward)

Winners overindex on: fragmented liquidity (2x lift), capital inefficiency (1.8x lift)
Winners skip: high platform fees (0 winners), high barrier to entry (0 winners), tokenized rewards (0 winners)

### Cluster Win Rates

| Cluster | Projects | Winners | Win Rate |
|---------|----------|---------|----------|
| Data & Monitoring | 257 | 31 | 12.1% |
| DeFi Optimization | 257 | 29 | 11.3% |
| DEX & Trading | 323 | 23 | 7.1% |

### Implication for Y-Vault

Don't submit as "a DeFi dashboard." Instead, submit to specific tracks:
1. **Kamino track** — deep integration, 90% complete
2. **Umbra track** — privacy + DeFi is genuinely novel
3. **Jupiter DX** — write the DX report about Ultra API experience
4. **100xDevs** — product quality speaks for itself

---

## Recommended Priority

| # | Action | Effort | Unlocks |
|---|--------|--------|---------|
| 1 | **Umbra devnet test** — add WSS, build shield/unshield UI, run E2E | 2-3 hours | Umbra track ($5K/$3K/$2K) |
| 2 | **Kamino polish + demo video** | 2-3 hours | Kamino track ($2K-$5K) |
| 3 | **Jupiter DX Report** — write up Ultra API integration experience | 2 hours | Jupiter DX (1K jupUSD) |
| 4 | **DEX data integration** — Jupiter Perps + Orca REST for dashboard richness | 3-4 hours | 100xDevs polish |
| 5 | **Deploy verification** — confirm vault.hirahul.xyz is live and stable | 30 min | All tracks |

**Dropped:** Dodo Payments (can't do INR → USDC), DFlow (redundant with Jupiter)
