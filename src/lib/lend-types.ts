/**
 * Kamino Lending (klend) types.
 * Mirrors what kamino.com/lend displays per reserve.
 */

export interface LendingReserve {
  /** Reserve account address */
  address: string;
  /** Liquidity token mint */
  mint: string;
  /** Token symbol (from on-chain config) */
  symbol: string;
  /** Token decimals */
  decimals: number;
  /** Oracle price in USD */
  priceUsd: number;
  /** Supply APY (decimal, e.g. 0.054 = 5.4%) */
  supplyApy: number;
  /** Borrow APY (decimal) */
  borrowApy: number;
  /** Total deposited in USD */
  totalSupplyUsd: number;
  /** Total borrowed in USD */
  totalBorrowUsd: number;
  /** Utilization ratio (0..1) */
  utilization: number;
  /** Loan-to-value (0..1) */
  loanToValue: number;
  /** Liquidation threshold (0..1) */
  liquidationThreshold: number;
  /** Active / inactive / hidden */
  status: string;
}

export interface LendingMarketSummary {
  marketAddress: string;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  reserveCount: number;
}

export interface LendingMarketSnapshot {
  market: LendingMarketSummary;
  reserves: LendingReserve[];
  lastUpdated: string;
}
