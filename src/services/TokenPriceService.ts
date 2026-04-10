/**
 * Token Price Service
 *
 * Wraps the Jupiter Price API v2 for fetching real-time Solana token prices.
 * Includes in-memory caching to avoid excessive API calls during UI renders.
 */

import { JUPITER_PRICE_API } from '../lib/constants';

interface JupiterPriceResponse {
  data: Record<string, { id: string; type: string; price: string }>;
  timeTaken: number;
}

// In-memory cache with 30-second TTL
const priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const CACHE_TTL_MS = 30_000;

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
    const uncachedMints: string[] = [];
    const result: Record<string, number> = {};

    // Check cache first
    for (const mint of mints) {
      const cached = priceCache.get(mint);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        result[mint] = cached.price;
      } else {
        uncachedMints.push(mint);
      }
    }

    // Fetch uncached prices
    if (uncachedMints.length > 0) {
      try {
        const ids = uncachedMints.join(',');
        const response = await fetch(`${JUPITER_PRICE_API}?ids=${ids}`, {
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) throw new Error(`Jupiter API ${response.status}`);

        const data: JupiterPriceResponse = await response.json();

        for (const mint of uncachedMints) {
          const priceData = data.data[mint];
          const price = priceData ? parseFloat(priceData.price) : (FALLBACK_PRICES[mint] ?? 0);
          result[mint] = price;
          priceCache.set(mint, { price, timestamp: now });
        }
      } catch (error) {
        console.warn('[TokenPriceService] Jupiter API failed, using fallback prices:', error);
        for (const mint of uncachedMints) {
          const price = FALLBACK_PRICES[mint] ?? 0;
          result[mint] = price;
          priceCache.set(mint, { price, timestamp: now });
        }
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
}
