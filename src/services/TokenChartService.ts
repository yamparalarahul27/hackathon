/**
 * Token Chart Service
 *
 * Multi-source historical price fetcher with deterministic fallback chain:
 *
 *   1. Binance Klines  — best quality + deepest history, no key, ~15 majors
 *   2. Birdeye         — any SPL by mint, requires BIRDEYE_API_KEY
 *   3. GeckoTerminal   — free fallback for long-tail tokens, no key
 *
 * All sources normalize to `TokenChartPoint[]` (unix seconds + USD value).
 */

import { BIRDEYE_API_BASE, BIRDEYE_API_KEY } from '../lib/constants';

export interface TokenChartPoint {
  time: number; // unix seconds
  value: number;
}

// ── Mint → Binance symbol map (extend as Binance lists more SPL pairs) ──

const BINANCE_PAIR: Record<string, string> = {
  'So11111111111111111111111111111111111111112':  'SOLUSDT',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDCUSDT',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETHUSDT',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN':  'JUPUSDT',
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL':  'JTOUSDT',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONKUSDT',
};

// ── Birdeye type mapping ───────────────────────────────────────────────

function birdeyeType(days: number): string {
  if (days <= 1) return '15m';
  if (days <= 7) return '1H';
  if (days <= 30) return '4H';
  if (days <= 90) return '1D';
  return '1D';
}

// ── Binance interval mapping ───────────────────────────────────────────

function binanceInterval(days: number): { interval: string; limit: number } {
  if (days <= 1) return { interval: '15m', limit: 96 };
  if (days <= 7) return { interval: '1h', limit: 168 };
  if (days <= 30) return { interval: '4h', limit: 180 };
  if (days <= 90) return { interval: '12h', limit: 180 };
  if (days <= 365) return { interval: '1d', limit: 365 };
  return { interval: '1d', limit: 1000 };
}

// ── GeckoTerminal timeframe mapping ────────────────────────────────────

function geckoTerminalTimeframe(days: number): { timeframe: string; aggregate: number; limit: number } {
  if (days <= 1) return { timeframe: 'minute', aggregate: 15, limit: 96 };
  if (days <= 7) return { timeframe: 'hour', aggregate: 1, limit: 168 };
  if (days <= 30) return { timeframe: 'hour', aggregate: 4, limit: 180 };
  if (days <= 90) return { timeframe: 'day', aggregate: 1, limit: 90 };
  return { timeframe: 'day', aggregate: 1, limit: 365 };
}

// ── Source: Binance ────────────────────────────────────────────────────

async function fromBinance(mint: string, days: number): Promise<TokenChartPoint[]> {
  const symbol = BINANCE_PAIR[mint];
  if (!symbol) throw new Error('Binance: pair not listed');
  const { interval, limit } = binanceInterval(days);
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Binance ${res.status}`);
  const rows: unknown[] = await res.json();
  return rows.map((row) => {
    const r = row as [number, string, string, string, string];
    return { time: Math.floor(r[0] / 1000), value: parseFloat(r[4]) };
  });
}

// ── Source: Birdeye ────────────────────────────────────────────────────

interface BirdeyeResponse {
  success: boolean;
  data?: { items?: Array<{ unixTime: number; value: number }> };
}

async function fromBirdeye(mint: string, days: number): Promise<TokenChartPoint[]> {
  if (!BIRDEYE_API_KEY) throw new Error('Birdeye: BIRDEYE_API_KEY not set');
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;
  const type = birdeyeType(days);
  const url = `${BIRDEYE_API_BASE}/defi/history_price?address=${mint}&address_type=token&type=${type}&time_from=${from}&time_to=${now}`;
  const res = await fetch(url, {
    headers: {
      'X-API-KEY': BIRDEYE_API_KEY,
      'x-chain': 'solana',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Birdeye ${res.status}`);
  const body: BirdeyeResponse = await res.json();
  if (!body.success || !body.data?.items) throw new Error('Birdeye: no data');
  return body.data.items.map((p) => ({ time: p.unixTime, value: p.value }));
}

// ── Source: GeckoTerminal ──────────────────────────────────────────────

interface GeckoTerminalPoolsResponse {
  data?: Array<{ id: string; attributes?: { address: string } }>;
}
interface GeckoTerminalOhlcvResponse {
  data?: { attributes?: { ohlcv_list?: Array<[number, number, number, number, number, number]> } };
}

async function fromGeckoTerminal(mint: string, days: number): Promise<TokenChartPoint[]> {
  // 1. Find the most-liquid pool for this token on Solana
  const poolsRes = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/pools?page=1`,
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }
  );
  if (!poolsRes.ok) throw new Error(`GeckoTerminal pools ${poolsRes.status}`);
  const poolsBody: GeckoTerminalPoolsResponse = await poolsRes.json();
  const poolAddress = poolsBody.data?.[0]?.attributes?.address;
  if (!poolAddress) throw new Error('GeckoTerminal: no pools found');

  // 2. Fetch OHLCV for that pool
  const { timeframe, aggregate, limit } = geckoTerminalTimeframe(days);
  const ohlcvRes = await fetch(
    `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}&currency=usd&token=base`,
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }
  );
  if (!ohlcvRes.ok) throw new Error(`GeckoTerminal ohlcv ${ohlcvRes.status}`);
  const body: GeckoTerminalOhlcvResponse = await ohlcvRes.json();
  const list = body.data?.attributes?.ohlcv_list ?? [];
  // Each row: [timestamp, open, high, low, close, volume]
  return list
    .map((row) => ({ time: row[0], value: row[4] }))
    .sort((a, b) => a.time - b.time);
}

// ── Public API ─────────────────────────────────────────────────────────

export interface FetchChartResult {
  source: 'binance' | 'birdeye' | 'geckoterminal';
  points: TokenChartPoint[];
}

/**
 * Fetch historical chart for a token. Tries sources in order, returns the
 * first that succeeds, with the source name attached.
 *
 * Throws if every source fails — caller should surface the error in UI.
 */
export async function fetchTokenChart(mint: string, days: number): Promise<FetchChartResult> {
  const errors: string[] = [];

  // 1. Binance (best for majors)
  if (BINANCE_PAIR[mint]) {
    try {
      const points = await fromBinance(mint, days);
      if (points.length > 0) return { source: 'binance', points };
      errors.push('Binance: empty');
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // 2. Birdeye (any SPL with key)
  if (BIRDEYE_API_KEY) {
    try {
      const points = await fromBirdeye(mint, days);
      if (points.length > 0) return { source: 'birdeye', points };
      errors.push('Birdeye: empty');
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  // 3. GeckoTerminal (fallback, free)
  try {
    const points = await fromGeckoTerminal(mint, days);
    if (points.length > 0) return { source: 'geckoterminal', points };
    errors.push('GeckoTerminal: empty');
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  throw new Error(`All chart sources failed: ${errors.join('; ')}`);
}
