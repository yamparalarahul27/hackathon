/**
 * Kamino Vault Service
 *
 * Integrates with Kamino's kliquidity-sdk to fetch real vault data,
 * user positions, share prices, and strategy details from mainnet.
 *
 * APY enriched via Kamino's free REST API (no key required):
 * GET https://api.kamino.finance/strategies/{address}/metrics?env=mainnet-beta
 */

import { Kamino, type KaminoPosition, type ShareDataWithAddress } from '@kamino-finance/kliquidity-sdk';
import { createSolanaRpc } from '@solana/kit';
import {
  KaminoVaultInfo,
  KaminoVaultPosition,
  LPPortfolioSummary,
  TokenInfo,
  VaultStrategy,
} from '../lib/lp-types';
import { TokenPriceService } from './TokenPriceService';
import { getTokenIcon } from '../lib/tokenIcons';

// Known token decimals + symbols. Logos resolved via getTokenIcon (CDN).
const TOKEN_META: Record<string, { symbol: string; decimals: number }> = {
  'So11111111111111111111111111111111111111112':  { symbol: 'SOL',  decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', decimals: 6 },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'ETH',  decimals: 8 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN':  { symbol: 'JUP',  decimals: 6 },
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL':  { symbol: 'JTO',  decimals: 9 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', decimals: 5 },
};

export class KaminoVaultService {
  private kamino: Kamino;
  private priceService: TokenPriceService;

  constructor(rpcUrl: string) {
    const rpc = createSolanaRpc(rpcUrl);
    // Type assertion needed: @solana/kit version mismatch between our deps and Kamino's bundled deps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.kamino = new Kamino('mainnet-beta', rpc as any);
    this.priceService = new TokenPriceService();
  }

  /**
   * Fetch all live Kamino vault strategies with share data.
   */
  async getVaults(): Promise<KaminoVaultInfo[]> {
    console.log('[KaminoVaultService] Fetching all live strategies...');

    const shareDataList: ShareDataWithAddress[] = await this.kamino.getStrategyShareDataForStrategies({
      strategyCreationStatus: 'LIVE',
    });

    console.log(`[KaminoVaultService] Found ${shareDataList.length} live strategies`);

    // Collect all unique token mints to batch-fetch prices
    const mints = new Set<string>();
    for (const sd of shareDataList) {
      const strategy = sd.strategy;
      mints.add(strategy.tokenAMint.toString());
      mints.add(strategy.tokenBMint.toString());
    }

    const prices = await this.priceService.getPrices([...mints]);

    const vaults: KaminoVaultInfo[] = [];

    for (const sd of shareDataList) {
      try {
        const strategy = sd.strategy;
        const address = sd.address.toString();
        const tokenAMint = strategy.tokenAMint.toString();
        const tokenBMint = strategy.tokenBMint.toString();

        const tokenA = this.buildTokenInfo(tokenAMint, prices[tokenAMint] ?? 0);
        const tokenB = this.buildTokenInfo(tokenBMint, prices[tokenBMint] ?? 0);

        // Calculate TVL from share data
        const tokenAAmount = sd.shareData.balance.tokenAAmounts;
        const tokenBAmount = sd.shareData.balance.tokenBAmounts;

        const tvl = tokenAAmount.mul(prices[tokenAMint] ?? 0)
          .add(tokenBAmount.mul(prices[tokenBMint] ?? 0))
          .toNumber();

        // Determine strategy type from on-chain strategy metadata.
        const strategyType = this.inferStrategy(strategy);
        const feeRate = this.extractFeeRate(strategy);

        vaults.push({
          address,
          name: `${tokenA.symbol}-${tokenB.symbol} ${this.strategyLabel(strategyType)}`,
          strategy: strategyType,
          tokenA,
          tokenB,
          tvl: Math.round(tvl),
          apy: 0,       // enriched below from Kamino REST API
          fees24h: 0,    // enriched below
          volume24h: 0,  // enriched below
          feeRate,
          sharesMint: strategy.sharesMint.toString(),
          status: 'active',
        });
      } catch (err) {
        console.warn('[KaminoVaultService] Error processing strategy:', err);
      }
    }

    // Enrich top vaults (by TVL) with real APY from Kamino REST API
    await this.enrichWithMetrics(vaults);

    return vaults;
  }

