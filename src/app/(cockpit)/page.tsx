'use client';

import { ProjectOverview } from '@/components/features/ProjectOverview';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

export default function DashboardPage() {
  const { walletAddress, connected, openWalletModal } = useWalletConnection();
  const { vaults, positions, summary, loading, error } = useKaminoVaults(walletAddress);

  return (
    <ProjectOverview
      vaults={vaults}
      positions={positions}
      summary={summary}
      loading={loading}
      error={error}
      walletConnected={connected}
      onConnectWallet={openWalletModal}
    />
  );
}
