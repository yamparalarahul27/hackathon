/**
 * Token Icon Helper — Multi-source with reliable fallback chain
 *
 * Problem: No single CDN has ALL Solana token icons.
 * - solana-labs/token-list: deprecated, missing JUP/JTO/BONK/USDT
 * - Jupiter API: rate-limited, may fail on first load
 *
 * Solution: Use multiple known CDN sources per token, with runtime
 * Jupiter API enrichment as a bonus (not a requirement).
 *
 * Priority:
 * 1. Known reliable URLs (hardcoded per mint — covers top tokens)
 * 2. Jupiter cache (populated async — covers everything else)
 * 3. Solana token-list CDN (legacy, works for some)
 * 4. Generated avatar fallback (works for ANY token)
 */

// ── Known reliable icon URLs ───────────────────────────────────
// These are verified working URLs from CoinGecko, Jupiter static, and official sources.
// Covers the top tokens that appear in our mock data and most Kamino vaults.

const KNOWN_ICONS: Record<string, string> = {
  // SOL
  'So11111111111111111111111111111111111111112':
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  // USDC
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  // USDT
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB':
    'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',
  // ETH (standard Ethereum logo — not the Wormhole wrapped version)
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs':
    'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
  // JUP
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN':
    'https://coin-images.coingecko.com/coins/images/34188/small/jup.png',
  // JTO
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL':
    'https://coin-images.coingecko.com/coins/images/33228/small/jto.png',
  // BONK
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263':
    'https://coin-images.coingecko.com/coins/images/28600/small/bonk.jpg',
  // JitoSOL
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn':
    'https://storage.googleapis.com/token-metadata/JitoSOL-256.png',
  // mSOL
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So':
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
  // RAY
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R':
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
  // ORCA
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE':
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
};

// ── Runtime cache (populated lazily when we fetch metadata) ─────

const iconCache: Map<string, string> = new Map();

/**
 * Cache an icon URL for a mint (called by token metadata services
 * when they receive a token record from Jupiter Tokens V2 or similar).
 */
export function cacheTokenIcon(mint: string, logoUri: string): void {
  if (mint && logoUri) iconCache.set(mint, logoUri);
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Get token icon URL. Resolution order:
 * 1. KNOWN_ICONS (hardcoded, verified working)
 * 2. Runtime cache (populated by metadata fetchers)
 * 3. Solana token-list CDN (legacy, may 404 — onError falls back)
 * 4. Generated avatar (always works)
 *
 * NOTE: Jupiter's old `token.jup.ag/strict` bulk-list endpoint was removed
 * when we aligned with the current Tokens V2 docs. For on-demand lookups,
 * call `api.jup.ag/tokens/v2/search?query=<mint>` and feed the result to
 * cacheTokenIcon().
 */
export function getTokenIcon(mint: string, symbol?: string): string {
  if (!mint) return getFallbackIcon(symbol ?? '?');

  // 1. Known reliable URL
  if (KNOWN_ICONS[mint]) return KNOWN_ICONS[mint];

  // 2. Runtime cache
  const cached = iconCache.get(mint);
  if (cached) return cached;

  // 3. Solana token-list CDN (may 404, onError handles it)
  return `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`;
}

/**
 * Fallback avatar from symbol text.
 */
export function getFallbackIcon(symbol: string): string {
  const text = encodeURIComponent(symbol.slice(0, 3));
  return `https://ui-avatars.com/api/?name=${text}&background=19549b&color=fff&size=64&bold=true&format=svg`;
}

/**
 * Handle image load error — swap to fallback.
 */
export function handleIconError(
  event: React.SyntheticEvent<HTMLImageElement>,
  symbol: string
): void {
  const target = event.currentTarget;
  if (target.dataset.fallback === 'true') return;
  target.dataset.fallback = 'true';
  target.src = getFallbackIcon(symbol);
}
