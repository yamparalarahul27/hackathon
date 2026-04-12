'use client';

import { VaultExplorer } from '@/components/features/VaultExplorer';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

export default function VaultExplorePage() {
  const { walletAddress } = useWalletConnection();
  const { vaults } = useKaminoVaults(walletAddress);

  return <VaultExplorer vaults={vaults} />;
}
