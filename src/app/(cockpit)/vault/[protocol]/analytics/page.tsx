'use client';

import { YieldAnalytics } from '@/components/features/YieldAnalytics';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

export default function VaultAnalyticsPage() {
  const { walletAddress } = useWalletConnection();
  const { positions, error } = useKaminoVaults(walletAddress);

  return (
    <>
      {error && <RpcErrorBanner message={error} />}
      <YieldAnalytics positions={positions} />
    </>
  );
}
