'use client';

import { use, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { VaultDetailHeader } from '@/components/features/vault/VaultDetailHeader';
import { VaultPosition } from '@/components/features/vault/VaultPosition';
import { VaultDetails } from '@/components/features/vault/VaultDetails';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

interface Props {
  params: Promise<{ protocol: string; vaultAddress: string }>;
}

export default function VaultDetailPage({ params }: Props) {
  const { protocol, vaultAddress } = use(params);
  const { walletAddress, connected } = useWalletConnection();
  const { vaults, positions } = useKaminoVaults(walletAddress);

  const vault = useMemo(
    () => vaults.find(v => v.address === vaultAddress),
    [vaults, vaultAddress]
  );

  const position = useMemo(
    () => positions.find(p => p.vaultAddress === vaultAddress) ?? null,
    [positions, vaultAddress]
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
        <Link
          href={`/vault/${protocol}`}
          className="inline-flex items-center gap-1 text-xs text-[#6a7282] hover:text-[#11274d] transition-colors font-ibm-plex-sans"
        >
          <ArrowLeft size={12} /> Back to Vaults
        </Link>

        <VaultDetailHeader vault={vault} />
        <VaultPosition position={position} connected={connected} />
        <VaultDetails vault={vault} />

        <div className="flex gap-3">
          <Link href={`/vault/${protocol}/deposit?vault=${vault.address}`} className="flex-1">
            <Button className="w-full py-3">
              Deposit
            </Button>
          </Link>
          {position && (
            <Link href={`/vault/${protocol}/withdraw?vault=${vault.address}`} className="flex-1">
              <Button variant="secondary" className="w-full py-3">
                Withdraw
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
