@AGENTS.md

# Y-Vault — Claude Code Project Instructions

## Project Overview

**Y-Vault** is a fiat-to-DeFi yield platform for the Colosseum Frontier Hackathon (deadline: May 12, 2026).
Users pay with fiat (Dodo Payments) → receive USDC → deposit into Kamino LP vaults → track yield with analytics dashboard.
Privacy option via Umbra SDK. Smart routing via Jupiter Swap API.

**Design system:** Asgard UI — see `DESIGN.md` for full spec. Institutional DeFi terminal aesthetic.
**Full project docs:** See `DEXPILOT.md` for all track details, research, build status, execution plan.

## Colosseum Copilot

Env vars in `.env.local`. API reference:
```bash
# Set env first
export COLOSSEUM_COPILOT_API_BASE="$COLOSSEUM_COPILOT_API_BASE"
export COLOSSEUM_COPILOT_PAT="$COLOSSEUM_COPILOT_PAT"

# Search projects
curl -s -X POST "$COLOSSEUM_COPILOT_API_BASE/search/projects" \
  -H "Authorization: Bearer $COLOSSEUM_COPILOT_PAT" \
  -H "Content-Type: application/json" \
  -d '{"query": "your query", "limit": 10}'

# Search archives
curl -s -X POST "$COLOSSEUM_COPILOT_API_BASE/search/archives" \
  -H "Authorization: Bearer $COLOSSEUM_COPILOT_PAT" \
  -H "Content-Type: application/json" \
  -d '{"query": "your query", "limit": 5}'
```

## Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS v4, Recharts
Kamino kliquidity-sdk, dodopayments, @solana/web3.js, @jup-ag/wallet-adapter, Jupiter Price API, Supabase

## Key Files

```
src/app/providers.tsx                 — Jupiter Wallet Adapter (wraps app)
src/app/page.tsx                      — Main app with 4 tabs
src/services/KaminoVaultService.ts    — Real Kamino SDK
src/services/DodoPaymentService.ts    — Dodo Payments checkout
src/services/JupiterSwapService.ts    — Jupiter Swap API
src/services/TokenPriceService.ts     — Jupiter Price API
src/services/KaminoDepositService.ts  — Kamino vault deposit tx builder
src/services/ServiceFactory.ts        — Service initialization
src/lib/hooks/useWalletConnection.ts  — Wallet state hook
src/lib/hooks/useKaminoVaults.ts      — Vault data + mock fallback
src/lib/lp-types.ts                   — Type definitions
src/lib/supabaseClient.ts             — Supabase client
src/components/features/              — VaultDashboard, VaultExplorer, DepositFlow, YieldAnalytics
src/components/ui/                    — Card, Button, Pill, StatusDot (Asgard styled)
DESIGN.md                             — Asgard UI design system spec
DEXPILOT.md                           — Full project documentation
```

## Asgard UI Quick Ref

```
Background:     bg-[#0F1521]
Surface/Card:   bg-[#1A2332]  border-white/8  rounded-lg
Primary CTA:    bg-[#3B7DDD]  hover:bg-[#2B6BC4]
Success:        text-[#10B981]
Danger:         text-[#EF4444]
Warning:        text-[#F59E0B]
Text primary:   text-white
Text secondary: text-[#9CA3AF]
Text muted:     text-[#6B7280]
Fonts:          Satoshi (headings), IBM Plex Sans (body), IBM Plex Mono (data/numbers)
```

Do NOT use: glassmorphism, neon glows, rounded-none, gradients on cards, serif fonts.
