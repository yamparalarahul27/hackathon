/**
 * Token Price Service
 *
 * Wraps Jupiter Price API with reliability controls:
 * - request shaping (max ids + URL bytes)
 * - bounded concurrency
 * - retry with jitter for transient failures
 * - stale cache fallback semantics
 */

import { JUPITER_PRICE_API, jupiterHeaders } from '../lib/constants';

// Price API v3 response — no `data` wrapper, price is `usdPrice` (number).
// Docs: https://developers.jup.ag/docs/price-api
type JupiterPriceResponse = Record<string, {
  usdPrice: number;
  liquidity?: number;
  priceChange24h?: number;
  decimals?: number;
  blockId?: number;
  createdAt?: string;
}>;

interface PriceCacheEntry {
  price: number;
  fetchedAt: number;
}

const priceCache: Map<string, PriceCacheEntry> = new Map();
const FRESH_TTL_MS = 30_000;
const STALE_TTL_MS = 150_000;
const MAX_IDS_PER_REQUEST = 50;
const MAX_URL_BYTES = 1800;
const MAX_BATCH_CONCURRENCY = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

// Fallback prices for demo safety (if Jupiter API is unreachable)
const FALLBACK_PRICES: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 178.50,    // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1.00, // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1.00,  // USDT
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 3420,  // ETH (Wormhole)
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 1.15,   // JUP
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': 4.20,   // JTO
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 0.000035, // BONK
};

export class TokenPriceService {
  /**
   * Get prices for multiple token mints in a single API call.
   */
  async getPrices(mints: string[]): Promise<Record<string, number>> {
    const now = Date.now();
    const toFetch = new Set<string>();
    const result: Record<string, number> = {};

    // Check cache first
    for (const mint of mints) {
      const cached = priceCache.get(mint);
      if (cached && now - cached.fetchedAt < FRESH_TTL_MS) {
        result[mint] = cached.price;
      } else {
        toFetch.add(mint);
      }
    }

    // Fetch uncached/stale prices in bounded batches.
    if (toFetch.size > 0) {
      const unresolved = new Set<string>(toFetch);
      const batches = this.planBatches([...toFetch]);
      const responses = await runWithConcurrency(
        batches,
        MAX_BATCH_CONCURRENCY,
        async (batch) => this.fetchBatch(batch)
      );

      for (const batchResult of responses) {
        for (const [mint, price] of Object.entries(batchResult)) {
          unresolved.delete(mint);
          if (Number.isFinite(price)) {
            result[mint] = price;
            priceCache.set(mint, { price, fetchedAt: now });
          }
        }
      }

      for (const mint of unresolved) {
        const stale = priceCache.get(mint);
        if (stale && now - stale.fetchedAt < STALE_TTL_MS) {
          result[mint] = stale.price;
          continue;
        }

        const fallback = FALLBACK_PRICES[mint];
        if (typeof fallback === 'number') {
          result[mint] = fallback;
          priceCache.set(mint, { price: fallback, fetchedAt: now });
          continue;
        }

        result[mint] = 0;
      }
    }

    return result;
  }

  /**
   * Get price for a single token mint.
   */
  async getPrice(mint: string): Promise<number> {
    const prices = await this.getPrices([mint]);
    return prices[mint] ?? 0;
  }

  /**
   * Clear the price cache (useful for force-refresh).
   */
  clearCache(): void {
    priceCache.clear();
  }

  private async fetchBatch(mints: string[]): Promise<Record<string, number>> {
    if (mints.length === 0) return {};

    const ids = mints.join(',');
    const url = `${JUPITER_PRICE_API}?ids=${ids}`;
    const response = await this.fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`Jupiter API ${response.status}`);
    }

    const data: JupiterPriceResponse = await response.json();
    const prices: Record<string, number> = {};

    for (const mint of mints) {
      const value = data[mint]?.usdPrice;
      if (typeof value === 'number' && Number.isFinite(value)) {
        prices[mint] = value;
      }
    }

    return prices;
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    const maxAttempts = 3;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: jupiterHeaders(),
        });

        if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status) || attempt === maxAttempts) {
          return response;
        }
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) break;
      }

      await sleep(Math.floor((180 * (2 ** (attempt - 1))) + Math.random() * 220));
    }

    throw lastError instanceof Error ? lastError : new Error('Jupiter price request failed after retries.');
  }

  private planBatches(mints: string[]): string[][] {
    const unique = [...new Set(mints)];
    const batches: string[][] = [];
    let currentBatch: string[] = [];

    for (const mint of unique) {
      const candidate = [...currentBatch, mint];
      const candidateUrlBytes = this.estimateUrlBytes(candidate);
      const exceedsCount = candidate.length > MAX_IDS_PER_REQUEST;
      const exceedsBytes = candidateUrlBytes > MAX_URL_BYTES;

      if ((exceedsCount || exceedsBytes) && currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [mint];
      } else {
        currentBatch = candidate;
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  private estimateUrlBytes(mints: string[]): number {
    const ids = mints.join(',');
    return new TextEncoder().encode(`${JUPITER_PRICE_API}?ids=${ids}`).length;
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) continue;
      try {
        results.push(await fn(next));
      } catch {
        // Errors are handled by caller through unresolved mint fallback logic.
      }
    }
  });

  await Promise.all(workers);
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
