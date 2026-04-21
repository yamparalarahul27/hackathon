/**
 * Kamino Vault Service — K-Vaults only (single-asset yield vaults).
 *
 * Backed entirely by Kamino's documented REST API (api.kamino.finance).
 * No SDK dependency — aligned with kamino.com/docs.
 *
 *   list:     GET  /kvaults/vaults
 *   metrics:  GET  /kvaults/{addr}/metrics
 *   user:     GET  /kvaults/users/{pubkey}/positions
 *   deposit:  POST /ktx/kvault/deposit  (see KaminoDepositService)
 */

import {
  KaminoVaultInfo,
  KaminoVaultPosition,
  LPPortfolioSummary,
  TokenInfo,
} from '../lib/lp-types';
import { TokenPriceService } from './TokenPriceService';
import { getTokenIcon } from '../lib/tokenIcons';
import { KaminoApiClient, type KVaultMetrics, type KVaultRawState } from './KaminoApiClient';

// Known token metadata. Unknown tokens use a truncated mint as symbol.
const TOKEN_META: Record<string, { symbol: string; decimals: number }> = {
  'So11111111111111111111111111111111111111112':  { symbol: 'SOL',   decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC',  decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT',  decimals: 6 },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'ETH',   decimals: 8 },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN':  { symbol: 'JUP',   decimals: 6 },
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL':  { symbol: 'JTO',   decimals: 9 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK',  decimals: 5 },
  'GSoLRcWKQE5nbWTYFr83Ei3HGjnp9YzQNAFK6VAATg3':  { symbol: 'GSOL',  decimals: 9 },
  'MFRAGpsaMD4mXT4jNy81byZMtCHuhMp1fyUYDcwLx8a':  { symbol: 'MFRAG', decimals: 6 },
};

const CONCURRENCY = 10;

export class KaminoVaultService {
  private api: KaminoApiClient;
  private priceService: TokenPriceService;

  constructor() {
    this.api = new KaminoApiClient();
    this.priceService = new TokenPriceService();
  }

  /** All live K-Vaults enriched with real APY + TVL. */
  async getVaults(): Promise<KaminoVaultInfo[]> {
    const raw = await this.api.listVaults();
    console.log(`[KaminoVaultService] Listed ${raw.length} k-vaults`);

    // Fetch metrics for every vault in bounded concurrency batches.
    const metricsByAddress = new Map<string, KVaultMetrics>();
    for (let i = 0; i < raw.length; i += CONCURRENCY) {
      const batch = raw.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((v) => this.api.getVaultMetrics(v.address))
      );
      batch.forEach((v, idx) => {
        const m = results[idx];
        if (m) metricsByAddress.set(v.address, m);
      });
    }

    // Fetch token prices as a fallback (when a vault has zero invested and
    // the metrics endpoint lacks a reliable tokenPrice). One batched call.
    const uniqueMints = Array.from(new Set(raw.map((r) => r.state.tokenMint)));
    const priceMap = await this.priceService.getPrices(uniqueMints);

    const vaults: KaminoVaultInfo[] = [];
    for (const v of raw) {
      const m = metricsByAddress.get(v.address);
      if (!m) continue; // drop vaults without metrics (test/empty vaults)

      const tvl = parseFloat(m.tokensAvailableUsd ?? '0') + parseFloat(m.tokensInvestedUsd ?? '0');
      // Require non-trivial TVL + at least one holder — filters out staging/test vaults.
      if (tvl < 1 || m.numberOfHolders < 1) continue;

      const tokenPriceUsd = parseFloat(m.tokenPrice ?? '0') || (priceMap[v.state.tokenMint] ?? 0);
      const token = this.buildTokenInfo(v.state.tokenMint, tokenPriceUsd, v.state.tokenMintDecimals);

      vaults.push({
        address: v.address,
        name: v.state.name?.trim() || `${token.symbol} Vault`,
        token,
        tvl: Math.round(tvl),
        apy: parseFloat((parseFloat(m.apy7d) * 100).toFixed(2)),
        apy24h: parseFloat((parseFloat(m.apy24h) * 100).toFixed(2)),
        apy30d: parseFloat((parseFloat(m.apy30d) * 100).toFixed(2)),
        sharePriceUsd: parseFloat(m.sharePrice ?? '0'),
        holders: m.numberOfHolders,
        performanceFeeBps: v.state.performanceFeeBps ?? 0,
        managementFeeBps: v.state.managementFeeBps ?? 0,
        sharesMint: v.state.sharesMint,
        status: 'active',
      });
    }

