'use client';

import { use } from 'react';
import { DexAnalytics } from '@/components/features/dex/DexAnalytics';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useDerivverseTrades } from '@/lib/hooks/useDerivverseTrades';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';

interface Props {
  params: Promise<{ protocol: string }>;
}

const PROTOCOL_NAMES: Record<string, string> = {
  deriverse: 'Deriverse',
  jupiter: 'Jupiter',
  raydium: 'Raydium',
};

export default function DexProtocolPage({ params }: Props) {
  const { protocol } = use(params);
  const name = PROTOCOL_NAMES[protocol] ?? protocol.charAt(0).toUpperCase() + protocol.slice(1);

  if (protocol !== 'deriverse') {
    return (
      <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
        <div className="max-w-[1400px] mx-auto text-center py-20">
          <Card className="p-8 max-w-lg mx-auto">
            <p className="text-lg text-[#11274d] font-ibm-plex-sans font-medium mb-2">
              {name} — Coming Soon
            </p>
            <p className="text-sm text-[#6a7282] font-ibm-plex-sans">
              Trade analytics for {name} will be available in a future update.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return <DerivverseDexPage />;
}

function DerivverseDexPage() {
  const { walletAddress, connected, openWalletModal } = useWalletConnection();
  const { trades, loading, error } = useDerivverseTrades(walletAddress);

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Devnet Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#fef3c7] border border-[#fbbf24] text-[10px] font-medium text-[#92400e] font-ibm-plex-sans uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            Devnet
          </span>
          <span className="text-xs text-[#6a7282] font-ibm-plex-sans">
            Deriverse DEX trades parsed from Solana devnet
          </span>
        </div>

        {error && <RpcErrorBanner message={error} />}

        {!connected ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#11274d] font-ibm-plex-sans font-medium mb-2">
              Connect your wallet to see Deriverse trades
            </p>
            <p className="text-xs text-[#6a7282] font-ibm-plex-sans mb-4">
              Your devnet trade history will be parsed from on-chain transaction logs.
            </p>
            <Button variant="primary" size="sm" onClick={openWalletModal}>
              Connect Wallet
            </Button>
          </Card>
        ) : (
          <DexAnalytics protocolName="Deriverse" trades={trades} loading={loading} />
        )}
      </div>
    </div>
  );
}
