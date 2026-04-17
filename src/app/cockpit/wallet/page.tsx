'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NftGallery } from '@/components/features/NftGallery';
import { WalletBalances } from '@/components/features/WalletBalances';
import { ShieldedBalances } from '@/components/features/ShieldedBalances';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useNftHoldings } from '@/lib/hooks/useNftHoldings';

export default function WalletPage() {
  const { walletAddress, shortAddress, connected, openWalletModal } = useWalletConnection();
  const { nfts, total, loading, error } = useNftHoldings(walletAddress);

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      {/* Hero */}
      <div
        className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-6 border-b border-white/20"
        style={{
          marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)', paddingRight: 'calc(50vw - 50%)',
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-2">
            Wallet
          </h1>
          {connected && shortAddress ? (
            <p className="font-mono text-sm text-white/70">{walletAddress}</p>
          ) : (
            <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70">
              Connect your wallet to view holdings.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-8">
        {!connected ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#11274d] font-ibm-plex-sans font-medium mb-2">
              Connect your wallet to see your holdings
            </p>
            <p className="text-xs text-[#6a7282] font-ibm-plex-sans mb-4">
              Balances via Jupiter Ultra. NFTs via Helius DAS. Real on-chain data.
            </p>
            <Button variant="primary" size="sm" onClick={openWalletModal}>
              Connect Wallet
            </Button>
          </Card>
        ) : walletAddress ? (
          <>
            <WalletBalances walletAddress={walletAddress} />
            <ShieldedBalances walletAddress={walletAddress} publicMints={[]} />
            <NftGallery nfts={nfts} total={total} loading={loading} error={error} />
          </>
        ) : null}
      </div>
    </div>
  );
}
