# Umbra Privacy — Integration Research

> Last updated: 2026-04-16
> Status: **Research complete, pending indexer URL from Umbra team**

---

## What Is Umbra

Confidential compute layer for Solana SPL / Token-2022 tokens, built on **Arcium** (MPC network) + **Groth16 ZK proofs**. Two independent primitives:

### 1. Encrypted Balances (simpler, our target)
SPL token balance stored **encrypted on-chain**. Owner can deposit, withdraw, and query with a viewing key. Amount is not publicly visible. Uses Arcium MPC for the encryption.

### 2. Anonymous Transfers — "Mixer" (complex, deferred)
UTXO-based shielded pool with an Indexed Merkle Tree. Sender creates a UTXO → recipient claims it with a Groth16 ZK proof → on-chain link between sender and receiver is broken.

### Compliance Layer
Master viewing key hierarchy + X25519 grants. Authorized auditors / tax authorities can decrypt balances without making them public.

---

## SDK — Technical Facts

| Item | Value |
|------|-------|
| Package | `@umbra-privacy/sdk` **v4.0.0** (published 2026-04-09) |
| ZK prover (browser) | `@umbra-privacy/web-zk-prover` v2.0.1 (Groth16 via snarkjs) |
| ZK prover (React Native) | `@umbra-privacy/rn-zk-prover` v3.0.1 |
| License | MIT |
| Bundle | **16 MB unpacked, 181 files** (includes ZK circuit data) |
| Solana lib | `@solana/kit ^6.0.1` (**NOT** `@solana/web3.js`) |
| Crypto deps | `@noble/{ciphers,curves,hashes}` |
| On-chain deps | `@umbra-privacy/arcium-codama`, `@umbra-privacy/umbra-codama` |
| Indexer | `@umbra-privacy/indexer-read-service-client` |
| Node | ≥18 |
| **Networks** | **`mainnet` / `devnet` / `localnet`** — devnet works! |

### Subpath Exports (tree-shakeable)
```
@umbra-privacy/sdk           — Client, service factories, crypto ops
@umbra-privacy/sdk/crypto    — Rescue cipher, Poseidon hash, AES, key derivation
@umbra-privacy/sdk/pda       — PDA derivation for all Umbra + Arcium accounts
@umbra-privacy/sdk/solana    — RPC providers, signers, tx forwarding
@umbra-privacy/sdk/math      — BN254 and Curve25519 field arithmetic
@umbra-privacy/sdk/types     — Branded types (U64, U128, U256, Address, X25519PublicKey)
@umbra-privacy/sdk/interfaces — Function type signatures for all factories
@umbra-privacy/sdk/constants — Network configs, program IDs, domain separators
@umbra-privacy/sdk/errors    — Error classes, stage enums, type guards
```

---

## Quick Start (from official README)

```typescript
import {
  getInMemorySigner,
  getUmbraClient,
  getUserRegistrationFunction,
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
  getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction,
} from "@umbra-privacy/sdk";

// 1. Create the Umbra client
const client = await getUmbraClient({
  signer,                           // wallet adapter signer
  network: "devnet",                // mainnet | devnet | localnet
  rpcUrl: "https://...",
  rpcSubscriptionsUrl: "wss://...",
  indexerApiEndpoint: "https://indexer.umbra.finance",  // ⚠️ get from Umbra team
});

// 2. Register (idempotent — safe to call even if already registered)
const register = getUserRegistrationFunction({ client });
await register({ confidential: true, anonymous: true });

// 3. Deposit tokens into an encrypted balance
const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
await deposit(signer.address, USDC, 1_000_000n);

// 4. Query encrypted balance (only visible to owner)
const query = getEncryptedBalanceQuerierFunction({ client });
const balance = await query(USDC);

// 5. Withdraw back to public wallet
const withdraw = getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction({ client });
await withdraw(signer.address, USDC, 1_000_000n);
```

---

## All SDK Services

### Token Flow (Direct Deposit / Withdraw)
- `getPublicBalanceToEncryptedBalanceDirectDepositorFunction` — public → encrypted
- `getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction` — encrypted → public

