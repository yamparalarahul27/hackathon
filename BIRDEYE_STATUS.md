# Birdeye Integration Status & Decision Doc

**Last updated:** 2026-04-20
**Context:** diagnosing the repeated `403 (Forbidden)` errors on the Market screen for `/api/birdeye/defi/token_trending` and `/api/birdeye/v2/tokens/new_listing`.

---

## What we confirmed

Health check at `/api/birdeye/health` returned:

```json
{
  "configured": true,
  "keyPreview": "8192…f449",
  "upstream": {
    "endpoint": "https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=1",
    "status": 403,
    "ok": false,
    "bodyPreview": "{\"status\":false,\"message\":\"Access Denied\"}"
  }
}
```

Interpretation:

- `configured: true` → `BIRDEYE_API_KEY` is set on the server, reaches the proxy.
- `keyPreview: "8192…f449"` → not empty, not a placeholder.
- `upstream.status: 403` with `"Access Denied"` → Birdeye itself is rejecting. Key is valid (would be `401 Unauthorized` otherwise) but the endpoint is not allowed for this plan.

Conclusion: **our API key is fine. Birdeye is gating `/defi/token_trending` behind a higher plan than ours.**

---

## Birdeye endpoints the app uses, by plan tier

| Endpoint | Code location | Starter tier? | Current status |
|---|---|---|---|
| `/defi/token_security` | `TokenSafetyScore`, new-listings enrichment | ✅ Yes | Works |
| `/defi/history_price` | `TokenChartService` (fallback #2) | ⚠️ Partial (some intervals) | Mostly works, falls back to Binance + GeckoTerminal otherwise |
| `/defi/token_trending` | `BirdeyeTrending` rail on `/cockpit/market` | ❌ Premium only | **403 Access Denied** |
| `/v2/tokens/new_listing` | `BirdeyeNewListings` rail on `/cockpit/market` | ❌ Premium only | **403 Access Denied** |

Net impact: 2 of the 3 Birdeye-driven rails on the Market screen never render on our plan. Safety score (on token detail pages) continues to work.

---

## Cross-check still worth running (optional)

Before assuming it's purely plan-tier, hit a known-Starter endpoint and see what it returns:

```
https://www.defitriangle.xyz/api/birdeye/defi/token_security?address=So11111111111111111111111111111111111111112
```

- JSON body with token-security data → confirms it's plan-tier only. Proceed with one of the options below.
- Also `403 Access Denied` → it's a domain/IP restriction on the key in Birdeye's dashboard. Fix by removing the restriction (or whitelisting the Vercel deployment origin), not by changing code.

---

## Two paths forward

### Option A — Swap Birdeye-premium rails for keyless alternatives (recommended)

Jupiter's `/tokens/v2/toptrending/24h` is free, keyless, and already integrated in `JupiterTokenListService` (we use `/toptraded` for the main Market table).

| Component today | Swap to | Effort |
|---|---|---|
| `BirdeyeTrending` → `/defi/token_trending` | `fetchTopTokens('toptrending', '24h')` — existing service, just a different enum | 5 min |
| `BirdeyeNewListings` → `/v2/tokens/new_listing` | Two candidates, pick one: | 20–45 min |
|    • Option A1: GeckoTerminal `/networks/solana/new_pools` (public, no key) | New service file + component refactor | |
|    • Option A2: Drop the rail entirely, keep trending + safety only | Delete component, remove from page | 5 min |
| `TokenSafetyScore` → `/defi/token_security` | **No change** — works on Starter | 0 |
| Chart fallback → `/defi/history_price` | **No change** — already falls back to Binance/GeckoTerminal on 403 | 0 |

Trade-offs:
- ✅ No plan upgrade, no new cost
- ✅ Jupiter data is Solana-native and updates in real time
- ✅ Removes the confusing visible error banner on `/cockpit/market`
- ⚠️ We lose the "via Birdeye" attribution on trending (was nice for the Birdeye Sprint 1 submission — check whether Birdeye attribution matters for the hackathon track)

### Option B — Upgrade Birdeye plan

- ✅ Zero code changes; just swap the `BIRDEYE_API_KEY` env value
- ✅ Keeps Birdeye attribution everywhere
- ⚠️ Paid — check Birdeye's current plan pricing
- ⚠️ Only makes sense if Birdeye is a track sponsor and the attribution matters for judging

### Option C — Defer / do nothing

- Market screen still works (Jupiter main table renders, safety score works on token pages)
- The two error banners on the Market screen stay visible until fixed
- Acceptable if attention is going elsewhere in the hackathon sprint

---

## What's already shipped to handle this gracefully

Already on `stage` + `main` as of commit `5454fdc`:

- `/api/birdeye/[...path]` returns a structured JSON envelope on upstream non-OK — `upstreamStatus`, `upstreamBodyPreview`, `path`, `hint` — so future 403s are self-diagnosing from the response alone.
- `BirdeyeTrending` and `BirdeyeNewListings` render a small visible error banner instead of silently hiding, so the state of the feature is never a mystery.
- `TokenSafetyScore` hides on error (deliberate — an error on a public page is worse than nothing for a nice-to-have card).
- `/api/birdeye/health` is the one-shot diagnostic if the state ever changes.

No code is currently blocking — the only user-visible issue is the two rails showing error banners instead of content.

---

## When you decide

- **Option A:** tell me "go A1" (Jupiter trending + GeckoTerminal new pools) or "go A2" (Jupiter trending only, drop new listings). I'll do it in one commit.
- **Option B:** upgrade the plan, swap the env var in Vercel, redeploy. No code change.
- **Option C:** nothing to do.
