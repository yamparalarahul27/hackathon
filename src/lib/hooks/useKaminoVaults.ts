'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  KaminoVaultInfo,
  KaminoVaultPosition,
  LPPortfolioSummary,
} from '../lp-types';

interface UseKaminoVaultsReturn {
  vaults: KaminoVaultInfo[];
  positions: KaminoVaultPosition[];
  summary: LPPortfolioSummary;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

interface KaminoOverviewApiResponse {
  vaults: KaminoVaultInfo[];
  positions: KaminoVaultPosition[];
  summary: LPPortfolioSummary;
  lastUpdated: string;
}

const EMPTY_SUMMARY: LPPortfolioSummary = {
  totalPositions: 0,
  totalCurrentValueUsd: 0,
  weightedAvgApy: 0,
  bestPerformingVault: null,
  worstPerformingVault: null,
};

const CLIENT_REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const CLIENT_CACHE_TTL_MS = 30_000;

const clientCache = new Map<string, { timestamp: number; payload: KaminoOverviewApiResponse }>();
const inFlightCache = new Map<string, Promise<KaminoOverviewApiResponse>>();

function getCacheKey(walletAddress: string | null): string {
  return walletAddress ?? 'anon';
}

async function fetchOverviewFromApi(walletAddress: string | null): Promise<KaminoOverviewApiResponse> {
  const cacheKey = getCacheKey(walletAddress);
  const now = Date.now();
  const cached = clientCache.get(cacheKey);
  if (cached && now - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return cached.payload;
  }

  let inFlight = inFlightCache.get(cacheKey);
  if (!inFlight) {
    const query = walletAddress ? `?wallet=${encodeURIComponent(walletAddress)}` : '';
    inFlight = fetch(`/api/kamino/overview${query}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body?.error ?? 'Unable to fetch vault data.');
        }
        return body as KaminoOverviewApiResponse;
      })
      .finally(() => {
        inFlightCache.delete(cacheKey);
      });

    inFlightCache.set(cacheKey, inFlight);
  }

  const payload = await inFlight;
  clientCache.set(cacheKey, { timestamp: now, payload });
  return payload;
}

function normalizePositions(positions: KaminoVaultPosition[]): KaminoVaultPosition[] {
  return positions.map((position) => ({
    ...position,
    depositedAt: new Date(position.depositedAt),
    lastUpdated: new Date(position.lastUpdated),
  }));
}

/**
 * Hook to fetch Kamino vault data through the server API.
 * Keeps RPC keys on the server and deduplicates client requests with a short cache.
 */
export function useKaminoVaults(walletAddress: string | null): UseKaminoVaultsReturn {
  const [vaults, setVaults] = useState<KaminoVaultInfo[]>([]);
  const [positions, setPositions] = useState<KaminoVaultPosition[]>([]);
  const [summary, setSummary] = useState<LPPortfolioSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchOverviewFromApi(walletAddress);
      setVaults(payload.vaults);
      setPositions(normalizePositions(payload.positions));
      setSummary(payload.summary ?? EMPTY_SUMMARY);
      setLastUpdated(payload.lastUpdated ? new Date(payload.lastUpdated) : new Date());
      setError(null);
    } catch (err) {
      console.error('[useKaminoVaults] Failed to fetch overview:', err);
      setError(err instanceof Error ? err.message : 'Unable to fetch live vault data right now.');
      setVaults([]);
      setPositions([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refresh();

    intervalRef.current = setInterval(() => {
      void refresh();
    }, CLIENT_REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh]);

  return useMemo(
    () => ({ vaults, positions, summary, loading, error, lastUpdated, refresh }),
    [vaults, positions, summary, loading, error, lastUpdated, refresh]
  );
}