### UTXO / Mixer (Shielded Pool)
- `getPublicBalanceToSelfClaimableUtxoCreatorFunction` — shield own public tokens
- `getEncryptedBalanceToSelfClaimableUtxoCreatorFunction` — shield own encrypted tokens
- `getPublicBalanceToReceiverClaimableUtxoCreatorFunction` — send publicly → receiver claims privately
- `getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction` — send from encrypted → receiver claims

### UTXO Scan & Claim
- `getClaimableUtxoScannerFunction` — scan Merkle trees for UTXOs addressed to your keys
- `getSelfClaimableUtxoToEncryptedBalanceClaimerFunction` — claim own UTXO → encrypted balance
- `getSelfClaimableUtxoToPublicBalanceClaimerFunction` — claim own UTXO → public wallet
- `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction` — claim received UTXO → encrypted balance

### User Account Management
- `getUserRegistrationFunction` — init account, X25519 key reg, anonymous setup
- `getUserEncryptionKeyRotatorFunction` — rotate X25519 encryption key
- `getMasterViewingKeyRotatorFunction` — rotate master viewing key
- `getUserEntropySeedRotatorFunction` — rotate user-level entropy
- `getTokenEntropySeedRotatorFunction` — rotate per-token entropy
- `getStagedSolRecovererFunction` — recover SOL stuck from failed MPC callbacks
- `getStagedSplRecovererFunction` — recover SPL tokens stuck from failed MPC callbacks

### Query
- `getUserAccountQuerierFunction` — read user account state
- `getEncryptedBalanceQuerierFunction` — read + decrypt encrypted token balance

### Conversion
- `getNetworkEncryptionToSharedEncryptionConverterFunction` — MXE-only → shared mode
- `getMintEncryptionKeyRotatorFunction` — rotate per-mint encryption key

### Compliance
- `getComplianceGrantIssuerFunction` — authorize auditor to view encrypted data
- `getComplianceGrantRevokerFunction` — revoke auditor access
- `getSharedCiphertextReencryptorForUserGrantFunction` — re-encrypt for user-granted auditor
- `getNetworkCiphertextReencryptorForNetworkGrantFunction` — re-encrypt for network-granted auditor
- `getSharedCiphertextReencryptorForNetworkGrantFunction` — re-encrypt shared balance for network auditor

### PDA Derivation
- `findEncryptedTokenAccountPda(userAddress, mintAddress, programId)`
- `findStealthPoolPda(treeIndex, programId)`
- `findNullifierSetPdas(treeIndex, programId)`

### Cryptography
- `getRescueEncryptorFromPrivateKey` / `getRescueDecryptorFromPrivateKey`
- `getPoseidonHasher`
- `getMasterViewingKeyDeriver`

---

## Service Factory Pattern

Every operation follows the same two-step pattern:
```typescript
// Step 1: Build the function once (captures config + optional dependency overrides)
const operation = getOperationFunction({ client }, optionalDeps);

// Step 2: Call at runtime (reusable)
const result = await operation(/* runtime arguments */);
```

The `deps` argument accepts injectable overrides for RPC providers, key generators, and ZK provers — useful for testing or custom infra.

---

## ZK Provers

Mixer operations (UTXO create/claim) require a Groth16 prover.

```bash
pnpm add @umbra-privacy/web-zk-prover snarkjs
```

```typescript
import { getCreateReceiverClaimableUtxoFromPublicBalanceProver } from "@umbra-privacy/web-zk-prover";

const zkProver = getCreateReceiverClaimableUtxoFromPublicBalanceProver();
const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
  { client },
  { zkProver },
);
```

Note: `web-zk-prover@2.0.1` declares peer dep `@umbra-privacy/sdk@2.0.3` — version mismatch with sdk 4.0.0. Likely compatible, needs testing.

---

## Integration Architecture for Y-Vault

### What fits
| Feature | Where in app | SDK service | Complexity |
|---------|-------------|-------------|------------|
| **Shielded deposit** | `DepositFlow.tsx` — "Shield" toggle | `getPublicBalanceToEncryptedBalanceDirectDepositorFunction` | Medium |
| **Private balance view** | `/wallet` — "Shielded Balances" section | `getEncryptedBalanceQuerierFunction` | Low |
| **Compliance viewing grant** | Settings → Privacy panel | `getComplianceGrantIssuerFunction` / `RevokerFunction` | Low |
| **Key rotation** | Settings → Privacy → "Rotate keys" | Rotation functions | Low |
| **Withdraw to public** | Wallet → "Unshield" button | `getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction` | Low |

