/**
 * Jupiter Token List Service (v2)
 *
 * Wraps https://api.jup.ag/tokens/v2/* — the ranked Solana token lists used
 * by Jupiter's own UIs. Free, no key required.
 *
 *   - toptraded/{interval}      — ranked by 24h USD volume
 *   - toporganicscore/{interval}— ranked by Jupiter's organic score
 *   - toptrending/{interval}    — buzzy movers
 *
 * Each token entry includes price, mcap, stats24h (priceChange, buy/sell
 * volume), audit flags, etc. We normalize to `MarketToken` for the UI.
 */

import { JUPITER_API_BASE, jupiterHeaders } from '@/lib/constants';

const TOKEN_LIST_BASE = `${JUPITER_API_BASE}/tokens/v2`;

export type JupiterInterval = '5m' | '1h' | '6h' | '24h';
export type JupiterTopList = 'toptraded' | 'toporganicscore' | 'toptrending';

interface RawStats {
  priceChange?: number;
  volumeChange?: number;
  buyVolume?: number;
  sellVolume?: number;
}

interface RawTopToken {
  id?: string;                // mint
  name?: string;
  symbol?: string;
  icon?: string;
  decimals?: number;
  usdPrice?: number;
  mcap?: number;
  fdv?: number;
  liquidity?: number;
  holderCount?: number;
  organicScore?: number;
  isVerified?: boolean;
  stats5m?: RawStats;
  stats1h?: RawStats;
  stats6h?: RawStats;
  stats24h?: RawStats;
}

export interface MarketToken {
  rank: number;
  address: string;            // mint
  name: string;
  symbol: string;
  icon: string | null;
  decimals: number;
  price: number;
  mcap: number;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
  holderCount: number;
  organicScore: number;
  isVerified: boolean;
}

function pickStats(raw: RawTopToken, interval: JupiterInterval): RawStats {
  switch (interval) {
    case '5m':  return raw.stats5m  ?? {};
    case '1h':  return raw.stats1h  ?? {};
    case '6h':  return raw.stats6h  ?? {};
    case '24h':
    default:    return raw.stats24h ?? {};
  }
}

function normalize(raw: RawTopToken, rank: number, interval: JupiterInterval): MarketToken | null {
  if (!raw.id) return null;
  const s = pickStats(raw, interval);
  const volume = (s.buyVolume ?? 0) + (s.sellVolume ?? 0);
  return {
    rank,
    address: raw.id,
    name: raw.name ?? '',
    symbol: raw.symbol ?? '',
    icon: raw.icon ?? null,
    decimals: raw.decimals ?? 0,
    price: raw.usdPrice ?? 0,
    mcap: raw.mcap ?? 0,
    volume24h: volume,
    priceChange24h: s.priceChange ?? 0,
    liquidity: raw.liquidity ?? 0,
    holderCount: raw.holderCount ?? 0,
    organicScore: raw.organicScore ?? 0,
    isVerified: Boolean(raw.isVerified),
  };
}

export async function fetchTopTokens(
  list: JupiterTopList = 'toptraded',
  interval: JupiterInterval = '24h'
): Promise<MarketToken[]> {
  const url = `${TOKEN_LIST_BASE}/${list}/${interval}`;
  const res = await fetch(url, {
    headers: jupiterHeaders(),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Jupiter ${res.status}: ${list}/${interval}`);
  const raw = (await res.json()) as RawTopToken[] | { error?: string };
  if (!Array.isArray(raw)) {
    throw new Error(`Jupiter /${list}/${interval}: ${('error' in raw && raw.error) || 'unexpected payload'}`);
  }
  return raw
    .map((t, i) => normalize(t, i + 1, interval))
    .filter((t): t is MarketToken => t !== null);
}
