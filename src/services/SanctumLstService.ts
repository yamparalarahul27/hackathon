/**
 * Sanctum LST Service
 *
 * Uses @glamsystems/sanctum-lst-list to identify LSTs (Liquid Staking Tokens)
 * and enrich vault context with staking metadata.
 *
 * The HTTP API (sanctum-api.ironforge.network) is origin-gated → 403.
 * So we use the static TOML-based registry + on-chain pool reads.
 */

import { LstList, type LST } from '@glamsystems/sanctum-lst-list';

// Build a mint → LST lookup (static, ~245 entries)
const LST_BY_MINT = new Map<string, LST>();
for (const lst of LstList) {
  LST_BY_MINT.set(lst.mint, lst);
}

/**
 * Check if a mint address is a known Sanctum LST.
 */
export function isLst(mint: string): boolean {
  return LST_BY_MINT.has(mint);
}

/**
 * Get LST metadata for a mint, or null if not an LST.
 */
export function getLstInfo(mint: string): LST | null {
  return LST_BY_MINT.get(mint) ?? null;
}

/**
 * Get all known LSTs (for directory page later).
 */
export function getAllLsts(): LST[] {
  return LstList;
}

/**
 * Given two vault token mints, return which (if any) are LSTs.
 */
export function identifyVaultLsts(
  mintA: string,
  mintB: string
): { tokenA: LST | null; tokenB: LST | null; hasLst: boolean } {
  const tokenA = getLstInfo(mintA);
  const tokenB = getLstInfo(mintB);
  return { tokenA, tokenB, hasLst: !!(tokenA || tokenB) };
}

export type { LST };
