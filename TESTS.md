# Test Cases — DeFi Triangle

> Covers all integrations. Each section has **Best Case** (happy path) and **Worst Case** (failure + edge cases).

---

## 1. Landing Page (`/`)

### Best Case
- [ ] Page loads with gradient hero, product name, one-liner
- [ ] Counter fetches initial count via `GET /api/interested` on mount
- [ ] User clicks "I'm Interested" → counter increments, button locks to "Interested" state
- [ ] "View Log" button navigates to `/log`
- [ ] "Connect with the Engineer" link opens `x.com/yamparalarahul1` in new tab

### Worst Case
- [ ] Supabase unavailable → counter falls back to in-memory (shows 0, still increments)
- [ ] Network error on fetch → counter shows 0, no crash
- [ ] User refreshes after clicking → button stays disabled (localStorage flag persists)
- [ ] Multiple rapid clicks → counter increments only once (IP fingerprint dedup on server)
- [ ] Same visitor on different browser → server-side IP dedup prevents double count

---

## 2. Project Log (`/log`)

### Best Case
- [ ] Entries render in reverse chronological order (latest first)
- [ ] Each day shows 3 tagged entries: Added (green), Fixed (amber), Learned (blue)
- [ ] Day numbers count correctly (Day 8 = latest, Day 1 = oldest)
- [ ] Timeline dot on latest entry is blue, others are gray
- [ ] Date formatting is consistent (e.g., "Wed, Apr 17")

### Worst Case
- [ ] Page renders at 320px without horizontal overflow
- [ ] Hero text has proper padding on mobile (no edge-sticking)
- [ ] No duplicate dates in the entries array

---

## 3. Wallet Connection

### Best Case
- [ ] "Connect Wallet" button opens Jupiter wallet modal
- [ ] User selects Phantom/Solflare → connection established
- [ ] Navbar shows green dot + truncated address (first 4 + last 4 chars)
- [ ] Clicking wallet chip opens dropdown: Connected label, full address, Copy, Switch (disabled), Disconnect
- [ ] Copy button → clipboard write, "Copied!" with green check for 1.5s
- [ ] Disconnect → wallet state cleared, UI reverts to "Connect Wallet"

### Worst Case
- [ ] No wallet installed → `hasInstalledWallets = false`, warning text shown
- [ ] User rejects connection → modal closes, no error, stays disconnected
- [ ] Wallet doesn't support `signTransaction` → `canSignTransactions = false`, swap/deposit disabled
- [ ] Clipboard API denied (insecure context) → copy fails silently, no crash
- [ ] Wallet connection drops mid-session → UI should handle gracefully

---

## 4. Swap — Jupiter Ultra (`/cockpit/swap`)

### Best Case
- [ ] Default tokens seed on mount via Ultra `/search` (USDC input, SOL output)
- [ ] Token search combobox: typing "BONK" returns results with icon, symbol, name, verified badge, price
- [ ] Search debounces at 250ms (no excessive API calls)
- [ ] User enters amount → clicks "Get Quote" → Ultra `/order` returns quote
- [ ] Quote details show: price impact %, route (e.g., "Raydium → Orca"), slippage, priority fee
- [ ] Shield check runs in parallel: output token's `/shield` warnings display in banner
- [ ] User clicks "Swap" → wallet signs → Ultra `/execute` broadcasts → Solscan link shown
- [ ] Success message: "Swap landed via Jupiter Ultra"
- [ ] Footer badge: "Protected by Jupiter Ultra" with shield icon
- [ ] Flip button swaps input/output tokens and clears amount + quote