  /**
   * Fetch APY + metrics from Kamino's free REST API for the top vaults.
   * Only fetches the top N by TVL to avoid excessive API calls.
   */
  private async enrichWithMetrics(vaults: KaminoVaultInfo[], topN = 100): Promise<void> {
    const sorted = [...vaults].sort((a, b) => b.tvl - a.tvl);
    const toEnrich = sorted.slice(0, topN);

    const CONCURRENCY = 10;
    interface MetricsResult {
      apy: number;
      tvl: number;
      fees24h: number;
      tokenASymbol: string | null;
      tokenBSymbol: string | null;
    }
    const results = new Map<string, MetricsResult>();

    for (let i = 0; i < toEnrich.length; i += CONCURRENCY) {
      const batch = toEnrich.slice(i, i + CONCURRENCY);
      const fetches = batch.map(async (vault) => {
        try {
          const res = await fetch(
            `https://api.kamino.finance/strategies/${vault.address}/metrics?env=mainnet-beta`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (!res.ok) return;
          const data = await res.json();

          // Use 7-day APY (stable, matches kamino.finance UI)
          // Kamino returns decimal: 0.5549 = 55.49%. Multiply by 100 for display.
          const apy7d = parseFloat(data?.kaminoApy?.vault?.apy7d ?? '0');
          const apyPercent = apy7d * 100;

          // Use API's TVL (correctly computed) instead of our on-chain math
          const apiTvl = parseFloat(data?.totalValueLocked ?? '0');

          // Estimate 24h fees from feeApr and the corrected TVL
          const feeApr = parseFloat(data?.apy?.vault?.feeApr ?? '0');
          const fees24h = feeApr > 0 && apiTvl > 0 ? apiTvl * feeApr / 365 : 0;

          results.set(vault.address, {
            apy: apyPercent,
            tvl: apiTvl,
            fees24h,
            tokenASymbol: data?.tokenA ?? null,
            tokenBSymbol: data?.tokenB ?? null,
          });
        } catch {
          // Silent — vault keeps defaults if fetch fails
        }
      });
      await Promise.all(fetches);
    }

    // Apply enrichment
    for (const vault of vaults) {
      const enriched = results.get(vault.address);
      if (enriched) {
        vault.apy = parseFloat(enriched.apy.toFixed(2));
        vault.fees24h = Math.round(enriched.fees24h);
        // Override TVL with API's correctly computed value
        if (enriched.tvl > 0) vault.tvl = Math.round(enriched.tvl);
        // Fix token symbols for tokens not in our hardcoded map
        if (enriched.tokenASymbol && vault.tokenA.symbol === vault.tokenA.mint.slice(0, 6)) {
          vault.tokenA.symbol = enriched.tokenASymbol;
          vault.name = `${vault.tokenA.symbol}-${vault.tokenB.symbol} ${this.strategyLabel(vault.strategy)}`;
        }
        if (enriched.tokenBSymbol && vault.tokenB.symbol === vault.tokenB.mint.slice(0, 6)) {
          vault.tokenB.symbol = enriched.tokenBSymbol;
          vault.name = `${vault.tokenA.symbol}-${vault.tokenB.symbol} ${this.strategyLabel(vault.strategy)}`;
        }
      }
    }

    console.log(`[KaminoVaultService] Enriched ${results.size}/${vaults.length} vaults with real APY`);
  }

  /**
   * Fetch user's Kamino vault positions.
   */
  async getUserPositions(walletAddress: string): Promise<KaminoVaultPosition[]> {
    console.log(`[KaminoVaultService] Fetching positions for ${walletAddress}...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const positions: KaminoPosition[] = await (this.kamino as any).getUserPositions(
      walletAddress,
      { strategyCreationStatus: 'LIVE' }
    );

    console.log(`[KaminoVaultService] Found ${positions.length} positions`);

    if (positions.length === 0) return [];

    const positionSnapshots = await Promise.all(
      positions.map(async (position) => {
        try {
          const [shareData, strategy] = await Promise.all([
            this.kamino.getStrategyShareData(position.strategy),
            this.kamino.getStrategyByAddress(position.strategy),
          ]);

          if (!strategy) return null;

          return { position, shareData, strategy };
        } catch (err) {
          console.warn('[KaminoVaultService] Error loading position snapshot:', position.strategy.toString(), err);
          return null;
        }
      })
    );

    const validSnapshots = positionSnapshots.filter(
      (snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null
    );

    const mintSet = new Set<string>();
    for (const snapshot of validSnapshots) {
      mintSet.add(snapshot.strategy.tokenAMint.toString());
      mintSet.add(snapshot.strategy.tokenBMint.toString());
    }
    const prices = await this.priceService.getPrices([...mintSet]);

    const positionResults = validSnapshots.map(({ position, shareData, strategy }) => {
      const tokenAMint = strategy.tokenAMint.toString();
      const tokenBMint = strategy.tokenBMint.toString();
      const tokenA = this.buildTokenInfo(tokenAMint, prices[tokenAMint] ?? 0);
      const tokenB = this.buildTokenInfo(tokenBMint, prices[tokenBMint] ?? 0);

      const sharePriceUsd = shareData.price.toNumber();
      const sharesOwned = position.sharesAmount.toNumber();
      const currentValueUsd = sharesOwned * sharePriceUsd;
      const strategyType = this.inferStrategy(strategy);

      return {
        id: `${position.strategy}-${position.shareMint}`,
        vaultAddress: position.strategy.toString(),
        vaultName: `${tokenA.symbol}-${tokenB.symbol} ${this.strategyLabel(strategyType)}`,
        strategy: strategyType,
        tokenA,
        tokenB,
        sharesOwned,
        sharePrice: sharePriceUsd,
        // Only real on-chain values — no fake deposit/yield/IL
        depositValueUsd: 0,          // unknown without tx history
        currentValueUsd: parseFloat(currentValueUsd.toFixed(2)),
        yieldEarnedUsd: 0,           // unknown without tx history
        apy: 0,                      // enriched below
        impermanentLoss: 0,          // unknown without historical prices
        impermanentLossUsd: 0,
        depositedAt: new Date(),     // unknown without tx history
        lastUpdated: new Date(),
      };
    });

    // Enrich positions with real APY from Kamino REST API
    const posVaults: KaminoVaultInfo[] = positionResults.map((p) => ({
      address: p.vaultAddress, name: p.vaultName, strategy: p.strategy,
      tokenA: p.tokenA, tokenB: p.tokenB, tvl: 0, apy: 0, fees24h: 0,
      volume24h: 0, feeRate: 0, sharesMint: '', status: 'active',
    }));
    await this.enrichWithMetrics(posVaults, posVaults.length);
    for (const pos of positionResults) {
      const enriched = posVaults.find((v) => v.address === pos.vaultAddress);
      if (enriched) pos.apy = enriched.apy;
    }

    return positionResults;
  }

  /**
   * Calculate portfolio summary from positions.
   */
  calculateSummary(positions: KaminoVaultPosition[]): LPPortfolioSummary {
    if (positions.length === 0) {
      return {
        totalPositions: 0,
        totalDepositedUsd: 0,
        totalCurrentValueUsd: 0,
        totalYieldEarnedUsd: 0,
        totalImpermanentLossUsd: 0,
        weightedAvgApy: 0,
        bestPerformingVault: null,
        worstPerformingVault: null,
      };
    }

    const totalDeposited = positions.reduce((s, p) => s + p.depositValueUsd, 0);
    const totalCurrent = positions.reduce((s, p) => s + p.currentValueUsd, 0);
    const totalYield = positions.reduce((s, p) => s + p.yieldEarnedUsd, 0);
    const totalIL = positions.reduce((s, p) => s + p.impermanentLossUsd, 0);
    const weightedApy = totalCurrent > 0
      ? positions.reduce((s, p) => s + p.apy * (p.currentValueUsd / totalCurrent), 0)
      : 0;

    let bestVault: string | null = null;
    let worstVault: string | null = null;
    let bestReturn = -Infinity;
    let worstReturn = Infinity;

    for (const p of positions) {
      const ret = p.depositValueUsd > 0 ? (p.currentValueUsd - p.depositValueUsd) / p.depositValueUsd : 0;
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

  // ── Helpers ─────────────────────────────────────────────────────────

  private buildTokenInfo(mint: string, priceUsd: number): TokenInfo {
    const meta = TOKEN_META[mint];
    const symbol = meta?.symbol ?? mint.slice(0, 6);
    return {
      mint,
      symbol,
      decimals: meta?.decimals ?? 9,
      logoUri: getTokenIcon(mint, symbol),
      priceUsd,
    };
  }

  private extractFeeRate(strategy: unknown): number {
    if (!strategy || typeof strategy !== 'object') return 0;

    const feeBps = Reflect.get(strategy, 'feeBps');
    if (typeof feeBps === 'number' && Number.isFinite(feeBps)) return feeBps;
    if (typeof feeBps === 'bigint') return Number(feeBps);
    return 0;
  }

  private inferStrategy(strategy: unknown): VaultStrategy {
    if (!strategy || typeof strategy !== 'object') {
      return 'concentrated-liquidity';
    }

    const strategyType = Reflect.get(strategy, 'strategyType');
    if (strategyType) {
      const typeStr = this.strategyTypeToString(strategyType);
      if (typeStr.includes('lending')) return 'lending';
      if (typeStr.includes('multiply') || typeStr.includes('leverage')) return 'multiply';
    }
    return 'concentrated-liquidity';
  }

  private strategyTypeToString(strategyType: unknown): string {
    try {
      if (typeof strategyType === 'string') return strategyType.toLowerCase();
      if (typeof strategyType === 'bigint') return strategyType.toString();
      if (strategyType && typeof strategyType === 'object') {
        return JSON.stringify(
          strategyType,
          (_key, value) => (typeof value === 'bigint' ? value.toString() : value)
        ).toLowerCase();
      }
      return String(strategyType).toLowerCase();
    } catch {
      return String(strategyType).toLowerCase();
    }
  }

  private strategyLabel(strategy: VaultStrategy): string {
    switch (strategy) {
      case 'concentrated-liquidity': return 'CL Vault';
      case 'lending': return 'Lending';
      case 'multiply': return 'Multiply';
      default: return 'Vault';
    }
  }
}
