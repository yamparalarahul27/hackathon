# Alarm — On-Chain Threat Detection Research

> Status: **Research phase**
> Goal: PagerDuty for DeFi — real-time monitoring, anomaly detection, automated response
> Inspiration: ZachXBT's investigation techniques + Drift $285M hack post-mortem
> Tagline: "We can't remove attack vectors, but we can track them better."

---

## Vision

**A monitoring layer for DeFi protocols and users.** Like PagerDuty for infrastructure, but for on-chain activity. Three layers:

1. **Detect** — real-time alerting on anomalous patterns
2. **Respond** — automated playbooks (pause, rate-limit, alert)
3. **Prevent** — routine stress tests and cascade simulations

### What this covers

| Layer | What | Example |
|-------|------|---------|
| **Governance/Admin monitoring** | Track durable nonces, approvals, authority changes on all admin paths | Alert when a protocol's upgrade authority is transferred |
| **Oracle monitoring** | Real-time deviation alerts when on-chain price diverges from aggregator | Alert when Pyth SOL price deviates >3% from Jupiter |
| **TVL monitoring** | Track protocol TVL changes, flag sudden drops | Alert when >10% TVL exits a vault in 1 hour |
| **Admin key monitoring** | Watch for multisig changes, timelock modifications, owner transfers | Alert when a protocol's admin key is modified |
| **Response playbooks** | Automated actions triggered by patterns | Pause deposits, rate-limit withdrawals, fire Telegram/Discord alert |
| **LLM risk simulations** | Routine stress tests across scenarios | "What happens if USDC depegs 5%? Who's underwater?" |
| **Cascade simulations** | Real-time dependency modeling | "When token X depegs, which vaults, LPs, and borrowers get liquidated?" |
| **Circuit breakers** | Standardised pause/limit mechanisms for protocols | Auto-pause vault when TVL drops >20% in 10 min |

---

---

## Monitoring Capabilities (Detailed)

### 1. Governance / Admin Path Monitoring

**Problem:** Most major hacks involve compromised admin keys, malicious governance proposals, or exploited upgrade authorities. The Drift $285M hack is a prime example.

**What to monitor:**
- **Durable nonces** — track nonce authority changes (attacker creates durable nonce to pre-sign exploit tx)
- **Program upgrade authority** — alert on any `BPFLoaderUpgradeable.SetAuthority` instruction
- **Multisig signer changes** — detect when Squads/Realms multisig member list changes
- **Timelock modifications** — flag changes to timelock duration or admin
- **Governance proposal creation** — alert on new proposals, especially ones that modify core parameters
- **Token approval spikes** — when a protocol address approves large amounts to unknown contracts

**Solana-specific:**
```
Monitor these instructions:
- BPFLoaderUpgradeable::SetAuthority (program upgrade)
- SPL Token::SetAuthority (token account authority)
- SPL Token::Approve (token approval)
- Realms/Squads governance instructions
```

### 2. Oracle Price Deviation Monitoring

**Problem:** Oracle manipulation is a top exploit vector. Attacker manipulates low-liquidity pool price → protocol reads stale/wrong price → attacker borrows/liquidates at fake price.

**What to monitor:**
- Compare Pyth on-chain price vs Jupiter aggregated price vs Birdeye
- Alert when deviation exceeds configurable threshold (e.g., >3%)
- Track price update frequency — alert when oracle stops updating (stale feed)
- Monitor switchboard / Pyth confidence intervals — narrow confidence + extreme price = manipulation

**Implementation:**
```typescript
// Poll every 30s
const pythPrice = await getPythPrice(mint);
const jupiterPrice = await getJupiterPrice(mint);
const deviation = Math.abs(pythPrice - jupiterPrice) / jupiterPrice;
if (deviation > 0.03) {
  fireAlarm('oracle_deviation', { mint, pythPrice, jupiterPrice, deviation });
}
```

### 3. TVL Change Monitoring

**Problem:** Sudden TVL drops often indicate exploit in progress or insider exit. By the time it's on Twitter, the damage is done.

