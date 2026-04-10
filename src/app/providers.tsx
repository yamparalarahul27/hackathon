'use client';

import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import type { Cluster } from '@solana/web3.js';
import type { IUnifiedWalletConfig } from '@jup-ag/wallet-adapter/dist/types/contexts/WalletConnectionProvider';
import { DEFAULT_WALLET_CLUSTER, SupportedCluster, WALLET_CLUSTER_CONFIG } from '@/lib/constants';

type UnifiedWalletProviderType = typeof import('@jup-ag/wallet-adapter')['UnifiedWalletProvider'];

export default function Providers({ children }: PropsWithChildren) {
    const [WalletProvider, setWalletProvider] = useState<UnifiedWalletProviderType | null>(null);
    const [cluster] = useState<SupportedCluster>(DEFAULT_WALLET_CLUSTER);

    useEffect(() => {
        let isMounted = true;
        import('@jup-ag/wallet-adapter').then(mod => {
            if (isMounted) {
                setWalletProvider(() => mod.UnifiedWalletProvider);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const walletConfig = useMemo(() => ({
        env: cluster as Cluster,
        autoConnect: false,
        theme: 'dark',
        metadata: {
            name: 'Y-Vault',
            description: 'Fiat to DeFi Yield — Powered by Kamino on Solana',
            url: 'https://y-vault.vercel.app',
            iconUrls: ['/icon.png']
        }
    }) satisfies IUnifiedWalletConfig, [cluster]);

    if (!WalletProvider) {
        return <>{children}</>;
    }

    return (
        <WalletProvider
            wallets={[]}
            config={walletConfig}
            localStorageKey={`yvault.wallet.${cluster}`}
        >
            {children}
        </WalletProvider>
    );
}
