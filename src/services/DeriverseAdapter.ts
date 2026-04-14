/**
 * Deriverse Adapter — mainnet readiness stub
 *
 * Deriverse DEX is currently on devnet. This adapter:
 * - Exports the Deriverse program ID (same across devnet/mainnet)
 * - Provides types + decode helpers for when mainnet goes live
 * - Detects Deriverse txs in log lines
 *
 * When Deriverse goes mainnet:
 * 1. Instantiate `Engine` with a mainnet RPC:
 *      const engine = new Engine(createSolanaRpc(HELIUS_RPC_URL));
 * 2. Call engine.logsDecode(logs) to parse trade fills
 * 3. Pipe into Supabase upsert (same pattern as Deriverse's SupabaseTradeService)
 * 4. Show in DEX Analytics tab alongside Kamino data
 *
 * References: github.com/yamparalarahul27/Deriverse
 */

import { PROGRAM_ID as DERIVERSE_PROGRAM_ID } from '@deriverse/kit';
// Re-export types for consumers. Engine itself not instantiated until mainnet.
export type { LogMessage } from '@deriverse/kit';

export { DERIVERSE_PROGRAM_ID };

/**
 * Check if a transaction's logs contain Deriverse program invocations.
 */
export function isDerivverseTx(logs: readonly string[]): boolean {
  return logs.some((line) => line.includes(DERIVERSE_PROGRAM_ID));
}

/** Current network status for Deriverse DEX. */
export const DERIVERSE_STATUS = {
  network: 'devnet' as const,
  mainnetReady: false,
  message: 'Deriverse DEX is currently on devnet. Trade analytics will activate once mainnet launches.',
} as const;
