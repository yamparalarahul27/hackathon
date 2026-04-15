/**
 * Shared constants used across the application.
 *
 * Rule: NO hardcoded business URLs / keys. Reads from env, fails loud on miss.
 */

// ── App ─────────────────────────────────────────────────────────────

export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

// ── Deriverse Program (devnet today, mainnet later) ──────────────────

export const DERIVERSE_PROGRAM_ID =
  process.env.NEXT_PUBLIC_DERIVERSE_PROGRAM_ID ?? 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu';
export const DERIVERSE_VERSION = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION ?? '12', 10);
// Legacy alias — kept for existing imports until refactored
export const PROGRAM_ID = DERIVERSE_PROGRAM_ID;

// ── Solana RPC ───────────────────────────────────────────────────────

/** Helius mainnet endpoint — primary RPC. Server-only preferred. */
export const HELIUS_RPC_URL =
  process.env.HELIUS_RPC_URL ?? process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? '';

/** QuickNode mainnet endpoint. */
export const QUICKNODE_RPC_URL =
  process.env.QUICKNODE_RPC_URL ?? process.env.NEXT_PUBLIC_QUICKNODE_RPC ?? '';
export const QUICKNODE_WSS_URL = process.env.QUICKNODE_WSS_URL ?? '';

/** RPC Fast mainnet endpoint. */
export const RPCFAST_RPC_URL = process.env.RPCFAST_RPC_URL ?? '';
export const RPCFAST_WSS_URL = process.env.RPCFAST_WSS_URL ?? '';

/** Default RPC for client-side code (Helius first, then others). */
export const RPC_HTTP =
  process.env.NEXT_PUBLIC_RPC_HTTP ??
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ??
  process.env.NEXT_PUBLIC_QUICKNODE_RPC ??
  '';

export type SupportedCluster = 'devnet' | 'mainnet-beta';

export const WALLET_CLUSTER_CONFIG: Record<SupportedCluster, { rpcUrl: string }> = {
  'devnet': { rpcUrl: process.env.NEXT_PUBLIC_RPC_DEVNET ?? RPC_HTTP },
  'mainnet-beta': { rpcUrl: process.env.NEXT_PUBLIC_RPC_MAINNET ?? RPC_HTTP },
};

export const DEFAULT_WALLET_CLUSTER: SupportedCluster =
  process.env.NEXT_PUBLIC_WALLET_CLUSTER === 'devnet' ? 'devnet' : 'mainnet-beta';

// ── Deriverse Decimals ───────────────────────────────────────────────

export const PRICE_DECIMALS = 1e9;
export const ASSET_DECIMALS = 1e9;
export const QUOTE_DECIMALS = 1e6;

export const INSTRUMENT_ID_TO_SYMBOL: Record<number, string> = {
  0: 'SOL-USDC',
};

// ── Kamino ───────────────────────────────────────────────────────────

/** Canonical klend Main Market address (mainnet). */
export const KAMINO_MAIN_MARKET =
  process.env.NEXT_PUBLIC_KAMINO_MAIN_MARKET ?? '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';
export const KAMINO_KLEND_PROGRAM = 'KLend2g3cP87ber41GXWsSZQz5jjNMN3yUiYMnN8zu8';
export const KAMINO_KLIQUIDITY_PROGRAM = '6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47dehDc';

// ── External APIs ────────────────────────────────────────────────────

// Jupiter (docs: https://developers.jup.ag). All products live under api.jup.ag.
// Keyless throughput is 0.5 RPS; set JUPITER_API_KEY (portal.jup.ag) for 1+ RPS.
export const JUPITER_API_BASE = 'https://api.jup.ag';
export const JUPITER_PRICE_API = `${JUPITER_API_BASE}/price/v3`;
export const JUPITER_SWAP_ORDER_API = `${JUPITER_API_BASE}/swap/v2/order`;
export const JUPITER_SWAP_EXECUTE_API = `${JUPITER_API_BASE}/swap/v2/execute`;
export const JUPITER_TOKENS_SEARCH_API = `${JUPITER_API_BASE}/tokens/v2/search`;
export const JUPITER_API_KEY = process.env.JUPITER_API_KEY ?? '';

/** Extra headers for every Jupiter request (API key if set, Accept always). */
export function jupiterHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra };
  if (JUPITER_API_KEY) headers['x-api-key'] = JUPITER_API_KEY;
  return headers;
}

export const BIRDEYE_API_BASE = 'https://public-api.birdeye.so';
export const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY ?? '';
