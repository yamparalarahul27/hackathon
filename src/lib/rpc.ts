/**
 * RPC endpoint rotator.
 *
 * Tries Helius → QuickNode in order. If a call throws, falls back to the
 * next available endpoint. This protects us from rate-limit / outage on a
 * single provider (Helius free tier is 100K req/day).
 *
 * Usage (server-side):
 *   const result = await withRpcFallback((rpcUrl) => {
 *     const service = new KaminoLendService(rpcUrl);
 *     return service.getMainMarket();
 *   });
 *
 * Public envs are included as fallbacks for client/SDK code, but
 * server-only envs are preferred.
 */

function rpcCandidates(): string[] {
  return [
    process.env.HELIUS_RPC_URL,
    process.env.QUICKNODE_RPC_URL,
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
    process.env.NEXT_PUBLIC_QUICKNODE_RPC,
  ].filter((u): u is string => Boolean(u && u.trim()));
}

/**
 * Try the operation against each configured RPC in order.
 * Throws the last error if every endpoint fails.
 */
export async function withRpcFallback<T>(operation: (rpcUrl: string) => Promise<T>): Promise<T> {
  const endpoints = rpcCandidates();
  if (endpoints.length === 0) {
    throw new Error('No Solana RPC URL configured (set HELIUS_RPC_URL or QUICKNODE_RPC_URL)');
  }

  let lastError: unknown = null;
  for (let i = 0; i < endpoints.length; i++) {
    const url = endpoints[i];
    try {
      return await operation(url);
    } catch (err) {
      lastError = err;
      const provider = providerName(url);
      const nextProvider = i + 1 < endpoints.length ? providerName(endpoints[i + 1]) : null;
      console.warn(
        `[rpc] ${provider} failed${nextProvider ? `, falling back to ${nextProvider}` : ' (no more endpoints)'}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  throw lastError ?? new Error('All RPC endpoints failed');
}

/** Cheap provider label for logs (no key leak). */
function providerName(url: string): string {
  if (url.includes('helius')) return 'helius';
  if (url.includes('quiknode') || url.includes('quicknode')) return 'quicknode';
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/** First-available URL, useful when the operation isn't easily retried. */
export function getPrimaryRpcUrl(): string {
  const [primary] = rpcCandidates();
  if (!primary) {
    throw new Error('No Solana RPC URL configured (set HELIUS_RPC_URL or QUICKNODE_RPC_URL)');
  }
  return primary;
}