### What doesn't fit (skip for v1)
| Feature | Why |
|---------|-----|
| Anonymous P2P transfers (mixer) | Outside cockpit's value prop; complex UTXO + ZK prover |
| Private swaps | Umbra doesn't route swaps privately; Jupiter swaps are on-chain public |
| NFT privacy | SPL tokens only |

---

## Known Gotchas

### ✅ Resolved: Indexer URLs
Official indexer endpoints (from sdk.umbraprivacy.com/indexer/overview):
- **Devnet:** `https://utxo-indexer.api-devnet.umbraprivacy.com`
- **Mainnet:** `https://utxo-indexer.api.umbraprivacy.com`

Note: The indexer is primarily for UTXO/mixer operations (scanning, Merkle proofs). Encrypted balance operations (shield/unshield) may work without it.

### 🚨 Uses `@solana/kit` not `@solana/web3.js`
Our codebase uses `@solana/web3.js`. Umbra SDK is built on the newer `@solana/kit ^6.0.1`. Mixing is possible but requires an adapter for signer/transaction types. The signer from `getInMemorySigner()` is for scripts; for the app we need a `signer` from the wallet adapter, converted to Kit-compatible format.

### 🚨 Bundle weight — 16 MB
Must `dynamic(() => import('@umbra-privacy/sdk'), { ssr: false })`. Only load in the deposit flow and privacy settings pages. Never in the main bundle or SSR.

### ⚠️ Async MPC callbacks
Arcium MPC can fail and strand funds during deposit/withdraw. Recovery functions (`getStagedSolRecovererFunction`, `getStagedSplRecovererFunction`) must be exposed in the UI.

### ⚠️ WebSocket RPC required
`getUmbraClient()` requires `rpcSubscriptionsUrl` (WSS). We have `QUICKNODE_WSS_URL` and `RPCFAST_WSS_URL` in constants. Need to confirm one is functional.

### ⚠️ ZK prover peer dep mismatch
`@umbra-privacy/web-zk-prover@2.0.1` → peer dep `@umbra-privacy/sdk@2.0.3`. Current SDK is 4.0.0. Needs testing.

---

## Implementation Plan (Tiered)

### Tier 1 — Shielded Deposit + Balance View (~6 hours, targets the bounty)

**New files:**
- `src/services/UmbraService.ts` — lazy-imports SDK, wraps factories, wallet adapter ↔ Kit signer bridge
- `src/lib/hooks/useUmbra.ts` — client lifecycle, registration state, encrypted balance cache

**Modified files:**
- `src/components/features/DepositFlow.tsx` — "🛡️ Shield my deposit" toggle
- `src/app/(cockpit)/wallet/page.tsx` — "Shielded Balances" section
- `src/lib/constants.ts` — `UMBRA_INDEXER_URL`, `UMBRA_NETWORK` env vars

**Env vars:**
- `UMBRA_INDEXER_URL` — from Umbra team
- `UMBRA_NETWORK` — `devnet` | `mainnet` (default: `devnet`)

### Tier 2 — Compliance + Key Management (+4 hours)
- Settings → Privacy panel: viewing grants, key rotation, recovery buttons

### Tier 3 — Anonymous Transfers via Mixer (+10 hours, optional)
- Full UTXO create/scan/claim flow with browser-side ZK proving

---

## Hackathon Track Details

- **Track:** Umbra Privacy side track
- **Prize:** $5K / $3K / $2K cash
- **Link:** https://superteam.fun/earn/listing/umbra-side-track
- **Judging:** SDK integration depth (essential), Innovation, Technical quality, Commercial viability, UX, Completeness
- **Key insight:** Judges want to see "essential, not superficial" integration. Tier 1 (deposit + balance + compliance grant) should be sufficient if well-polished.

---

## Next Steps

1. **Get indexer URL** from Umbra team (Discord / Superteam track channel) — this is the only blocker.
2. Confirm devnet Arcium cluster is live.
3. Install SDK, build adapter layer for `@solana/kit` ↔ `@solana/web3.js`.
4. Ship Tier 1 (shielded deposit + balance view + compliance grant export).
5. Test end-to-end on devnet.