### Worst Case
- [ ] Same token selected for both sides → error "Select two different tokens"
- [ ] Amount is 0 or empty → "Get Quote" button disabled
- [ ] Jupiter `/order` fails → error "Unable to fetch quote"
- [ ] Shield returns `critical` severity → "Blocked by Shield", Execute button disabled
- [ ] Shield returns `warning` severity → yellow banner, swap still allowed
- [ ] Shield API times out → no warnings shown, swap proceeds (catch silences error)
- [ ] Wallet not connected → clicking "Swap" opens wallet modal instead
- [ ] Wallet rejects signing → error "Swap failed", user can retry
- [ ] `/execute` fails (tx dropped) → error from Jupiter surfaced
- [ ] Order missing `transaction` or `requestId` → error "Order is missing a transaction"
- [ ] Token search returns 0 results → "No tokens match" message
- [ ] Token search API fails → error message in dropdown

---

## 5. Wallet Balances — Jupiter Ultra Holdings (`/cockpit/wallet`)

### Best Case
- [ ] Connected wallet → Ultra `/holdings/{address}` returns token list
- [ ] Each row: icon, symbol, name, amount (uiAmount), USD value
- [ ] Total estimated value shown in header
- [ ] Metadata enriched via Ultra `/search` (batch comma-separated mints)
- [ ] Zero-balance holdings filtered out
- [ ] Shield button visible on each non-frozen row (when Umbra available)
- [ ] `onMintsLoaded` callback fires → ShieldedBalances gets real mints

### Worst Case
- [ ] Ultra `/holdings` fails → error "Unable to fetch balances"
- [ ] Wallet has 0 tokens → "No tokens in this wallet" message
- [ ] Metadata `/search` fails → rows render with truncated mint instead of symbol (best-effort)
- [ ] Token icon fails to load → hidden (visibility:hidden), no broken image
- [ ] Frozen token → "Frozen" badge shown, shield button hidden
- [ ] USD price unavailable → "Price unavailable" text instead of dollar amount

---

## 6. Shielded Balances — Umbra Privacy (`/cockpit/wallet`)

### Best Case
- [ ] Umbra available (`indexerUrl` + `rpcUrl` + `wssUrl` configured) → section visible
- [ ] User not registered → "Enable Privacy" button shown
- [ ] User clicks "Enable Privacy" → Umbra initializes → registers with `{ confidential: true, anonymous: false }`
- [ ] Registration succeeds → "Registered" status with green shield icon
- [ ] Encrypted balances queried for all publicMints → amounts displayed
- [ ] User clicks "Unshield" on a token → encrypted → public transfer succeeds
- [ ] Balance refreshes after shield/unshield operations

### Worst Case
- [ ] Umbra not configured (no indexer URL) → section shows "Privacy features require Umbra configuration"
- [ ] WSS RPC not set and no QuickNode/RPCFast WSS → Umbra client init fails
- [ ] Registration fails (network/MPC error) → error displayed, dismiss button works
- [ ] `publicMints` is empty → no balance queries made (nothing to show)
- [ ] Query returns 0 balance for all mints → empty encrypted balance list
- [ ] Unshield fails (insufficient encrypted balance) → error from blockchain surfaced
- [ ] `deferMasterSeedSignature: true` prevents wallet popup on init (verified)

---

## 7. Privacy Panel — Compliance & Recovery (`/cockpit/wallet`)

### Best Case
- [ ] Compliance grant issue: enter auditor address → click "Grant" → succeeds
- [ ] Compliance grant revoke: enter address → click "Revoke" → succeeds
- [ ] Recovery form: enter mint + amount (raw base units) + destination → click "Recover Staged SPL" → succeeds
- [ ] Success messages shown for each action

### Worst Case
- [ ] Empty auditor address → "Grant" button disabled
- [ ] Empty recovery fields → "Recover" button disabled
- [ ] Wallet doesn't support `signMessage` → compliance grant fails with "Wallet does not support message signing"
- [ ] Recovery with invalid mint/amount → blockchain error surfaced
- [ ] MPC callback never completed → funds stuck, recovery needed (this is the use case for the form)

---

## 8. NFT Gallery — Helius DAS (`/cockpit/wallet`)

