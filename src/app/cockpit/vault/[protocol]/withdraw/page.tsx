'use client';

import { WithdrawFlow } from '@/components/features/WithdrawFlow';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';
import { useSearchParams } from 'next/navigation';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

export default function VaultWithdrawPage() {
  const searchParams = useSearchParams();
  const preSelectedVault = searchParams.get('vault');
  const { walletAddress } = useWalletConnection();
  const { vaults, positions, error } = useKaminoVaults(walletAddress);

  return (
    <>
      {error && <RpcErrorBanner message={error} />}
      <WithdrawFlow
        preSelectedVaultAddress={preSelectedVault}
        positions={positions}
        vaults={vaults}
      />
    </>
  );
}
