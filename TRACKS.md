# Side Track Integration Research

> Last updated: 2026-04-16
> Covers: **Umbra Privacy**, **Torque MCP**, **LI.FI**

---

## Overview

Three side-track integrations researched for the Colosseum Frontier Hackathon. Each is complementary — no overlap.

| Integration | What it adds | Prize pool | Effort | Blocker |
|------------|-------------|-----------|--------|---------|
| **Umbra Privacy** | Shielded deposits, private balances, compliance grants | $5K / $3K / $2K | ~6h (Tier 1) | Indexer URL from Umbra team |
| **Torque MCP** | Reward programs, leaderboards, incentive campaigns via AI | TBD | ~4h (MCP + leaderboard UI) | `TORQUE_API_TOKEN` |
| **LI.FI** | Cross-chain bridge + swap (any chain → Solana) | TBD | ~2h (widget) / ~5h (SDK) | None (free API) |

---

# 1. Umbra Privacy

**Status:** Research complete, pending indexer URL from Umbra team

## What It Is

Confidential compute layer for Solana SPL / Token-2022 tokens, built on **Arcium** (MPC network) + **Groth16 ZK proofs**.

**Encrypted Balances** — SPL token balance stored encrypted on-chain. Owner can deposit, withdraw, and query with a viewing key. Amount is not publicly visible.

**Anonymous Transfers (Mixer)** — UTXO-based shielded pool with an Indexed Merkle Tree. Sender creates a UTXO → recipient claims with a ZK proof → on-chain link broken. Deferred for v1.

**Compliance** — Master viewing key hierarchy + X25519 grants. Auditors / tax authorities can decrypt without making amounts public.

## SDK Facts

| Item | Value |
|------|-------|
| Package | `@umbra-privacy/sdk` **v4.0.0** (2026-04-09) |
| ZK prover | `@umbra-privacy/web-zk-prover` v2.0.1 (Groth16 via snarkjs) |
| Bundle | 16 MB unpacked, 181 files |
| Solana lib | `@solana/kit ^6.0.1` (NOT `@solana/web3.js`) |
| Networks | **`mainnet` / `devnet` / `localnet`** — devnet works |
| Deps | `@noble/{ciphers,curves,hashes}`, Arcium codama, Umbra codama |

### Subpath Exports
```
@umbra-privacy/sdk           — Client, service factories, crypto ops
@umbra-privacy/sdk/crypto    — Rescue cipher, Poseidon hash, AES, key derivation
@umbra-privacy/sdk/pda       — PDA derivation for Umbra + Arcium accounts
@umbra-privacy/sdk/solana    — RPC providers, signers, tx forwarding
@umbra-privacy/sdk/math      — BN254 and Curve25519 field arithmetic
@umbra-privacy/sdk/types     — Branded types (U64, U128, U256, Address)
@umbra-privacy/sdk/interfaces — Function signatures for all factories
@umbra-privacy/sdk/constants — Network configs, program IDs
@umbra-privacy/sdk/errors    — Error classes, stage enums
```

## Quick Start

```typescript
import {
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
  getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction,
} from "@umbra-privacy/sdk";

const client = await getUmbraClient({
  signer,
  network: "devnet",
  rpcUrl: HELIUS_RPC_URL,
  rpcSubscriptionsUrl: WSS_URL,
  indexerApiEndpoint: "<from Umbra team>",
});

// Register (idempotent)
await getUserRegistrationFunction({ client })({ confidential: true, anonymous: true });

// Deposit 1 USDC into encrypted balance
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
await getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client })(
  signer.address, USDC, 1_000_000n
);

// Query (only owner can see)
const balance = await getEncryptedBalanceQuerierFunction({ client })(USDC);

// Withdraw back to public
await getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client })(
  signer.address, USDC, 1_000_000n
);
```

## All SDK Services

**Token Flow:** `getPublicBalanceToEncryptedBalanceDirectDepositorFunction`, `getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction`

**Mixer (deferred):** `getPublicBalanceToSelfClaimableUtxoCreatorFunction`, `getEncryptedBalanceToSelfClaimableUtxoCreatorFunction`, `getPublicBalanceToReceiverClaimableUtxoCreatorFunction`, `getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction`

**UTXO Scan/Claim:** `getClaimableUtxoScannerFunction`, `getSelfClaimableUtxoToEncryptedBalanceClaimerFunction`, `getSelfClaimableUtxoToPublicBalanceClaimerFunction`, `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction`

**Account:** `getUserRegistrationFunction`, `getUserEncryptionKeyRotatorFunction`, `getMasterViewingKeyRotatorFunction`, `getUserEntropySeedRotatorFunction`, `getTokenEntropySeedRotatorFunction`, `getStagedSolRecovererFunction`, `getStagedSplRecovererFunction`

**Query:** `getUserAccountQuerierFunction`, `getEncryptedBalanceQuerierFunction`

