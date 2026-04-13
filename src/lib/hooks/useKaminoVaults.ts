'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

const VAULT_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

interface UseKaminoVaultsReturn {
  vaults: KaminoVaultInfo[];
  positions: KaminoVaultPosition[];
  summary: LPPortfolioSummary;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch real Kamino vault data.
 *
 * - General vaults: fetched on mount and refreshed every 1 hour.
 * - User positions: fetched only when a wallet is connected.
 * - No mock fallback — returns empty arrays + error on failure.
 */
export function useKaminoVaults(walletAddress: string | null): UseKaminoVaultsReturn {
  const [vaults, setVaults] = useState<KaminoVaultInfo[]>([]);
  const [positions, setPositions] = useState<KaminoVaultPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch general vault list (no wallet needed)
  const fetchVaults = useCallback(async () => {
    if (!HELIUS_RPC_URL) {
      setError('NEXT_PUBLIC_HELIUS_RPC_URL is not configured. Set your Helius mainnet RPC URL in environment variables.');
      setLoading(false);
      return;
    }

    try {
      const { KaminoVaultService } = await import('@/services/KaminoVaultService');
      const service = new KaminoVaultService(HELIUS_RPC_URL);
      const realVaults = await service.getVaults();
      setVaults(realVaults);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[useKaminoVaults] RPC error fetching vaults:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vault data');
      setVaults([]);
    }
  }, []);

  // Fetch user positions (only when wallet is connected)
  const fetchPositions = useCallback(async (wallet: string) => {
    if (!HELIUS_RPC_URL) return;

    try {
      const { KaminoVaultService } = await import('@/services/KaminoVaultService');
      const service = new KaminoVaultService(HELIUS_RPC_URL);
      const realPositions = await service.getUserPositions(wallet);
      setPositions(realPositions);
    } catch (err) {
      console.error('[useKaminoVaults] RPC error fetching positions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet positions');
      setPositions([]);
    }
  }, []);

  // Full fetch: vaults + positions if wallet connected
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchVaults();
    if (walletAddress) {
      await fetchPositions(walletAddress);
    }
    setLoading(false);
  }, [fetchVaults, fetchPositions, walletAddress]);

  // Initial fetch + 1hr interval for general vaults
  useEffect(() => {
    fetchVaults().then(() => setLoading(false));

    intervalRef.current = setInterval(fetchVaults, VAULT_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchVaults]);

  // Fetch user positions when wallet connects/changes
  useEffect(() => {
    if (walletAddress) {
      fetchPositions(walletAddress);
    } else {
      setPositions([]);
    }
  }, [walletAddress, fetchPositions]);

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

  return { vaults, positions, summary, loading, error, lastUpdated, refresh };
}
