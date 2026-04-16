/**
 * Kamino K-Vault Type Definitions
 *
 * Single-asset yield vaults — user deposits one token, vault allocates
 * across lending reserves for yield. Backed by Kamino's documented REST
 * API at https://api.kamino.finance/kvaults/*.
 */

// ── Kamino K-Vault Types ────────────────────────────────────────────

export interface TokenInfo {
  mint: string;
  symbol: string;
  decimals: number;
  logoUri?: string;
  priceUsd: number;
}

export interface KaminoVaultInfo {
  address: string;
  name: string;             // vault display name from state.name
  token: TokenInfo;         // single deposit token
  tvl: number;              // USD, tokensAvailableUsd + tokensInvestedUsd
  apy: number;              // percent (7-day APY)
  apy24h?: number;
  apy30d?: number;
  sharePriceUsd: number;    // USD per share
  holders: number;          // numberOfHolders from metrics
  performanceFeeBps: number;
  managementFeeBps: number;
  sharesMint: string;
  status: 'active';
}

export interface KaminoVaultPosition {
  id: string;               // unique position identifier
  vaultAddress: string;
  vaultName: string;
  token: TokenInfo;
  sharesOwned: number;
  sharePriceUsd: number;
  currentValueUsd: number;
  apy: number;
  depositedAt: Date;
  lastUpdated: Date;
}

export interface LPPortfolioSummary {
  totalPositions: number;
  totalCurrentValueUsd: number;
  weightedAvgApy: number;
  bestPerformingVault: string | null;
  worstPerformingVault: string | null;
}

// ── Analytics Types ─────────────────────────────────────────────────

export interface VaultPerformancePoint {
  timestamp: Date;
  valueUsd: number;
  yieldAccruedUsd: number;
  apy: number;
}

export interface YieldBreakdown {
  vaultName: string;
  vaultAddress: string;
  yieldUsd: number;
  yieldPercent: number;
  share: number;  // percentage of total portfolio yield
}

// ── Transaction Types (shared by deposit + withdraw) ───────────────

import type { VersionedTransaction } from '@solana/web3.js';

export type SignTransactionFn = (
  tx: VersionedTransaction
) => Promise<VersionedTransaction>;

// ── Withdraw Types ─────────────────────────────────────────────────

export interface WithdrawParams {
  vaultAddress: string;
  userWallet: string;
  /** Shares to withdraw (decimal, NOT raw). */
  shareAmount: number;
}

export interface WithdrawResult {
  txSignature: string;
  vaultAddress: string;
  sharesWithdrawn: number;
}
