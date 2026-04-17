'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useWalletConnection } from './useWalletConnection';
import {
  UmbraService,
  type EncryptedBalance,
  type WalletAdapterSigner,
} from '@/services/UmbraService';
import {
  UMBRA_INDEXER_URL,
  UMBRA_NETWORK,
  UMBRA_WSS_RPC_URL,
  RPC_HTTP,
} from '@/lib/constants';

export interface UseUmbraReturn {
  /** true if indexer URL + RPC are configured */
  available: boolean;
  /** true after Umbra client is created */
  initialized: boolean;
  /** true after user is registered for confidential balances */
  registered: boolean;
  loading: boolean;
  error: string | null;
  /** Encrypted token balances keyed by mint */
  shieldedBalances: EncryptedBalance[];

  initialize: () => Promise<void>;
  register: () => Promise<void>;
  shield: (mint: string, amount: bigint) => Promise<void>;
  unshield: (mint: string, amount: bigint) => Promise<void>;
  refreshBalances: (mints: string[]) => Promise<void>;
  issueGrant: (auditorAddress: string) => Promise<void>;
  revokeGrant: (auditorAddress: string) => Promise<void>;
  recoverStagedSol: (mint: string, amount: bigint, destination: string) => Promise<void>;
  recoverStagedSpl: (mint: string, amount: bigint, destination: string) => Promise<void>;
  clearError: () => void;
}

export function useUmbra(): UseUmbraReturn {
  const { walletAddress, signTransaction, connected } = useWalletConnection();
  const [initialized, setInitialized] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shieldedBalances, setShieldedBalances] = useState<EncryptedBalance[]>([]);

  const available = Boolean(UMBRA_INDEXER_URL && RPC_HTTP && UMBRA_WSS_RPC_URL);

  const serviceRef = useRef<UmbraService | null>(null);

  const service = useMemo(() => {
    if (!available) return null;
    const svc = new UmbraService({
      rpcUrl: RPC_HTTP,
      wssUrl: UMBRA_WSS_RPC_URL,
      indexerUrl: UMBRA_INDEXER_URL,
      network: UMBRA_NETWORK,
    });
    serviceRef.current = svc;
    return svc;
  }, [available]);

  const getWalletSigner = useCallback((): WalletAdapterSigner | null => {
    if (!connected || !walletAddress || !signTransaction) return null;
    return { address: walletAddress, signTransaction };
  }, [connected, walletAddress, signTransaction]);

  const withLoading = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Umbra operation failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureInit = useCallback(async () => {
    if (!service) throw new Error('Umbra privacy is not configured.');
    if (initialized) return;
    const signer = getWalletSigner();
    if (!signer) throw new Error('Connect your wallet first.');
    await service.init(signer);
    setInitialized(true);
  }, [service, initialized, getWalletSigner]);

  const initialize = useCallback(
    () => withLoading(ensureInit),
    [withLoading, ensureInit]
  );

  const register = useCallback(
    () => withLoading(async () => {
      await ensureInit();
      await service!.register();
      setRegistered(true);
    }),
    [withLoading, ensureInit, service]
  );

  const shield = useCallback(
    (mint: string, amount: bigint) => withLoading(async () => {
      await ensureInit();
      if (!walletAddress) throw new Error('Wallet not connected.');
      await service!.shield(walletAddress, mint, amount);
    }),
    [withLoading, ensureInit, service, walletAddress]
  );

  const unshield = useCallback(
    (mint: string, amount: bigint) => withLoading(async () => {
      await ensureInit();
      if (!walletAddress) throw new Error('Wallet not connected.');
      await service!.unshield(walletAddress, mint, amount);
    }),
    [withLoading, ensureInit, service, walletAddress]
  );

  const refreshBalances = useCallback(
    (mints: string[]) => withLoading(async () => {
      await ensureInit();
      const balances = await service!.queryBalances(mints);
      setShieldedBalances(balances);
    }),
    [withLoading, ensureInit, service]
  );

  const issueGrant = useCallback(
    (auditorAddress: string) => withLoading(async () => {
      await ensureInit();
      await service!.issueComplianceGrant(auditorAddress);
    }),
    [withLoading, ensureInit, service]
  );

  const revokeGrant = useCallback(
    (auditorAddress: string) => withLoading(async () => {
      await ensureInit();
      await service!.revokeComplianceGrant(auditorAddress);
    }),
    [withLoading, ensureInit, service]
  );

  const recoverStagedSol = useCallback(
    (mint: string, amount: bigint, destination: string) => withLoading(async () => {
      await ensureInit();
      await service!.recoverStagedSol(mint, amount, destination);
    }),
    [withLoading, ensureInit, service]
  );

  const recoverStagedSpl = useCallback(
    (mint: string, amount: bigint, destination: string) => withLoading(async () => {
      await ensureInit();
      await service!.recoverStagedSpl(mint, amount, destination);
    }),
    [withLoading, ensureInit, service]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    available,
    initialized,
    registered,
    loading,
    error,
    shieldedBalances,
    initialize,
    register,
    shield,
    unshield,
    refreshBalances,
    issueGrant,
    revokeGrant,
    recoverStagedSol,
    recoverStagedSpl,
    clearError,
  };
}