    console.log(`[KaminoVaultService] Returning ${vaults.length} active k-vaults`);
    return vaults;
  }

  /** Positions for a given wallet. Accepts preloaded vaults to avoid duplicate fetches. */
  async getUserPositions(
    walletAddress: string,
    preloadedVaults?: KaminoVaultInfo[]
  ): Promise<KaminoVaultPosition[]> {
    const [positions, allVaults] = await Promise.all([
      this.api.getUserPositions(walletAddress).catch(() => []),
      preloadedVaults ? Promise.resolve(preloadedVaults) : this.getVaults(),
    ]);

    if (positions.length === 0) return [];

    const byAddress = new Map(allVaults.map((v) => [v.address, v]));

    const results: KaminoVaultPosition[] = [];
    for (const p of positions) {
      const vault = byAddress.get(p.vaultAddress);
      if (!vault) continue;

      const totalShares = parseFloat(p.totalShares);
      if (!Number.isFinite(totalShares) || totalShares <= 0) continue;

      const currentValueUsd = totalShares * vault.sharePriceUsd;

      results.push({
        id: `${p.vaultAddress}-${walletAddress}`,
        vaultAddress: p.vaultAddress,
        vaultName: vault.name,
        token: vault.token,
        sharesOwned: totalShares,
        sharePriceUsd: vault.sharePriceUsd,
        currentValueUsd: parseFloat(currentValueUsd.toFixed(2)),
        apy: vault.apy,
        depositedAt: new Date(), // unknown without tx history
        lastUpdated: new Date(),
      });
    }
    return results;
  }

  calculateSummary(positions: KaminoVaultPosition[]): LPPortfolioSummary {
    if (positions.length === 0) {
      return {
        totalPositions: 0,
        totalCurrentValueUsd: 0,
        weightedAvgApy: 0,
        bestPerformingVault: null,
        worstPerformingVault: null,
      };
    }

    const totalCurrent = positions.reduce((s, p) => s + p.currentValueUsd, 0);
    const weightedApy = totalCurrent > 0
      ? positions.reduce((s, p) => s + p.apy * (p.currentValueUsd / totalCurrent), 0)
      : 0;

    // Best / worst by APY (pure yield ranking, since we can't compute P&L).
    let bestVault: string | null = null;
    let worstVault: string | null = null;
    let bestApy = -Infinity;
    let worstApy = Infinity;
    for (const p of positions) {
      if (p.apy > bestApy) { bestApy = p.apy; bestVault = p.vaultName; }
      if (p.apy < worstApy) { worstApy = p.apy; worstVault = p.vaultName; }
    }

    return {
      totalPositions: positions.length,
      totalCurrentValueUsd: parseFloat(totalCurrent.toFixed(2)),
      weightedAvgApy: parseFloat(weightedApy.toFixed(2)),
      bestPerformingVault: bestVault,
      worstPerformingVault: worstVault,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private buildTokenInfo(mint: string, priceUsd: number, decimals?: number): TokenInfo {
    const meta = TOKEN_META[mint];
    const symbol = meta?.symbol ?? mint.slice(0, 6);
    return {
      mint,
      symbol,
      decimals: meta?.decimals ?? decimals ?? 9,
      logoUri: getTokenIcon(mint, symbol),
      priceUsd,
    };
  }
}

// Suppress unused type warning in strict mode — re-exported for consumers.
export type { KVaultRawState };
