'use client';

import { VaultExplorer } from '@/components/features/VaultExplorer';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

export default function VaultExplorePage() {
  const { walletAddress } = useWalletConnection();
  const { vaults, error } = useKaminoVaults(walletAddress);

  return (
    <>
      {error && <RpcErrorBanner message={error} />}
      <VaultExplorer vaults={vaults} />
    </>
  );
}