### Best Case
- [ ] Connected wallet → `GET /api/nft/holdings?wallet=...` returns NFTs (up to 1000)
- [ ] Gallery shows responsive grid (2-6 columns depending on screen width)
- [ ] Each card: image (lazy-loaded), name, collection name, cNFT badge if compressed
- [ ] Collection filter pills: "All (42)", "Mad Lads (8)", "cNFTs (4)" — sorted by count
- [ ] Search filters by name, symbol, or collection name (case-insensitive)
- [ ] Click card → detail modal opens with: full image, description, attributes grid, creators with share % and verified badge, royalty %, mint (copyable), owner (Solscan link), collection, interface, edition, primary sale status
- [ ] Marketplace links: Magic Eden, Tensor, Solscan (open in new tab)
- [ ] Compression section shows tree, leaf ID, seq for cNFTs
- [ ] Modal closes on Escape, outside click, or X button
- [ ] Body scroll locked while modal open

### Worst Case
- [ ] Helius RPC not configured → error shown
- [ ] Wallet has 0 NFTs → "No NFTs found in this wallet"
- [ ] Network timeout (15s limit) → error message
- [ ] NFT missing image → "No image" placeholder
- [ ] NFT missing name → "Unknown NFT" fallback
- [ ] NFT missing collection → no collection pill, no collection name on card
- [ ] Collection name resolution fails (batched `getAssets` error) → falls back to truncated mint
- [ ] Filter active + search returns 0 → "No NFTs match this filter"
- [ ] Image load error → `onError` hides image element
- [ ] 1000+ NFTs → pagination caps at 1000 (MAX_PAGES × PAGE_LIMIT)

---

## 9. Vault Dashboard — Kamino (`/cockpit/vault/kamino`)

### Best Case
- [ ] Connected wallet → `GET /api/kamino/overview?wallet=...` returns positions
- [ ] Hero stats: Portfolio Value, Positions count, Avg APY
- [ ] Position cards: vault name, token pair, APY (green), current value, shares
- [ ] Strategy filter pills work (filter by vault strategy type)
- [ ] "View all" link navigates to vault explorer

### Worst Case
- [ ] API timeout → error banner via `RpcErrorBanner`
- [ ] Wallet has 0 positions → "Explore Vaults" prompt shown
- [ ] RPC failure → error message, empty state
- [ ] Auto-refresh every 30 min → interval cleared on unmount

---

## 10. Vault Explorer (`/cockpit/vault/kamino/explore`)

### Best Case
- [ ] Loads all active K-Vaults from API
- [ ] Sortable table: vault name, token, APY, TVL, 24h volume/fees
- [ ] Search by vault name or token symbol
- [ ] Strategy pills filter vaults by type
- [ ] Click vault row → navigates to deposit flow with `?vault=address`

### Worst Case
- [ ] API timeout → error
- [ ] Vaults with TVL < $1 or 0 holders → filtered out (not shown)
- [ ] Unknown token symbol → truncated mint shown
- [ ] Sort + search + filter all compose correctly (no stale state)

---

## 11. Deposit Flow (`/cockpit/vault/kamino/deposit`)

### Best Case
- [ ] Vault pre-selected via `?vault=address` query param
- [ ] User enters decimal amount → estimated USD value + yearly yield shown
- [ ] "Deposit" → Kamino API builds tx → wallet signs → RPC confirms → Solscan link

### Worst Case
- [ ] Wallet not connected → "Connect Wallet" shown
- [ ] Amount is 0 → button disabled
- [ ] Wallet rejects signing → error, user can retry
- [ ] Kamino API returns error → error surfaced
- [ ] Transaction fails on-chain → error shown
- [ ] RPC not mainnet → deposit service may fail (mainnet-only)

---

## 12. Withdraw Flow (`/cockpit/vault/kamino/withdraw`)

### Best Case
- [ ] Vault pre-selected via `?vault=address`
- [ ] User enters share amount → estimated token output shown (shares × share price)
- [ ] "Withdraw" → Kamino API builds tx → wallet signs → RPC confirms → Solscan link

