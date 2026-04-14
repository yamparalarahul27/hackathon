'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NftAsset } from '@/services/HeliusNftService';

interface UseNftHoldingsReturn {
  nfts: NftAsset[];
  total: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNftHoldings(walletAddress: string | null): UseNftHoldingsReturn {
  const [nfts, setNfts] = useState<NftAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) { setNfts([]); setTotal(0); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nft/holdings?wallet=${encodeURIComponent(walletAddress)}`, { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setNfts(body.nfts ?? []);
      setTotal(body.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { void refresh(); }, [refresh]);

  return useMemo(
    () => ({ nfts, total, loading, error, refresh }),
    [nfts, total, loading, error, refresh]
  );
}
