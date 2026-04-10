/**
 * Mock Kamino vault data for development and demo purposes.
 * Follows the same SeededRandom pattern as mockData.ts for determinism.
 */

import {
  KaminoVaultInfo,
  KaminoVaultPosition,
  LPPortfolioSummary,
  TokenInfo,
  VaultPerformancePoint,
  YieldBreakdown,
  VaultRiskMetrics,
} from './lp-types';

const SEED = 456;

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  range(min: number, max: number): number { return min + this.next() * (max - min); }
  int(min: number, max: number): number { return Math.floor(this.range(min, max + 1)); }
  pick<T>(arr: T[]): T { return arr[this.int(0, arr.length - 1)]; }
}

// ── Token definitions ───────────────────────────────────────────────

const TOKENS: Record<string, TokenInfo> = {
  SOL:  { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL',  decimals: 9, priceUsd: 178.50, logoUri: '/tokens/sol.png' },
  USDC: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', decimals: 6, priceUsd: 1.00,   logoUri: '/tokens/usdc.png' },
  USDT: { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', decimals: 6, priceUsd: 1.00,   logoUri: '/tokens/usdt.png' },
  ETH:  { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', symbol: 'ETH',  decimals: 8, priceUsd: 3420.00, logoUri: '/tokens/eth.png' },
  JUP:  { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  symbol: 'JUP',  decimals: 6, priceUsd: 1.15,   logoUri: '/tokens/jup.png' },
  JTO:  { mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',  symbol: 'JTO',  decimals: 9, priceUsd: 4.20,   logoUri: '/tokens/jto.png' },
  BONK: { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', decimals: 5, priceUsd: 0.000035, logoUri: '/tokens/bonk.png' },
};

// ── Mock Kamino Vaults ──────────────────────────────────────────────

const VAULT_TEMPLATES = [
  { name: 'SOL-USDC Concentrated', tokenA: 'SOL', tokenB: 'USDC', strategy: 'concentrated-liquidity' as const, apyRange: [15, 45], tvlRange: [8_000_000, 50_000_000], feeRate: 25 },
  { name: 'SOL-USDT Stable',      tokenA: 'SOL', tokenB: 'USDT', strategy: 'concentrated-liquidity' as const, apyRange: [12, 35], tvlRange: [3_000_000, 20_000_000], feeRate: 20 },
  { name: 'ETH-USDC Concentrated', tokenA: 'ETH', tokenB: 'USDC', strategy: 'concentrated-liquidity' as const, apyRange: [10, 30], tvlRange: [5_000_000, 30_000_000], feeRate: 25 },
  { name: 'JUP-USDC Active',      tokenA: 'JUP', tokenB: 'USDC', strategy: 'concentrated-liquidity' as const, apyRange: [20, 60], tvlRange: [1_000_000, 10_000_000], feeRate: 30 },
  { name: 'JTO-USDC Yield',       tokenA: 'JTO', tokenB: 'USDC', strategy: 'concentrated-liquidity' as const, apyRange: [18, 50], tvlRange: [500_000, 5_000_000],    feeRate: 30 },
  { name: 'BONK-SOL Degen',       tokenA: 'BONK',tokenB: 'SOL',  strategy: 'concentrated-liquidity' as const, apyRange: [30, 90], tvlRange: [200_000, 3_000_000],    feeRate: 50 },
  { name: 'USDC Lending',         tokenA: 'USDC',tokenB: 'USDC', strategy: 'lending' as const,                apyRange: [5, 12],  tvlRange: [20_000_000, 100_000_000], feeRate: 10 },
  { name: 'SOL Multiply 3x',      tokenA: 'SOL', tokenB: 'USDC', strategy: 'multiply' as const,               apyRange: [25, 80], tvlRange: [1_000_000, 15_000_000],  feeRate: 35 },
];

function generateVaults(rng: SeededRandom): KaminoVaultInfo[] {
  return VAULT_TEMPLATES.map((tmpl, i) => {
    const apy = rng.range(tmpl.apyRange[0], tmpl.apyRange[1]);
    const tvl = rng.range(tmpl.tvlRange[0], tmpl.tvlRange[1]);
    return {
      address: `vault${String(i).padStart(3, '0')}${'x'.repeat(32)}`,
      name: tmpl.name,
      strategy: tmpl.strategy,
      tokenA: TOKENS[tmpl.tokenA],
      tokenB: TOKENS[tmpl.tokenB],
      tvl: Math.round(tvl),
      apy: parseFloat(apy.toFixed(2)),
      fees24h: Math.round(tvl * (apy / 100) / 365),
      volume24h: Math.round(tvl * rng.range(0.05, 0.3)),
      feeRate: tmpl.feeRate,
      sharesMint: `shares${String(i).padStart(3, '0')}${'y'.repeat(32)}`,
      curator: rng.pick(['Gauntlet', 'Allez Labs', 'Steakhouse', 'Rockaway', undefined]),
      status: 'active' as const,
    };
  });
}

// ── Mock User Positions ─────────────────────────────────────────────

function generatePositions(rng: SeededRandom, vaults: KaminoVaultInfo[]): KaminoVaultPosition[] {
  // User has positions in 5 of 8 vaults
  const selectedVaults = vaults.slice(0, 5);

  return selectedVaults.map((vault, i) => {
    const depositUsd = rng.range(500, 25000);
    const daysHeld = rng.int(7, 120);
    const dailyYield = vault.apy / 365 / 100;
    const yieldMultiplier = 1 + dailyYield * daysHeld;
    const ilPercent = vault.strategy === 'lending' ? 0 : -rng.range(0.2, 5.0);
    const ilUsd = depositUsd * (ilPercent / 100);
    const currentValue = depositUsd * yieldMultiplier + ilUsd;
    const yieldEarned = currentValue - depositUsd - ilUsd;

    const depositDate = new Date();
    depositDate.setDate(depositDate.getDate() - daysHeld);

    return {
      id: `pos-${i}-${vault.address.slice(0, 8)}`,
      vaultAddress: vault.address,
      vaultName: vault.name,
      strategy: vault.strategy,
      tokenA: vault.tokenA,
      tokenB: vault.tokenB,
      sharesOwned: rng.range(100, 10000),
      sharePrice: currentValue / rng.range(100, 10000),
      depositValueUsd: parseFloat(depositUsd.toFixed(2)),
      currentValueUsd: parseFloat(currentValue.toFixed(2)),
      yieldEarnedUsd: parseFloat(yieldEarned.toFixed(2)),
      apy: vault.apy,
      impermanentLoss: parseFloat(ilPercent.toFixed(2)),
      impermanentLossUsd: parseFloat(ilUsd.toFixed(2)),
      depositedAt: depositDate,
      lastUpdated: new Date(),
    };
  });
}

// ── Portfolio Summary ───────────────────────────────────────────────

function calculateSummary(positions: KaminoVaultPosition[]): LPPortfolioSummary {
  const totalDeposited = positions.reduce((s, p) => s + p.depositValueUsd, 0);
  const totalCurrent = positions.reduce((s, p) => s + p.currentValueUsd, 0);
  const totalYield = positions.reduce((s, p) => s + p.yieldEarnedUsd, 0);
  const totalIL = positions.reduce((s, p) => s + p.impermanentLossUsd, 0);
  const weightedApy = positions.reduce((s, p) => s + p.apy * (p.currentValueUsd / totalCurrent), 0);

  let bestVault: string | null = null;
  let worstVault: string | null = null;
  let bestReturn = -Infinity;
  let worstReturn = Infinity;

  for (const p of positions) {
    const ret = (p.currentValueUsd - p.depositValueUsd) / p.depositValueUsd;
    if (ret > bestReturn) { bestReturn = ret; bestVault = p.vaultName; }
    if (ret < worstReturn) { worstReturn = ret; worstVault = p.vaultName; }
  }

  return {
    totalPositions: positions.length,
    totalDepositedUsd: parseFloat(totalDeposited.toFixed(2)),
    totalCurrentValueUsd: parseFloat(totalCurrent.toFixed(2)),
    totalYieldEarnedUsd: parseFloat(totalYield.toFixed(2)),
    totalImpermanentLossUsd: parseFloat(totalIL.toFixed(2)),
    weightedAvgApy: parseFloat(weightedApy.toFixed(2)),
    bestPerformingVault: bestVault,
    worstPerformingVault: worstVault,
  };
}

// ── Performance History ─────────────────────────────────────────────

export function generatePerformanceHistory(position: KaminoVaultPosition): VaultPerformancePoint[] {
  const rng = new SeededRandom(789);
  const days = Math.ceil((Date.now() - position.depositedAt.getTime()) / (86400000));
  const points: VaultPerformancePoint[] = [];
  const dailyYield = position.apy / 365 / 100;

  for (let d = 0; d <= days; d++) {
    const date = new Date(position.depositedAt);
    date.setDate(date.getDate() + d);
    const noise = 1 + (rng.next() - 0.5) * 0.02; // ±1% daily noise
    const growthFactor = 1 + dailyYield * d * noise;
    const value = position.depositValueUsd * growthFactor;
    const yield$ = value - position.depositValueUsd;

    points.push({
      timestamp: date,
      valueUsd: parseFloat(value.toFixed(2)),
      yieldAccruedUsd: parseFloat(yield$.toFixed(2)),
      apy: position.apy + (rng.next() - 0.5) * 5, // APY fluctuation
    });
  }
  return points;
}

// ── Yield Breakdown ─────────────────────────────────────────────────

export function calculateYieldBreakdown(positions: KaminoVaultPosition[]): YieldBreakdown[] {
  const totalYield = positions.reduce((s, p) => s + p.yieldEarnedUsd, 0);
  return positions.map(p => ({
    vaultName: p.vaultName,
    vaultAddress: p.vaultAddress,
    yieldUsd: p.yieldEarnedUsd,
    yieldPercent: p.depositValueUsd > 0 ? (p.yieldEarnedUsd / p.depositValueUsd) * 100 : 0,
    share: totalYield > 0 ? (p.yieldEarnedUsd / totalYield) * 100 : 0,
  }));
}

// ── Risk Metrics ────────────────────────────────────────────────────

export function calculateVaultRisk(position: KaminoVaultPosition): VaultRiskMetrics {
  const rng = new SeededRandom(position.id.charCodeAt(4));

  // Higher IL = higher risk
  const ilExposure = Math.min(100, Math.abs(position.impermanentLoss) * 20);

  // Strategy-based risk
  const strategyRisk = position.strategy === 'lending' ? 15
    : position.strategy === 'multiply' ? 75
    : 45;

  return {
    ilExposure: parseFloat(ilExposure.toFixed(0)),
    volatility: parseFloat(rng.range(20, 70).toFixed(0)),
    tvlDepth: parseFloat(rng.range(40, 90).toFixed(0)),
    strategyRisk,
    concentration: parseFloat(rng.range(30, 80).toFixed(0)),
    timeInProfit: parseFloat(rng.range(55, 95).toFixed(0)),
  };
}

// ── Exports ─────────────────────────────────────────────────────────

const rng = new SeededRandom(SEED);
export const MOCK_KAMINO_VAULTS = generateVaults(rng);
export const MOCK_KAMINO_POSITIONS = generatePositions(rng, MOCK_KAMINO_VAULTS);
export const MOCK_PORTFOLIO_SUMMARY = calculateSummary(MOCK_KAMINO_POSITIONS);
export { TOKENS };