### Worst Case
- [ ] User has no positions → empty vault dropdown
- [ ] Amount exceeds share balance → error or disabled
- [ ] Wallet not connected → prompt
- [ ] Withdraw service fails → error shown

---

## 13. Market Page (`/cockpit/market`)

### Best Case
- [ ] Token list loads with CoinGecko data: name, price, 24h change, market cap, volume
- [ ] Category filter pills: All, DeFi, Meme, Stablecoin
- [ ] Sort by any column (click header toggles asc/desc)
- [ ] Search by name or symbol
- [ ] Click row → navigates to `/cockpit/token/[mint]`

### Worst Case
- [ ] CoinGecko API fails → error message
- [ ] CoinGecko rate limited (30 req/min) → retried or cached
- [ ] Unknown token in list → icon fallback chain works

---

## 14. Token Detail (`/cockpit/token/[mint]`)

### Best Case
- [ ] Header: token icon, name, current price, 24h change (green/red)
- [ ] Market stats: volume, market cap, FDV, circulating supply
- [ ] Price oracle comparison: Jupiter, Binance, Birdeye, CoinGecko with spread %
- [ ] Chart renders with multi-source fallback: Binance → Birdeye → GeckoTerminal
- [ ] DEX pairs section shows top trading pairs (DexScreener)
- [ ] Vaults section shows Kamino vaults containing this token
- [ ] Token info: external links (CoinGecko, Solscan, Jupiter swap)

### Worst Case
- [ ] Unknown/invalid mint → error or empty state
- [ ] All chart sources fail → "No chart data"
- [ ] CoinGecko unavailable → market stats show "—"
- [ ] DexScreener fails → pairs section shows error
- [ ] Birdeye API key not set → fallback to GeckoTerminal
- [ ] Very small price (< $0.001) → displays with enough decimal precision

---

## 15. Lending Market (`/cockpit/lend/kamino`)

### Best Case
- [ ] `GET /api/kamino/lend` returns lending reserves
- [ ] Hero stats: Total Supplied, Total Borrowed, Reserve Count
- [ ] Table: asset, price, supply USD, supply APY (green), borrow USD, borrow APY (red), utilization %
- [ ] Sort by any column, search by symbol
- [ ] Click asset → navigates to token detail page
- [ ] Auto-refresh every 60s

### Worst Case
- [ ] Kamino Main Market unavailable → "Failed to load Kamino Main Market"
- [ ] RPC fails → error banner
- [ ] No reserves → "No reserves found"
- [ ] Invalid reserve data → filtered out (logged, not shown)

---

## 16. DEX Analytics (`/cockpit/dex/deriverse`)

### Best Case
- [ ] User connects wallet → devnet trades fetched via `GET /api/dex/deriverse/trades?wallet=...`
- [ ] PnL card: gross/net PnL with filter context
- [ ] Performance section: win rate, best/worst trade, ROI
- [ ] Trade table: entry/exit details, amounts, prices
- [ ] Date filter pills: Today, Yesterday, Week, Month, Year, All
- [ ] Pair multi-select filter

### Worst Case
- [ ] No trades found → empty state
- [ ] Wallet not connected → "Connect Wallet" card
- [ ] RPC fails → error
- [ ] Deriverse program logs not found → graceful empty state
- [ ] Jupiter/Raydium DEX tabs → "Coming Soon" placeholder

---

## 17. LST Directory (`/cockpit/lst`)

### Best Case
- [ ] Static registry loads (~245 LSTs from Sanctum TOML)
- [ ] Desktop: sortable table (name, symbol, pool type, mint)
- [ ] Mobile: card layout
- [ ] Search by name/symbol
- [ ] Pool type filter pills
- [ ] "Swap SOL → LST" link per row → opens Jupiter swap

### Worst Case
- [ ] Static data → no network failure possible
- [ ] Search returns 0 → empty state
- [ ] Unknown LST icon → fallback avatar

