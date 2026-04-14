/**
 * Deriverse Adapter
 *
 * Deriverse DEX runs on devnet. This adapter:
 * - Exports the program ID
 * - Detects Deriverse txs in log lines
 * - Provides network status
 *
 * Trade parsing is handled by DeriverseTradeService.
 */

import { PROGRAM_ID as DERIVERSE_PROGRAM_ID } from '@deriverse/kit';
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
  message: 'Deriverse DEX is live on devnet. Trade analytics parse real devnet transactions.',
} as const;