**What to monitor:**
- Per-vault TVL snapshots every 5 min
- Alert on >10% drop in 1 hour
- Alert on >25% drop in 24 hours
- Track individual large withdrawals (whale vs exploit)
- Monitor deposit/withdrawal ratio (sudden withdrawal spike = red flag)

**Data source:** Kamino API `/kvaults/{address}/metrics` (we already poll this)

### 4. Admin Key Modification Monitoring

**Problem:** Compromised admin keys are the #1 root cause of large hacks. If the admin key changes and nobody on the team did it, the protocol is already compromised.

**What to monitor:**
- Program upgrade authority for all protocols user tracks
- Multisig membership changes
- Fee recipient address changes
- Mint authority changes (can the attacker inflate supply?)
- Freeze authority changes

### 5. Automated Response Playbooks

**Problem:** Human response time to exploits is 10-60 minutes. Automated responses can act in seconds.

**Playbook types:**

| Trigger | Response | Scope |
|---------|----------|-------|
| Oracle deviation >5% | Pause deposits to affected vaults | Per-vault |
| TVL drop >20% in 10 min | Rate-limit withdrawals, fire Telegram alert | Per-protocol |
| Admin key change detected | Immediately alert all channel, recommend withdrawal | Critical |
| Known exploit address interaction | Block UI interaction, warn users | Per-address |
| Flash loan detected on protocol | Log + alert, don't block (many legitimate uses) | Informational |

**For DeFi Triangle MVP:** We don't control protocols, so our "response" is:
- Push notification to user's alarm feed
- Telegram/Discord webhook fire
- UI banner warning on affected vault/token pages
- "Emergency withdraw" CTA if user has positions in affected protocol

### 6. LLM-Driven Risk Simulations

**Problem:** Economic exploits (depeg cascades, liquidation spirals) aren't code bugs — they're mechanism failures that can be stress-tested in advance.

**What to simulate:**
- "What if USDC depegs 5%? Which Kamino vaults lose value? Who gets liquidated on klend?"
- "What if SOL drops 40% in 1 hour? What's the cascade?"
- "What if this vault's LP token depegs? Who's underwater?"

**How:** Feed current on-chain state (positions, collateral, prices) into an LLM with economic modeling prompts. Run nightly or on-demand.

**Output:** Risk score per vault/position + "worst case" scenario description.

### 7. Cascade Simulation (Real-Time)

**Problem:** When token X depegs, the blast radius hits multiple protocols simultaneously. No one tool shows the full cascade.

**What to model:**
```
Token X depegs 10%
  → Vault A (holds X as LP) loses 8% TVL
    → Users with Vault A shares as collateral on klend face liquidation
      → Liquidation selling of Vault A shares further depresses price
        → Cascade continues...
```

**Data needed:**
- All vault compositions (which tokens in each vault)
- All lending positions (who borrowed against what)
- All LP positions (who provides liquidity where)
- Current prices + simulated prices

**For MVP:** Show dependency graph between user's positions. "If SOL drops 30%, these 3 of your positions are at risk."

### 8. Circuit Breakers

**Problem:** Protocols lack standardized pause mechanisms. When a hack is detected, there's no "emergency stop" button that works consistently.

**What DeFi Triangle can offer:**
- **UI-level circuit breakers** — hide "Deposit" button when alarm is active for a vault
- **User-level alerts** — "This vault triggered 3 alarms in the last hour. Proceed with caution."
- **Recommended action** — "Based on detected anomalies, consider withdrawing from Vault X"

**What protocols should implement (advocacy):**
- Standardized pause function callable by multisig
- Rate limiting on withdrawals during detected anomalies
- Automatic oracle fallback when primary deviates
- Timelock on parameter changes (minimum 24h)

---

## What ZachXBT Does (Post-Hack)

ZachXBT is the most prolific on-chain investigator. His public methodology, reverse-engineered from his investigations:

### Investigation Techniques

