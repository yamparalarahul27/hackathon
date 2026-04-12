'use client';

import { use, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { VaultDetailHeader } from '@/components/features/vault/VaultDetailHeader';
import { VaultTokenPair } from '@/components/features/vault/VaultTokenPair';
import { VaultPosition } from '@/components/features/vault/VaultPosition';
import { VaultDetails } from '@/components/features/vault/VaultDetails';
import { MOCK_KAMINO_VAULTS, MOCK_KAMINO_POSITIONS } from '@/lib/mockKaminoData';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';

interface Props {
  params: Promise<{ protocol: string; vaultAddress: string }>;
}

export default function VaultDetailPage({ params }: Props) {
  const { protocol, vaultAddress } = use(params);
  const { connected } = useWalletConnection();

  const vault = useMemo(
    () => MOCK_KAMINO_VAULTS.find(v => v.address === vaultAddress),
    [vaultAddress]
  );

  const position = useMemo(
    () => MOCK_KAMINO_POSITIONS.find(p => p.vaultAddress === vaultAddress) ?? null,
    [vaultAddress]
  );

  if (!vault) {
    return (
      <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
        <div className="max-w-[1400px] mx-auto text-center py-20">
          <p className="text-lg text-[#11274d] font-ibm-plex-sans mb-2">Vault not found</p>
          <p className="text-sm text-[#6a7282] font-ibm-plex-sans mb-4">Address: {vaultAddress}</p>
          <Link href={`/vault/${protocol}`} className="text-sm text-[#3B7DDD] hover:underline">← Back to Vaults</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href={`/vault/${protocol}`}
          className="inline-flex items-center gap-1 text-xs text-[#6a7282] hover:text-[#11274d] transition-colors font-ibm-plex-sans"
        >
          <ArrowLeft size={12} /> Back to Vaults
        </Link>

        {/* Vault Header: name, strategy, APY, TVL, volume, fees */}
        <VaultDetailHeader vault={vault} />

        {/* Token Pair with links to individual token pages */}
        <VaultTokenPair tokenA={vault.tokenA} tokenB={vault.tokenB} />

        {/* User Position (shows when wallet connected) */}
        <VaultPosition position={position} connected={connected} />

        {/* Vault Details: strategy, fee rate, addresses */}
        <VaultDetails vault={vault} />

        {/* Deposit CTA */}
        <Link href={`/vault/${protocol}/deposit?vault=${vault.address}`} className="block">
          <Button className="w-full py-3">
            Deposit into this Vault
          </Button>
        </Link>
      </div>
    </div>
  );
}
