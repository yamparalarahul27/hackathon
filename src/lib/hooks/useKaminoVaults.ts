'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  KaminoVaultInfo,
  KaminoVaultPosition,
  LPPortfolioSummary,
} from '../lp-types';
import { HELIUS_RPC_URL } from '../constants';

const EMPTY_SUMMARY: LPPortfolioSummary = {
  totalPositions: 0,
  totalDepositedUsd: 0,
  totalCurrentValueUsd: 0,
  totalYieldEarnedUsd: 0,
  totalImpermanentLossUsd: 0,
  weightedAvgApy: 0,
  bestPerformingVault: null,
  worstPerformingVault: null,
};

interface UseKaminoVaultsReturn {
  vaults: KaminoVaultInfo[];
  positions: KaminoVaultPosition[];
  summary: LPPortfolioSummary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch real Kamino vault data.
 * No mock fallback — returns empty arrays + error on failure.
 */
export function useKaminoVaults(walletAddress: string | null): UseKaminoVaultsReturn {
  const [vaults, setVaults] = useState<KaminoVaultInfo[]>([]);
  const [positions, setPositions] = useState<KaminoVaultPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!HELIUS_RPC_URL) {
        throw new Error('NEXT_PUBLIC_HELIUS_RPC_URL is not configured. Set your Helius mainnet RPC URL in environment variables.');
      }

      const { KaminoVaultService } = await import('@/services/KaminoVaultService');
      const service = new KaminoVaultService(HELIUS_RPC_URL);

      // Always fetch vault list (real data for explore page)
      const realVaults = await service.getVaults();
      setVaults(realVaults);

      // Fetch user positions if wallet connected
      if (walletAddress) {
        const realPositions = await service.getUserPositions(walletAddress);
        setPositions(realPositions);
      } else {
        setPositions([]);
      }
    } catch (err) {
      console.error('[useKaminoVaults] RPC error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vault data');
      setVaults([]);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = useMemo(() => {
    if (positions.length === 0) return EMPTY_SUMMARY;

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
  }, [positions]);

  return { vaults, positions, summary, loading, error, refresh: fetchData };
}
