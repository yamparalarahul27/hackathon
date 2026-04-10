@AGENTS.md

# Y-Vault — Claude Code Project Instructions

## STRICT RULES (apply to every session, every agent)

### 1. Scalability-First Rule
**ALWAYS choose the scalable solution over the quick fix.**
Before implementing ANY solution, ask: "What happens when there are 100x more of these?"

- Token icons → Use CDN URL from mint address (NOT local image files)
- Data → Use APIs/SDKs (NOT hardcoded lists that break for new entries)
- UI → Handle empty/missing/unknown states with graceful fallbacks
- Config → Use environment variables (NOT hardcoded values)
- If a local/static approach is tempting, flag it and suggest the scalable alternative

### 2. Mobile 320px Test Rule
**Every UI change MUST work at 320px viewport width.**
After ANY UI change, verify it won't break on small screens.

- Use responsive Tailwind: base for mobile, `sm:` for 640px, `lg:` for 1024px
- Financial numbers (`.data-lg`, `.data-md`): MUST scale down on mobile
- Grids: `grid-cols-1` on mobile, expand on larger screens
- Tables: hide non-critical columns with `hidden md:table-cell`
- No fixed large font sizes without mobile breakpoints
- Cards stack vertically on mobile, no horizontal overflow

### 3. Design System Compliance
Follow `DESIGN.md` strictly. Do NOT deviate from the Asgard-based design system.

---

## Project Overview

**Y-Vault** is a fiat-to-DeFi yield platform for the Colosseum Frontier Hackathon (deadline: May 12, 2026).
Users pay with fiat (Dodo Payments) → receive USDC → deposit into Kamino LP vaults → track yield with analytics dashboard.
Privacy option via Umbra SDK. Smart routing via Jupiter Swap API.

**Design system:** Asgard UI — see `DESIGN.md` for full spec.
- Light base (`#f1f5f9`), white cards, dark text — light-first theme
- Dark gradient hero section for contrast
- Compact 48px navbar, light bottom bar
- `rounded-sm` (4px) everywhere
- Geist Mono for headings, Geist Pixel Grid for numbers, IBM Plex Sans for body

**Full project docs:** See `DEXPILOT.md` for all track details, research, build status, execution plan.

## Token Icons

Use Solana token-list CDN — scalable for any token:
```
https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/{MINT_ADDRESS}/logo.png
```
Helper: `src/lib/tokenIcons.ts` — `getTokenIcon(mint)` with fallback

## Colosseum Copilot

Env vars in `.env.local`. API reference:
```bash
export COLOSSEUM_COPILOT_API_BASE="$COLOSSEUM_COPILOT_API_BASE"
export COLOSSEUM_COPILOT_PAT="$COLOSSEUM_COPILOT_PAT"

# Search projects
curl -s -X POST "$COLOSSEUM_COPILOT_API_BASE/search/projects" \
  -H "Authorization: Bearer $COLOSSEUM_COPILOT_PAT" \
  -H "Content-Type: application/json" \
  -d '{"query": "your query", "limit": 10}'
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
src/lib/tokenIcons.ts                 — Token icon CDN helper
src/lib/lp-types.ts                   — Type definitions
src/lib/supabaseClient.ts             — Supabase client
src/components/features/              — VaultDashboard, VaultExplorer, DepositFlow, YieldAnalytics
src/components/ui/                    — Card, Button, Pill, StatusDot
DESIGN.md                             — Asgard UI design system spec
DEXPILOT.md                           — Full project documentation
```