| Technique | What he does | Data source |
|-----------|-------------|-------------|
| **Fund flow tracing** | Follows stolen funds hop-by-hop across wallets | Block explorers, custom scripts |
| **Wallet clustering** | Groups related wallets by shared funding source, timing, or behavior | On-chain graph analysis |
| **Mixer detection** | Flags deposits/withdrawals from Tornado Cash, Railgun, etc. | Known mixer contract addresses |
| **Bridge tracking** | Traces cross-chain movements (Solana → ETH → BSC) | Bridge contract events |
| **CEX deposit identification** | Traces to centralized exchange deposit addresses | Known CEX hot wallets |
| **Social engineering correlation** | Links on-chain activity to social media (fake profiles, copied projects) | OSINT + on-chain |
| **Time pattern analysis** | Correlates transaction timing with known events (governance votes, announcements) | Timestamp analysis |
| **Approval chain analysis** | Maps token approval → transfer → bridge → mixer → CEX flow | Approval events |

### Common Post-Hack Patterns He Exposes

```
Exploit tx → Multiple hops (3-10 intermediate wallets) → Mixer or Bridge
                                                           ↓
                                                     Cross-chain transfer
                                                           ↓
                                                     More hops → CEX deposit
                                                     (attempt to cash out)
```

---

## Applying Post-Hack Patterns to Pre-Hack Detection

**Core insight:** The preparation phase of most hacks leaves detectable traces. Attackers rarely execute cold — they test, fund, and stage.

### Detectable Pre-Hack Signals (Solana-focused)

| Signal | What it looks like | Severity | False positive rate |
|--------|-------------------|----------|-------------------|
| **New contract deployment + immediate large interaction** | Unknown program deployed, immediately called with significant funds | HIGH | Medium |
| **Program upgrade authority change** | Protocol's upgrade authority transferred to new address | CRITICAL | Low |
| **Unusual token approvals** | Wallet approves max amount to an unverified contract | HIGH | High |
| **Large sudden liquidity removal** | >10% of pool TVL withdrawn in single tx or rapid sequence | HIGH | Medium |
| **Known exploit address funding** | Fresh wallet funded from address linked to previous exploits | CRITICAL | Low |
| **Rapid wallet creation + funding chain** | Multiple new wallets created and funded in sequence (staging) | MEDIUM | High |
| **Bridge-in from flagged source** | Funds arrive via bridge from mixer or known bad address | HIGH | Medium |
| **Abnormal instruction patterns** | Program called with unusual instruction data or account combination | MEDIUM | High |
| **Flash loan borrow without repay in same tx** | Flash loan taken but used to manipulate before repay | HIGH | Low (very specific) |
| **Oracle price deviation** | Token price on-chain diverges >5% from aggregator price | HIGH | Medium |
| **Governance token accumulation** | Single address rapidly acquiring governance tokens before a vote | MEDIUM | Medium |
| **Account authority transfer to new wallet** | Token account or program authority moved to fresh address | HIGH | Low |

### Signal Confidence Tiers

**Tier 1 — High confidence (rarely false):**
- Program upgrade authority change on a known protocol
- Known exploit address interaction
- Flash loan + oracle manipulation in same tx

**Tier 2 — Medium confidence (some false positives, worth alerting):**
- Large sudden liquidity removal (could be legitimate withdraw)
- Bridge-in from mixer (could be privacy-conscious user)
- New contract + large first interaction

**Tier 3 — Low confidence (many false positives, useful for pattern building):**
- Rapid wallet creation chains
- Unusual instruction patterns
- Token approval spikes

---

## Architecture for DeFi Triangle

### Phase 1: Address Watchlist + Activity Monitor

**What:** User adds addresses to a watchlist. System monitors for activity and scores abnormality.

```
User adds address → Helius Webhooks subscribe to address
                         ↓
                    Transaction arrives
                         ↓
                    Parse + score against rules
                         ↓
                    Score > threshold?
                    ├── Yes → Push alarm to UI
                    └── No → Log silently
```

