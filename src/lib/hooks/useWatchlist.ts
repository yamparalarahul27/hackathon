'use client';

import { useCallback, useEffect, useState } from 'react';
import { SupabaseWatchlistService, type WatchlistEntry } from '@/services/SupabaseWatchlistService';

interface UseWatchlistReturn {
  entries: WatchlistEntry[];
  loading: boolean;
  error: string | null;
  isWatched: (mint: string) => boolean;
  add: (mint: string, symbol?: string) => Promise<void>;
  remove: (mint: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const service = new SupabaseWatchlistService();

export function useWatchlist(walletAddress: string | null): UseWatchlistReturn {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await service.list(walletAddress);
      setEntries(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { void refresh(); }, [refresh]);

  const add = useCallback(async (mint: string, symbol?: string) => {
    if (!walletAddress) throw new Error('Connect a wallet to use the watchlist');
    setError(null);
    try {
      const entry = await service.add(walletAddress, mint, symbol);
      setEntries((prev) => [entry, ...prev.filter((e) => e.mint !== mint)]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to watchlist';
      setError(message);
      throw err;
    }
  }, [walletAddress]);

  const remove = useCallback(async (mint: string) => {
    if (!walletAddress) return;
    setError(null);
    try {
      await service.remove(walletAddress, mint);
      setEntries((prev) => prev.filter((e) => e.mint !== mint));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove from watchlist';
      setError(message);
      throw err;
    }
  }, [walletAddress]);

  const isWatched = useCallback(
    (mint: string) => entries.some((e) => e.mint === mint),
    [entries]
  );

  return { entries, loading, error, isWatched, add, remove, refresh };
}