---

## 18. Dashboard / Project Overview (`/cockpit`)

### Best Case
- [ ] Hero: "DeFi Triangle" with portfolio stats (if wallet connected) or connect prompt
- [ ] Quick Actions: 3 cards linking to Explore Vaults, DEX Analytics, Swap
- [ ] Market Pulse: SOL/BTC/ETH prices from Binance (30s refresh)
- [ ] Top 5 Vaults by APY: sortable mini-table with deposit buttons
- [ ] Your Positions: first 3 positions (if wallet connected)
- [ ] Protocol Stats: total vaults, combined TVL, highest APY, 24h volume

### Worst Case
- [ ] Binance API fails → Market Pulse section empty (no fake numbers)
- [ ] Kamino API fails → error banner, empty vault/position sections
- [ ] Wallet not connected → portfolio stats hidden, connect prompt shown
- [ ] No positions → "Explore Vaults" CTA instead of position cards

---

## 19. Settings (`/cockpit/settings`)

### Best Case
- [ ] Gradient presets render (Frost, Midnight, Ocean, Ember, Aurora, Carbon)
- [ ] CTA color presets render (Blue, Emerald, Violet, Rose, Amber, Cyan)
- [ ] Selection applies immediately to CSS variables
- [ ] Selection persists in localStorage across refreshes

### Worst Case
- [ ] localStorage unavailable → defaults used, no crash
- [ ] CSS variables applied on page load via `applyThemeSettings()`

---

## 20. Error Handling & Resilience

### Best Case
- [ ] All external API failures show user-friendly error messages (not raw stack traces)
- [ ] RPC round-robin: Helius → QuickNode → RPCFast → public
- [ ] Retry logic: 408, 429, 500-504 retried up to 3x with exponential backoff + jitter
- [ ] AbortSignal.timeout on all fetches (8-15s depending on service)
- [ ] `RpcErrorBanner` component renders on vault/lending pages when API fails

### Worst Case
- [ ] All 3 RPCs down → error banner, no data, no crash
- [ ] Jupiter API rate limited (0.5 RPS without key) → retried, error if persistent
- [ ] Helius DAS timeout (15s) → error surfaced
- [ ] Supabase down → counter falls back to in-memory, watchlist unavailable
- [ ] Umbra indexer unreachable → shield/unshield fail with error, UI shows message

---

## 21. Caching

### Best Case
- [ ] Token prices: 30s fresh TTL, stale returns null (no fake numbers)
- [ ] Kamino vaults: 30s client cache, auto-refresh every 30 min
- [ ] Lending reserves: 30s client cache, auto-refresh every 60s
- [ ] NFT holdings: 60s server-side cache per wallet
- [ ] In-flight request deduplication prevents duplicate API calls

### Worst Case
- [ ] Cache expired + API fails → null returned (not stale data)
- [ ] Rapid navigation between pages → deduplicated requests (same promise reused)
- [ ] User force-refreshes → `clearCache()` available on price service

---

## 22. Mobile Responsiveness (320px)

### Best Case
- [ ] Landing page hero: text readable, buttons stack vertically on small screens
- [ ] Log page: cards full-width, timeline line visible
- [ ] Navbar: hamburger menu visible on mobile, nav pills scroll horizontally
- [ ] Swap page: token combobox dropdown fits within viewport
- [ ] NFT gallery: 2-column grid on mobile
- [ ] NFT detail modal: full-screen sheet on mobile (rounded top)
- [ ] Vault explorer: non-critical columns hidden (`hidden md:table-cell`)
- [ ] Lending table: mobile card layout replaces table

### Worst Case
- [ ] No horizontal scrollbar at 320px on any page
- [ ] Touch targets ≥ 44px height
- [ ] Long wallet addresses truncated (not overflowing)
- [ ] Collection filter pills scroll horizontally (not wrap)
- [ ] Token search dropdown: `max-w-[calc(100vw-32px)]` prevents overflow
