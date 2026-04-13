/**
 * Shared constants used across the application
 */

// Application metadata
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://deriverse.app';

// Deriverse Program Configuration
export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu';
export const DERIVERSE_VERSION = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION ?? '12', 10);

// RPC Configuration — Helius mainnet key MUST be set via NEXT_PUBLIC_HELIUS_RPC_URL env var.
// No fallback — if the env var is missing, RPC calls will fail and show an error banner.
export const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ?? '';
export const RPC_HTTP = process.env.NEXT_PUBLIC_RPC_HTTP ?? HELIUS_RPC_URL;

export type SupportedCluster = 'devnet' | 'mainnet-beta';

// Map of user-selectable clusters to their RPC endpoints. Keeps wallet adapters
// lightweight while still letting us flip between devnet and mainnet via envs.
export const WALLET_CLUSTER_CONFIG: Record<SupportedCluster, { rpcUrl: string }> = {
    'devnet': {
        rpcUrl: process.env.NEXT_PUBLIC_RPC_DEVNET ?? HELIUS_RPC_URL
    },
    'mainnet-beta': {
        rpcUrl: process.env.NEXT_PUBLIC_RPC_MAINNET ?? HELIUS_RPC_URL
    }
};

export const DEFAULT_WALLET_CLUSTER: SupportedCluster = (process.env.NEXT_PUBLIC_WALLET_CLUSTER === 'mainnet-beta'
    ? 'mainnet-beta'
    : 'devnet');

// Deriverse Decimals
export const PRICE_DECIMALS = 1e9;
export const ASSET_DECIMALS = 1e9;
export const QUOTE_DECIMALS = 1e6;

// Instrument ID to Symbol Mapping (Devnet)
export const INSTRUMENT_ID_TO_SYMBOL: Record<number, string> = {
    0: 'SOL-USDC',
};

// ── DexPilot: Kamino Integration ────────────────────────────────────

export const KAMINO_MAIN_MARKET = process.env.NEXT_PUBLIC_KAMINO_MAIN_MARKET ?? '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';
export const KAMINO_KLEND_PROGRAM = 'KLend2g3cP87ber41GXWsSZQz5jjNMN3yUiYMnN8zu8';
export const KAMINO_KLIQUIDITY_PROGRAM = '6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47dehDc';

// ── DexPilot: External APIs ─────────────────────────────────────────

export const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';
export const DODO_PAYMENTS_API = process.env.NEXT_PUBLIC_DODO_API_BASE ?? 'https://api.dodopayments.com';
export const DODO_PAYMENTS_KEY = process.env.DODO_PAYMENTS_API_KEY ?? '';

// ── DexPilot: QuickNode / RPC Fast ──────────────────────────────────

export const QUICKNODE_RPC_URL = process.env.NEXT_PUBLIC_QUICKNODE_RPC ?? '';
export const RPC_FAST_URL = process.env.NEXT_PUBLIC_RPC_FAST_URL ?? '';
