'use client';

import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import type { Cluster } from '@solana/web3.js';
import type { IUnifiedWalletConfig } from '@jup-ag/wallet-adapter/dist/types/contexts/WalletConnectionProvider';
import { APP_BASE_URL, DEFAULT_WALLET_CLUSTER, SupportedCluster } from '@/lib/constants';

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
            name: 'DeFi Cockpit',
            description: 'Real-time DeFi intelligence powered by Solana',
            url: APP_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
            iconUrls: ['/logo.svg']
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
