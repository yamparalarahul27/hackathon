'use client';

import { DepositFlow } from '@/components/features/DepositFlow';
import { useSearchParams } from 'next/navigation';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

export default function VaultDepositPage() {
  const searchParams = useSearchParams();
  const preSelectedVault = searchParams.get('vault');
  const { walletAddress } = useWalletConnection();
  const { vaults } = useKaminoVaults(walletAddress);

  return <DepositFlow preSelectedVaultAddress={preSelectedVault} vaults={vaults} />;
}
