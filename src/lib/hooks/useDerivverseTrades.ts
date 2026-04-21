'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DexTrade } from '../dex-types';

interface UseDeriverseTradesReturn {
  trades: DexTrade[];
  loading: boolean;
  error: string | null;
  network: 'devnet';
  refresh: () => Promise<void>;
}

interface ApiResponse {
  network: string;
  wallet: string;
  trades: Array<DexTrade & { openedAt: string; closedAt: string }>;
  tradeCount: number;
  fetchedAt: string;
  error?: string;
}

export function useDerivverseTrades(walletAddress: string | null): UseDeriverseTradesReturn {
  const [trades, setTrades] = useState<DexTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setTrades([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dex/deriverse/trades?wallet=${encodeURIComponent(walletAddress)}`,
        { cache: 'no-store' }
      );
      const body: ApiResponse = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);

      // Rehydrate Date objects
      const parsed: DexTrade[] = (body.trades ?? []).map((t) => ({
        ...t,
        openedAt: new Date(t.openedAt),
        closedAt: new Date(t.closedAt),
      }));
      setTrades(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { void refresh(); }, [refresh]);

  return useMemo(
    () => ({ trades, loading, error, network: 'devnet' as const, refresh }),
    [trades, loading, error, refresh]
  );
}
