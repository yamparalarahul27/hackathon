/**
 * Birdeye Data Service (client)
 *
 * Calls our internal /api/birdeye proxy so the BIRDEYE_API_KEY stays
 * server-side. The proxy forwards to https://public-api.birdeye.so and
 * enforces an allow-list of supported paths.
 *
 *   - Token security scoring (/defi/token_security)
 *   - Trending tokens (/defi/token_trending)
 *   - New token listings (/v2/tokens/new_listing)
 *
 * Free tier: 50 req/min. Docs: https://docs.birdeye.so
 */

const BIRDEYE_PROXY_BASE = '/api/birdeye';

async function birdeyeFetch<T>(path: string): Promise<T> {
  const url = `${BIRDEYE_PROXY_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`Birdeye ${res.status}: ${path}`);
  }
  const json = await res.json();
  if (!json.success && json.message) {
    throw new Error(`Birdeye: ${json.message}`);
  }
  return json.data as T;
}

// ── Types ────────────────────────────────────────────────────────

export interface TokenSecurity {
  address: string;
  creatorAddress: string | null;
  ownerAddress: string | null;
  creationTx: string | null;
  creationTime: number | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isToken2022: boolean;
  isTrueToken: boolean;
  top10HolderPercent: number;
  top10UserPercent: number;
  totalSupply: number;
  preMarketHolder: string[];
  lockInfo: unknown | null;
  metaplexUpdateAuthority: string | null;
  mutableMetadata: boolean;
  nonTransferable: boolean;
}

export type SecurityLevel = 'safe' | 'caution' | 'danger';

export interface SecurityScore {
  level: SecurityLevel;
  score: number;
  checks: SecurityCheck[];
}

export interface SecurityCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface TrendingToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  liquidity: number;
  volume24hUSD: number;
  price: number;
  priceChange24hPercent: number;
  rank: number;
}

export interface NewListingToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string | null;
  liquidity: number;
  volume24hUSD: number;
  price: number;
  priceChange24hPercent: number;
  openTimestamp: number;
}

// ── API Functions ────────────────────────────────────────────────

export async function fetchTokenSecurity(mint: string): Promise<TokenSecurity> {
  return birdeyeFetch<TokenSecurity>(
    `/defi/token_security?address=${encodeURIComponent(mint)}`
  );
}

export async function fetchTrendingTokens(
  limit = 20,
  offset = 0
): Promise<TrendingToken[]> {
  const data = await birdeyeFetch<{ tokens: TrendingToken[] }>(
    `/defi/token_trending?sort_by=rank&sort_type=asc&offset=${offset}&limit=${limit}`
  );
  return data?.tokens ?? (Array.isArray(data) ? data as unknown as TrendingToken[] : []);
}

export async function fetchNewListings(
  limit = 20,
  timeRange = '24h'
): Promise<NewListingToken[]> {
  const data = await birdeyeFetch<{ tokens: NewListingToken[] }>(
    `/v2/tokens/new_listing?time_to=${timeRange}&limit=${limit}&sort_by=liquidity&sort_type=desc`
  );
  return data?.tokens ?? (Array.isArray(data) ? data as unknown as NewListingToken[] : []);
}

// ── Security Scoring ─────────────────────────────────────────────

export function scoreTokenSecurity(sec: TokenSecurity): SecurityScore {
  const checks: SecurityCheck[] = [
    {
      label: 'No freeze authority',
      passed: !sec.freezeAuthority,
      detail: sec.freezeAuthority ? `Freeze authority: ${short(sec.freezeAuthority)}` : 'No one can freeze your tokens',
    },
    {
      label: 'No mint authority',
      passed: !sec.mintAuthority,
      detail: sec.mintAuthority ? `Mint authority: ${short(sec.mintAuthority)}` : 'Supply is fixed — no inflation risk',
    },
    {
      label: 'Low holder concentration',
      passed: sec.top10HolderPercent < 50,
      detail: `Top 10 holders own ${sec.top10HolderPercent.toFixed(1)}%`,
    },
    {
      label: 'Immutable metadata',
      passed: !sec.mutableMetadata,
      detail: sec.mutableMetadata ? 'Metadata can be changed by update authority' : 'Metadata is locked',
    },
    {
      label: 'Transferable',
      passed: !sec.nonTransferable,
      detail: sec.nonTransferable ? 'Token is non-transferable (soulbound)' : 'Token can be freely transferred',
    },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);
  const level: SecurityLevel =
    score >= 80 ? 'safe' : score >= 50 ? 'caution' : 'danger';

  return { level, score, checks };
}

function short(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
