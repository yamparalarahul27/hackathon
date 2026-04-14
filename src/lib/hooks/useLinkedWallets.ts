'use client';

import { useCallback, useEffect, useState } from 'react';
import { SupabaseWalletService, type LinkedWallet } from '@/services/SupabaseWalletService';

interface UseLinkedWalletsReturn {
  wallets: LinkedWallet[];
  loading: boolean;
  error: string | null;
  link: (walletAddress: string, label?: string) => Promise<void>;
  unlink: (walletAddress: string) => Promise<void>;
  setLabel: (walletAddress: string, label: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const service = new SupabaseWalletService();

export function useLinkedWallets(ownerAddress: string | null): UseLinkedWalletsReturn {
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerAddress) {
      setWallets([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await service.list(ownerAddress);
      setWallets(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load linked wallets');
    } finally {
      setLoading(false);
    }
  }, [ownerAddress]);

  useEffect(() => { void refresh(); }, [refresh]);

  const link = useCallback(async (walletAddress: string, label?: string) => {
    if (!ownerAddress) throw new Error('Connect a wallet first');
    setError(null);
    try {
      const entry = await service.link(ownerAddress, walletAddress, label);
      setWallets((prev) => [...prev.filter((w) => w.walletAddress !== walletAddress), entry]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link wallet');
      throw err;
    }
  }, [ownerAddress]);

  const unlink = useCallback(async (walletAddress: string) => {
    if (!ownerAddress) return;
    setError(null);
    try {
      await service.unlink(ownerAddress, walletAddress);
      setWallets((prev) => prev.filter((w) => w.walletAddress !== walletAddress));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink wallet');
      throw err;
    }
  }, [ownerAddress]);

  const setLabel = useCallback(async (walletAddress: string, label: string) => {
    if (!ownerAddress) return;
    setError(null);
    try {
      await service.setLabel(ownerAddress, walletAddress, label);
      setWallets((prev) =>
        prev.map((w) => (w.walletAddress === walletAddress ? { ...w, label } : w))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update label');
      throw err;
    }
  }, [ownerAddress]);

  return { wallets, loading, error, link, unlink, setLabel, refresh };
}