**Compliance:** `getComplianceGrantIssuerFunction`, `getComplianceGrantRevokerFunction`, `getSharedCiphertextReencryptorForUserGrantFunction`, `getNetworkCiphertextReencryptorForNetworkGrantFunction`, `getSharedCiphertextReencryptorForNetworkGrantFunction`

## Integration Plan for Y-Vault

| Feature | Where | Service | Effort |
|---------|-------|---------|--------|
| Shielded deposit | `DepositFlow.tsx` "Shield" toggle | DirectDepositor | Medium |
| Private balance view | `/wallet` "Shielded Balances" | EncryptedBalanceQuerier | Low |
| Compliance grant | Settings → Privacy | ComplianceGrantIssuer | Low |
| Withdraw to public | Wallet → "Unshield" | DirectWithdrawer | Low |

## Gotchas

- **🚨 Indexer URL unknown** — neither `indexer.umbraprivacy.com` nor `indexer.umbra.finance` resolves. Get from Umbra team.
- **🚨 Uses `@solana/kit` not `@solana/web3.js`** — needs adapter for signer/tx types.
- **🚨 16 MB bundle** — must `dynamic(() => import(...), { ssr: false })`.
- **⚠️ Async MPC callbacks** — can strand funds. Recovery functions must be in UI.
- **⚠️ WSS RPC required** — `rpcSubscriptionsUrl` param.
- **⚠️ ZK prover peer dep** — `web-zk-prover@2.0.1` peers on `sdk@2.0.3`, current is 4.0.0.

## Track Details

- **Prize:** $5K / $3K / $2K cash
- **Link:** https://superteam.fun/earn/listing/umbra-side-track
- **Judging:** SDK integration depth (essential, not superficial), Innovation, Technical quality, Commercial viability, UX, Completeness

---

# 2. Torque MCP

**Status:** Research complete. Ready to integrate (need `TORQUE_API_TOKEN`).

## What It Is

**MCP (Model Context Protocol) server** that connects AI assistants (Claude Code, Cursor) to the **Torque incentive platform** on Solana. Create and manage reward programs — leaderboards, rebates, raffles, direct distributions — through natural language.

**Not a traditional SDK.** It's a server that Claude Code runs as a tool. You talk to it, it calls the Torque API.

## Package

| Item | Value |
|------|-------|
| Package | `@torque-labs/mcp` v0.4.2 |
| Deps | `@modelcontextprotocol/sdk`, `@solana/kit`, `zod` |
| Node | ≥20 |
| License | MIT |

## Setup (2 minutes)

```bash
claude mcp add torque -e TORQUE_API_TOKEN=your-token -- npx @torque-labs/mcp
```

## Config

| Env var | Default | Purpose |
|---------|---------|---------|
| `TORQUE_API_TOKEN` | — | Auth token |
| `TORQUE_API_URL` | `https://server.torque.so` | API base |
| `TORQUE_PLATFORM_URL` | `https://platform.torque.so` | Platform UI |
| `TORQUE_INGESTER_URL` | `https://ingest.torque.so` | Event ingestion |

## MCP Tools (30+)

**Auth:** `authenticate`, `check_auth_status`, `logout`

**Projects:** `create_project`, `list_projects`, `set_active_project`

**Incentives:** `generate_incentive_query`, `preview_incentive_query`, `create_recurring_incentive`, `list_recurring_incentives`, `get_recurring_incentive`, `get_recurring_incentive_analytics`, `get_incentive_results`

**Custom Events:** `create_custom_event`, `list_project_events`, `list_custom_events`, `attach_custom_event`

**IDL / On-Chain:** `parse_idl`, `create_idl`, `create_instruction`, `list_idls`

**Dune:** `register_dune_event_source`

**API Keys:** `list_api_keys`, `create_api_key`

**Context:** `get_ai_context`

## Workflows

**Token incentive (zero setup):**
1. `generate_incentive_query` with `source: "swap"` / `"bonding_curve"` / `"hold"`
2. `preview_incentive_query` — validate with real data
3. `create_recurring_incentive` — launch the reward program

**Custom event incentive:**
1. `create_custom_event` → `attach_custom_event` → `generate_incentive_query` → `create_recurring_incentive`

**IDL instruction incentive:**
1. `parse_idl` → `create_idl` → `generate_incentive_query` → `create_recurring_incentive`

## MCP Resources (static reference guides)

- `torque://capabilities` — all tools + quick start
- `torque://workflows` — step-by-step workflows
- `torque://incentive-types` — leaderboard, rebate, raffle, direct + formulas
- `torque://building-landing-pages` — user-facing landing pages with leaderboards

## Integration Plan for Y-Vault

**Layer 1 — MCP-powered campaign management (dev-time):**
- Add Torque MCP to Claude Code
- Create incentives: "reward top vault depositors", "raffle for >$100 swappers"
- AI + Torque = growth automation (what the bounty judges)

**Layer 2 — User-facing UI (runtime):**
- Leaderboard section on dashboard via `get_incentive_results`
- Claim rewards landing page
- Campaign status cards showing active programs

