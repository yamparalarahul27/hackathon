'use client';

import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import type { Cluster } from '@solana/web3.js';
import type { IUnifiedWalletConfig } from '@jup-ag/wallet-adapter/dist/types/contexts/WalletConnectionProvider';
// Clerk disabled — the "Sign up using Email" footer inside the wallet modal
// relied on useClerk(). Restore by uncommenting these imports and the
// EmailSignupFooter block below, then reference it via walletModalAttachments.
// import { useClerk } from '@clerk/nextjs';
// import { useUnifiedWalletContext } from '@jup-ag/wallet-adapter';
// import { Mail } from 'lucide-react';
import { APP_BASE_URL, DEFAULT_WALLET_CLUSTER, SupportedCluster } from '@/lib/constants';

type UnifiedWalletProviderType = typeof import('@jup-ag/wallet-adapter')['UnifiedWalletProvider'];

/*
 * ── Clerk-backed email signup footer (disabled) ──────────────────
 *
 * function EmailSignupFooter() {
 *     const { openSignIn } = useClerk();
 *     const { setShowModal } = useUnifiedWalletContext();
 *
 *     const handleClick = () => {
 *         setShowModal(false);
 *         const here = typeof window !== 'undefined' ? window.location.href : '/';
 *         setTimeout(() => {
 *             openSignIn({
 *                 fallbackRedirectUrl: here,
 *                 signUpFallbackRedirectUrl: here,
 *             });
 *         }, 50);
 *     };
 *
 *     return (
 *         <div className="px-4 py-3 border-t border-white/10 text-center">
 *             <p className="text-xs text-white/60 mb-2 font-ibm-plex-sans">Don't have a web3 wallet?</p>
 *             <button type="button" onClick={handleClick} className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-white/80 transition-colors font-ibm-plex-sans">
 *                 <Mail size={12} /> Sign up using Email
 *             </button>
 *         </div>
 *     );
 * }
 */

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
        },
        // walletModalAttachments: { footer: <EmailSignupFooter /> }, // re-enable with Clerk
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
