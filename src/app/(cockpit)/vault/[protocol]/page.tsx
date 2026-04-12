'use client';

import { VaultDashboard } from '@/components/features/VaultDashboard';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';
import { useRouter } from 'next/navigation';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';
import { use } from 'react';

interface Props {
  params: Promise<{ protocol: string }>;
}

export default function VaultPositionsPage({ params }: Props) {
  const { protocol } = use(params);
  const router = useRouter();
  const { walletAddress } = useWalletConnection();
  const { positions, summary, error, isUsingMockData } = useKaminoVaults(walletAddress);

  const handleVaultSelect = (vaultAddress: string) => {
    router.push(`/vault/${protocol}/${vaultAddress}`);
  };

  return (
    <>
      {error && <RpcErrorBanner message={error} />}
      <VaultDashboard positions={positions} summary={summary} onVaultSelect={handleVaultSelect} />
    </>
  );
}
