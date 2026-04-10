/**
 * DexPilot LP & Vault Type Definitions
 *
 * Types for Kamino vault positions, Dodo Payments, and LP analytics.
 */

// ── Kamino Vault Types ──────────────────────────────────────────────

export type VaultStrategy = 'concentrated-liquidity' | 'lending' | 'multiply' | 'custom';

export interface TokenInfo {
  mint: string;
  symbol: string;
  decimals: number;
  logoUri?: string;
  priceUsd: number;
}

export interface KaminoVaultInfo {
  address: string;
  name: string;
  strategy: VaultStrategy;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  tvl: number;
  apy: number;
  fees24h: number;
  volume24h: number;
  feeRate: number;       // basis points
  sharesMint: string;
  curator?: string;
  status: 'active' | 'paused' | 'deprecated';
}

export interface KaminoVaultPosition {
  id: string;               // unique position identifier
  vaultAddress: string;
  vaultName: string;
  strategy: VaultStrategy;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  sharesOwned: number;
  sharePrice: number;       // current price per share in USD
  depositValueUsd: number;  // value at time of deposit
  currentValueUsd: number;  // current value of position
  yieldEarnedUsd: number;   // total yield earned
  apy: number;              // current vault APY
  impermanentLoss: number;  // IL as percentage (negative = loss)
  impermanentLossUsd: number;
  depositedAt: Date;
  lastUpdated: Date;
}

export interface LPPortfolioSummary {
  totalPositions: number;
  totalDepositedUsd: number;
  totalCurrentValueUsd: number;
  totalYieldEarnedUsd: number;
  totalImpermanentLossUsd: number;
  weightedAvgApy: number;
  bestPerformingVault: string | null;
  worstPerformingVault: string | null;
}

// ── Dodo Payments Types ─────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentCurrency = 'INR' | 'USD' | 'EUR';

export interface DodoPaymentSession {
  sessionId: string;
  amount: number;
  currency: PaymentCurrency;
  status: PaymentStatus;
  usdcAmount: number;       // equivalent USDC to receive
  targetVault?: string;     // Kamino vault to deposit into
  walletAddress: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface FiatToVaultConfig {
  fiatAmount: number;
  fiatCurrency: PaymentCurrency;
  targetVault: KaminoVaultInfo;
  estimatedUsdc: number;
  estimatedShares: number;
  estimatedApy: number;
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

export interface VaultRiskMetrics {
  ilExposure: number;       // 0-100
  volatility: number;       // 0-100
  tvlDepth: number;         // 0-100 (higher = safer)
  strategyRisk: number;     // 0-100
  concentration: number;    // 0-100 (higher = more concentrated)
  timeInProfit: number;     // 0-100 (% of time position was profitable)
}
