'use client';

import { useMemo } from 'react';
import { useUnifiedWallet, useUnifiedWalletContext } from '@jup-ag/wallet-adapter';
import type { PublicKey } from '@solana/web3.js';
import type { WalletName } from '@solana/wallet-adapter-base';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import type { Wallet } from '@solana/wallet-adapter-react';
import type { VersionedTransaction } from '@solana/web3.js';

export interface WalletConnectionState {
    publicKey: PublicKey | null;
    walletAddress: string | null;
    shortAddress: string | null;
    connected: boolean;
    connecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    selectWallet: (walletName: WalletName | null) => void;
    walletName: string | null;
    wallets: Wallet[];
    installedWallets: Wallet[];
    hasInstalledWallets: boolean;
    signTransaction?: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
    canSignTransactions: boolean;
    openWalletModal: () => void;
    isWalletModalOpen: boolean;
}

export function useWalletConnection(): WalletConnectionState {
    const {
        publicKey,
        connected,
        connecting,
        connect,
        disconnect,
        wallets,
        wallet,
        select
    } = useUnifiedWallet();
    const { setShowModal, showModal } = useUnifiedWalletContext();

    const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);
    const shortAddress = useMemo(() => {
        if (!walletAddress) return null;
        return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    }, [walletAddress]);

    const selectWallet = (walletName: WalletName | null) => {
        if (!walletName) { select(null); return; }
        select(walletName);
    };

    const openWalletModal = () => setShowModal(true);
    const adapter = wallet?.adapter;
    const availableWallets = wallets ?? [];
    const canSignTransactions = isSignerAdapter(adapter);
    const signTransaction = canSignTransactions
        ? adapter.signTransaction.bind(adapter)
        : undefined;

    return {
        publicKey: publicKey ?? null,
        walletAddress,
        shortAddress,
        connected,
        connecting,
        connect,
        disconnect,
        selectWallet,
        walletName: wallet?.adapter.name ?? null,
        wallets: availableWallets,
        installedWallets: availableWallets.filter((w) => w.readyState === WalletReadyState.Installed),
        hasInstalledWallets: availableWallets.some((w) => w.readyState === WalletReadyState.Installed),
        signTransaction,
        canSignTransactions,
        openWalletModal,
        isWalletModalOpen: showModal
    };
}

function isSignerAdapter(
    adapter: unknown
): adapter is { signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction> } {
    return Boolean(
        adapter &&
        typeof adapter === 'object' &&
        'signTransaction' in adapter &&
        typeof (adapter as { signTransaction?: unknown }).signTransaction === 'function'
    );
}