**Data sources we already have:**
- Helius RPC — transaction parsing, account data
- Helius Webhooks — real-time push notifications for address activity
- Birdeye token_security — token safety scoring
- Jupiter Shield — scam token detection

**New data sources needed:**
- Known exploit address database (community-maintained lists)
- Mixer contract address list (Tornado Cash, Railgun known addresses)
- CEX hot wallet address list (Binance, Coinbase, etc.)
- Bridge contract addresses per chain

### Phase 2: Automated Pattern Detection

**Rules engine** — configurable rules that score each transaction:

```typescript
interface AlarmRule {
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  check: (tx: ParsedTransaction, context: AddressContext) => AlarmResult | null;
}

// Example rules:
const rules: AlarmRule[] = [
  {
    name: 'large_transfer_out',
    description: 'Outgoing transfer > $10K from watched address',
    severity: 'warning',
    check: (tx, ctx) => {
      // Check if any transfer instruction moves > $10K worth
    },
  },
  {
    name: 'new_program_interaction',
    description: 'Watched address interacts with previously unseen program',
    severity: 'info',
    check: (tx, ctx) => {
      // Check program IDs against known interaction history
    },
  },
  {
    name: 'authority_change',
    description: 'Token account authority transferred',
    severity: 'critical',
    check: (tx, ctx) => {
      // Check for SetAuthority instruction
    },
  },
  {
    name: 'mixer_interaction',
    description: 'Funds sent to or received from known mixer',
    severity: 'critical',
    check: (tx, ctx) => {
      // Check destination against mixer address list
    },
  },
];
```

### Phase 3: Address Graph + Clustering

**Build a relationship graph** from watched addresses:

```
Watched Address A ──funds──→ Address B ──funds──→ Address C
                                                      ↓
                                                  Bridge to ETH
                                                      ↓
                                                  Tornado Cash

Alarm: "Address A is 2 hops from a mixer deposit"
```

---

## Implementation Plan for DeFi Triangle

### What to build (MVP — ~2 days)

| Component | File | What it does |
|-----------|------|-------------|
| **AlarmService** | `src/services/AlarmService.ts` | Subscribe to Helius webhooks, parse transactions, score against rules |
| **AddressWatchlist** | `src/lib/hooks/useAlarmWatchlist.ts` | Supabase-backed watchlist of addresses user wants to monitor |
| **AlarmRules** | `src/lib/alarm-rules.ts` | Configurable rule definitions |
| **AlarmFeed** | `src/components/features/AlarmFeed.tsx` | Real-time feed of alarm events |
| **AlarmPage** | `src/app/cockpit/alarm/page.tsx` | Full page: watchlist management + alarm feed + address graph |
| **API Route** | `src/app/api/alarm/webhook/route.ts` | Receives Helius webhook POSTs, processes, stores |

### Data flow

```
1. User adds address to watchlist (UI)
2. Server registers Helius webhook for that address
3. Helius sends POST to /api/alarm/webhook on every tx
4. Webhook handler:
   a. Parse transaction (instructions, accounts, amounts)
   b. Run through alarm rules
   c. If alarm triggered → store in Supabase + push to UI
5. AlarmFeed component polls or uses SSE for real-time updates
```

### Helius Webhook Setup

```typescript
// Register webhook for an address
const webhook = await fetch('https://api.helius.dev/v0/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${HELIUS_API_KEY}`,
  },
  body: JSON.stringify({
    webhookURL: 'https://defitriangle.xyz/api/alarm/webhook',
    transactionTypes: ['Any'],
    accountAddresses: [watchedAddress],
    webhookType: 'enhanced',
  }),
});
```

### Supabase Schema

```sql
-- Watched addresses
create table alarm_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_wallet text not null,
  watched_address text not null,
  label text,
  created_at timestamptz default now(),
  unique(user_wallet, watched_address)
);

