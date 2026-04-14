/**
 * RPC endpoint rotator — round-robin + failover.
 *
 * 3 providers: Helius → QuickNode → RPC Fast
 *
 * Round-robin: each call starts from the NEXT provider in rotation,
 * spreading load evenly so no single provider hits rate limits first.
 * If the chosen provider fails, falls back to the remaining ones.
 *
 * Usage (server-side):
 *   const result = await withRpcRotation((rpcUrl) => {
 *     const service = new KaminoLendService(rpcUrl);
 *     return service.getMainMarket();
 *   });
 */

/** Deduplicated list of configured server-side RPC endpoints. */
function rpcCandidates(): string[] {
  const seen = new Set<string>();
  const candidates: string[] = [];
  const envKeys = [
    process.env.HELIUS_RPC_URL,
    process.env.QUICKNODE_RPC_URL,
    process.env.RPCFAST_RPC_URL,
    process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
    process.env.NEXT_PUBLIC_QUICKNODE_RPC,
  ];
  for (const url of envKeys) {
    if (url && url.trim() && !seen.has(url)) {
      seen.add(url);
      candidates.push(url);
    }
  }
  return candidates;
}

/** Global round-robin counter — survives across requests in the same process. */
let roundRobinIndex = 0;

/**
 * Round-robin + failover: starts from the next provider in rotation,
 * tries all configured endpoints before giving up.
 */
export async function withRpcFallback<T>(operation: (rpcUrl: string) => Promise<T>): Promise<T> {
  const endpoints = rpcCandidates();
  if (endpoints.length === 0) {
    throw new Error('No Solana RPC URL configured (set HELIUS_RPC_URL, QUICKNODE_RPC_URL, or RPCFAST_RPC_URL)');
  }

  // Pick starting index via round-robin
  const startIdx = roundRobinIndex % endpoints.length;
  roundRobinIndex++;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < endpoints.length; attempt++) {
    const idx = (startIdx + attempt) % endpoints.length;
    const url = endpoints[idx];
    const provider = providerName(url);
    try {
      return await operation(url);
    } catch (err) {
      lastError = err;
      const nextIdx = (idx + 1) % endpoints.length;
      const nextProvider = attempt + 1 < endpoints.length ? providerName(endpoints[nextIdx]) : null;
      console.warn(
        `[rpc] ${provider} failed${nextProvider ? `, rotating to ${nextProvider}` : ' (no more endpoints)'}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  throw lastError ?? new Error('All RPC endpoints failed');
}

/** Alias for backward compat. */
export const withRpcRotation = withRpcFallback;

/** Cheap provider label for logs (no key leak). */
function providerName(url: string): string {
  if (url.includes('helius')) return 'helius';
  if (url.includes('quiknode') || url.includes('quicknode')) return 'quicknode';
  if (url.includes('rpcfast')) return 'rpcfast';
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/** Round-robin pick — returns the next provider URL in rotation. */
export function getNextRpcUrl(): string {
  const endpoints = rpcCandidates();
  if (endpoints.length === 0) {
    throw new Error('No Solana RPC URL configured');
  }
  const idx = roundRobinIndex % endpoints.length;
  roundRobinIndex++;
  return endpoints[idx];
}

/** First-available URL (no rotation). */
export function getPrimaryRpcUrl(): string {
  const [primary] = rpcCandidates();
  if (!primary) {
    throw new Error('No Solana RPC URL configured');
  }
  return primary;
}