**User story:**
1. Admin uses Claude + Torque MCP: "Create a weekly SOL swap leaderboard, $500 USDC prize pool"
2. Torque sets it up automatically
3. Y-Vault dashboard shows "This Week's Leaderboard" card
4. Users see rank and claim rewards

---

# 3. LI.FI

**Status:** Research complete. Ready to integrate (free API, no key needed).

## What It Is

**Cross-chain bridge + DEX aggregator.** Routes any token on any chain to any token on any other chain. Aggregates all major bridges (Wormhole, Stargate, Across, Hop) + DEXes per chain.

**Jupiter for Solana-only. LI.FI for everything-to-Solana.**

## Products

| Product | Package | Version | Weekly DLs |
|---------|---------|---------|-----------|
| SDK | `@lifi/sdk` | v3.16.3 | 43,396 |
| Widget | `@lifi/widget` | v3.40.12 | — |
| Solana Provider | `@lifi/sdk-provider-solana` | v4.0.0-alpha.1 | 1,053 |
| Types | `@lifi/types` | v17.65.0 | — |

## SDK Functions

```ts
import { createConfig, getQuote, getRoutes, executeRoute, getStatus, getChains, getTokens } from '@lifi/sdk'

createConfig({ integrator: 'Y-Vault' })

const quote = await getQuote({
  fromAddress: '0x...',
  fromChain: ChainId.ARB,
  toChain: ChainId.SOL,
  fromToken: '0x0000...0000',  // native ETH on Arbitrum
  toToken: 'So111...112',      // native SOL
  fromAmount: '1000000000000000000',
})
```

| Function | Purpose |
|----------|---------|
| `getQuote` | Best single route for a swap/bridge |
| `getRoutes` | All possible routes (sorted by speed/cost) |
| `executeRoute` | Execute the route (handles bridge + swap txs) |
| `getStatus` | Track cross-chain tx status |
| `getChains` | List all supported chains |
| `getTokens` | List tokens per chain |

## Widget — Drop-In React Component

```bash
pnpm add @lifi/widget wagmi @solana/wallet-adapter-react @tanstack/react-query
```

```tsx
import { LiFiWidget } from '@lifi/widget'

<LiFiWidget config={{ integrator: 'Y-Vault', appearance: 'dark' }} />
```

Features: all chains/bridges/DEXes, dark mode, compact/wide/drawer layouts, wallet management, tx history, i18n. Works with Next.js.

## SDK Dependencies

Uses `@solana/web3.js ^1.98.4` + `@solana/wallet-adapter-base ^0.9.27` — **same stack as our app**. No adapter needed.

EVM side needs `wagmi` + `viem` (~200KB added to bundle).

## Integration Plan for Y-Vault

**Path A — Widget (2 hours, high impact):**
- New `/bridge` page with `<LiFiWidget />` themed to Asgard
- Users bridge from any chain to Solana
- Dashboard links: "Have funds on Ethereum? Bridge them here."

**Path B — SDK in deposit flow (4-6 hours, deeper):**
- "Deposit from any chain" toggle in `DepositFlow.tsx`
- `getQuote` shows bridge route + estimated output
- `executeRoute` handles cross-chain tx
- After bridge → auto-trigger Kamino vault deposit

## Technical Notes

- **Solana wallet**: compatible (same `@solana/web3.js` + wallet adapter)
- **EVM wallet**: needs `wagmi` for cross-chain — new dep, lazy-load
- **Widget bundle**: heavy (MUI, zustand, emotion, react-router-dom) — must lazy-load
- **API**: free for standard usage, no key needed
- **Chains**: All EVM + Solana + Sui + Bitcoin

---

# Comparison Matrix

| | Jupiter Ultra | LI.FI | Umbra | Torque |
|---|---|---|---|---|
| **Category** | DEX aggregator | Bridge + DEX aggregator | Privacy | Growth / Rewards |
| **Scope** | Solana → Solana | Any chain → Any chain | Solana only | Solana on-chain activity |
| **Our use** | Swap page (done ✅) | Bridge page + cross-chain deposits | Shielded deposits + private balances | Leaderboards + incentive campaigns |
| **Overlap** | None | None (cross-chain vs same-chain) | None | None |
| **API key needed** | Yes (set ✅) | No | Indexer URL (🚨 blocker) | Yes (need signup) |
| **Solana lib** | N/A (REST) | `@solana/web3.js` ✅ | `@solana/kit` ⚠️ adapter needed | `@solana/kit` (MCP only) |
| **Bundle** | Light (REST) | Widget: heavy, SDK: moderate | 16 MB (ZK circuits) | N/A (MCP server) |
| **Effort** | Done | 2h (widget) / 5h (SDK) | 6h (Tier 1) | 4h (MCP + leaderboard) |

---

# Recommended Priority

1. **LI.FI Widget** — lowest effort, highest visual impact, no blockers. Ship the `/bridge` page first.
2. **Torque MCP** — add to Claude Code, create a campaign, show leaderboard on dashboard.
3. **Umbra Tier 1** — pending indexer URL. Start scaffolding once URL is obtained.