-- Alarm events
create table alarm_events (
  id uuid primary key default gen_random_uuid(),
  watched_address text not null,
  tx_signature text not null,
  rule_name text not null,
  severity text not null,
  description text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
```

---

## Known Address Databases

### Sources for labeling

| Source | What it provides | Access |
|--------|-----------------|--------|
| **Helius DAS** | Account labels (exchange, program, NFT) | Free with RPC |
| **Solana FM** | Address labels + program registry | Free API |
| **Arkham Intelligence** | Entity attribution (CEX, DEX, fund wallets) | Paid API |
| **Elliptic / Chainalysis** | Compliance risk scoring | Enterprise (expensive) |
| **Community lists** | Known scam/exploit addresses | GitHub repos, curated |

### What we can build without paid APIs

- **Known CEX hot wallets** — public, well-documented (Binance, Coinbase, FTX remnants, etc.)
- **Known mixer contracts** — Tornado Cash (ETH), Railgun, etc. Solana equivalents if they exist
- **Known bridge contracts** — Wormhole, Allbridge, deBridge, LiFi
- **Known exploit addresses** — from rekt.news, SlowMist, PeckShield public reports
- **Program upgrade authorities** — query on-chain for any program's upgrade authority

---

## Competitive Landscape

| Product | What it does | Solana? | Free? |
|---------|-------------|---------|-------|
| **Forta Network** | Bot-based threat detection, community agents | Partial | Free to query |
| **Tenderly** | EVM simulation + alerts | No Solana | Paid |
| **Cyvers** | Real-time hack detection + alerts | Multi-chain | Enterprise |
| **Hypernative** | Pre-exploit detection | Multi-chain | Enterprise |
| **Blowfish** | Transaction simulation + risk scoring | Solana ✓ | Free tier |
| **GoPlus** | Token security + phishing detection | Solana ✓ | Free API |

**Our angle:** None of these are user-facing DeFi cockpit features. They're B2B security infra. DeFi Triangle can be the **consumer-facing alarm** — "your personal ZachXBT watching your addresses."

---

## Edge Cases & False Positive Management

### Expected false positives

- Large legitimate withdrawals (whale moving funds between own wallets)
- DEX aggregator routing through many hops (looks like laundering)
- Airdrop claims hitting many wallets (looks like wash trading)
- Legitimate bridge usage (not all bridge activity is suspicious)

### Mitigation

- **Allow user to dismiss** — "Not suspicious" button per alarm
- **Learn from dismissals** — reduce rule weight for that address
- **Whitelist known addresses** — user can mark addresses as trusted
- **Severity thresholds** — user configures minimum severity for notifications

---

## Open Questions

1. **Helius webhooks** — free tier allows how many? May need to limit watchlist size.
2. **Real-time vs polling** — webhooks are real-time but need a server endpoint. SSE or WebSocket for pushing to UI?
3. **Address graph depth** — how many hops deep to trace? 2 hops is manageable, 5+ gets expensive.
4. **Cross-chain** — Solana only for MVP, or include ETH bridge endpoints?
5. **Privacy** — watchlist is user-specific (Supabase RLS), but alarm events could reveal user's monitoring targets.
6. **Notification channels** — UI only, or also Telegram/Discord/email?

---

## Recommended MVP Scope

**Ship in ~2 days:**

1. **Address watchlist** — add/remove addresses with labels, stored in Supabase
2. **Activity feed** — poll Helius for recent transactions on watched addresses (simpler than webhooks for MVP)
3. **5 alarm rules:**
   - Large transfer out (> configurable threshold)
   - New program interaction (never seen before)
   - Authority change (SetAuthority instruction)
   - Interaction with known high-risk address
   - Rapid sequential transactions (> 5 in 60s from same address)
4. **Alarm feed UI** — chronological list with severity badges, tx links, rule descriptions
5. **Basic stats** — total alarms, alarms by severity, most active watched address

**Defer to v2:**
- Helius webhooks (real-time push)
- Address graph visualization
- Cross-chain tracing
- Notification channels (Telegram/Discord)
- ML-based anomaly detection
- Known exploit address database
