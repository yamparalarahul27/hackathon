/**
 * DexScreener Service
 *
 * Free API, no key, ~300 req/min.
 * Provides pair-level DEX analytics: where tokens trade, liquidity, volume.
 *
 * Base: https://api.dexscreener.com
 */

const BASE = 'https://api.dexscreener.com';

export interface DexPair {
  chainId: string;
  dexId: string;
  dexName: string;
  pairAddress: string;
  url: string;
  baseToken: { address: string; symbol: string; name: string };
  quoteToken: { address: string; symbol: string; name: string };
  priceUsd: string;
  priceNative: string;
  liquidityUsd: number;
  volume24h: number;
  priceChange24h: number;
  txns24h: { buys: number; sells: number };
  pairCreatedAt: number | null;
}

interface DexScreenerResponse {
  pairs?: Array<{
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: { address: string; symbol: string; name: string };
    quoteToken: { address: string; symbol: string; name: string };
    priceUsd: string;
    priceNative: string;
    liquidity?: { usd?: number };
    volume?: { h24?: number };
    priceChange?: { h24?: number };
    txns?: { h24?: { buys?: number; sells?: number } };
    pairCreatedAt?: number;
  }>;
}

const DEX_NAMES: Record<string, string> = {
  raydium: 'Raydium',
  orca: 'Orca',
  meteora: 'Meteora',
  lifinity: 'Lifinity',
  phoenix: 'Phoenix',
  openbook: 'OpenBook',
  valiant: 'Valiant',
};

/**
 * Fetch top DEX pairs for a Solana token mint.
 * Returns up to `limit` pairs sorted by 24h volume (descending).
 */
export async function fetchPairsForToken(
  mint: string,
  limit = 10
): Promise<DexPair[]> {
  const res = await fetch(`${BASE}/latest/dex/tokens/${mint}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`DexScreener ${res.status}`);
  const body: DexScreenerResponse = await res.json();
  const pairs = (body.pairs ?? [])
    .filter((p) => p.chainId === 'solana')
    .map((p) => ({
      chainId: p.chainId,
      dexId: p.dexId,
      dexName: DEX_NAMES[p.dexId] ?? p.dexId,
      pairAddress: p.pairAddress,
      url: p.url,
      baseToken: p.baseToken,
      quoteToken: p.quoteToken,
      priceUsd: p.priceUsd,
      priceNative: p.priceNative,
      liquidityUsd: p.liquidity?.usd ?? 0,
      volume24h: p.volume?.h24 ?? 0,
      priceChange24h: p.priceChange?.h24 ?? 0,
      txns24h: {
        buys: p.txns?.h24?.buys ?? 0,
        sells: p.txns?.h24?.sells ?? 0,
      },
      pairCreatedAt: p.pairCreatedAt ?? null,
    }))
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, limit);
  return pairs;
}

/**
 * Fetch pairs for a specific token pair (e.g. SOL + USDC).
 * Finds all DEX pools that contain both mints.
 */
export async function fetchPairsForTokenPair(
  mintA: string,
  mintB: string,
  limit = 10
): Promise<DexPair[]> {
  // DexScreener /tokens endpoint accepts comma-separated addresses (up to 30)
  const res = await fetch(`${BASE}/latest/dex/tokens/${mintA},${mintB}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`DexScreener ${res.status}`);
  const body: DexScreenerResponse = await res.json();
  // Filter to pairs where BOTH tokens are present (base + quote or vice versa)
  const mintSet = new Set([mintA, mintB]);
  return (body.pairs ?? [])
    .filter(
      (p) =>
        p.chainId === 'solana' &&
        mintSet.has(p.baseToken.address) &&
        mintSet.has(p.quoteToken.address)
    )
    .map((p) => ({
      chainId: p.chainId,
      dexId: p.dexId,
      dexName: DEX_NAMES[p.dexId] ?? p.dexId,
      pairAddress: p.pairAddress,
      url: p.url,
      baseToken: p.baseToken,
      quoteToken: p.quoteToken,
      priceUsd: p.priceUsd,
      priceNative: p.priceNative,
      liquidityUsd: p.liquidity?.usd ?? 0,
      volume24h: p.volume?.h24 ?? 0,
      priceChange24h: p.priceChange?.h24 ?? 0,
      txns24h: {
        buys: p.txns?.h24?.buys ?? 0,
        sells: p.txns?.h24?.sells ?? 0,
      },
      pairCreatedAt: p.pairCreatedAt ?? null,
    }))
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, limit);
}

/**
 * Fetch top boosted tokens on DexScreener (proxy for "trending").
 */
export async function fetchTrendingTokens(): Promise<
  Array<{ tokenAddress: string; chainId: string; amount: number; url: string }>
> {
  const res = await fetch(`${BASE}/token-boosts/top/v1`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`DexScreener trending ${res.status}`);
  const items: Array<{
    tokenAddress: string;
    chainId: string;
    amount: number;
    url: string;
  }> = await res.json();
  return items.filter((t) => t.chainId === 'solana').slice(0, 20);
}
