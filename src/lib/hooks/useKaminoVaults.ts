'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  KaminoVaultInfo,
  KaminoVaultPosition,
  LPPortfolioSummary,
} from '../lp-types';
import {
  MOCK_KAMINO_VAULTS,
  MOCK_KAMINO_POSITIONS,
  MOCK_PORTFOLIO_SUMMARY,
} from '../mockKaminoData';
import { HELIUS_RPC_URL } from '../constants';

interface UseKaminoVaultsReturn {
  vaults: KaminoVaultInfo[];
  positions: KaminoVaultPosition[];
  summary: LPPortfolioSummary;
  loading: boolean;
  error: string | null;
  isUsingMockData: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch Kamino vault data for a connected wallet.
 *
 * When a wallet is connected, attempts to fetch real data from Kamino SDK.
 * Falls back to mock data if:
 *  - No wallet connected
 *  - RPC/SDK call fails
 *  - User has no Kamino positions
 */
export function useKaminoVaults(walletAddress: string | null): UseKaminoVaultsReturn {
  const [vaults, setVaults] = useState<KaminoVaultInfo[]>(MOCK_KAMINO_VAULTS);
  const [positions, setPositions] = useState<KaminoVaultPosition[]>(MOCK_KAMINO_POSITIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(true);

  const fetchData = useCallback(async () => {
    if (!walletAddress) {
      setVaults(MOCK_KAMINO_VAULTS);
      setPositions(MOCK_KAMINO_POSITIONS);
      setIsUsingMockData(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Dynamically import to avoid SSR issues with @solana/kit
      const { KaminoVaultService } = await import('@/services/KaminoVaultService');

      // Use mainnet RPC — Helius or fallback
      const rpcUrl = HELIUS_RPC_URL.includes('devnet')
        ? 'https://api.mainnet-beta.solana.com'
        : HELIUS_RPC_URL;

      const service = new KaminoVaultService(rpcUrl);

      // Fetch user positions first (faster, more relevant)
      const realPositions = await service.getUserPositions(walletAddress);

      if (realPositions.length > 0) {
        setPositions(realPositions);
        setIsUsingMockData(false);

        // Fetch full vault list in background
        service.getVaults().then(realVaults => {
          if (realVaults.length > 0) setVaults(realVaults);
        }).catch(() => { /* vault list fetch is non-critical */ });
      } else {
        // No Kamino positions — show mock data with a note
        console.log('[useKaminoVaults] No Kamino positions found for wallet, using mock data');
        setVaults(MOCK_KAMINO_VAULTS);
        setPositions(MOCK_KAMINO_POSITIONS);
        setIsUsingMockData(true);
      }
    } catch (err) {
      console.error('[useKaminoVaults] Error fetching real data, falling back to mock:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vault data');
      setVaults(MOCK_KAMINO_VAULTS);
      setPositions(MOCK_KAMINO_POSITIONS);
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = useMemo(() => {
    if (isUsingMockData) return MOCK_PORTFOLIO_SUMMARY;

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
  }, [positions, isUsingMockData]);

  return { vaults, positions, summary, loading, error, isUsingMockData, refresh: fetchData };
}
