'use client';

import { YieldAnalytics } from '@/components/features/YieldAnalytics';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

export default function VaultAnalyticsPage() {
  const { walletAddress } = useWalletConnection();
  const { positions } = useKaminoVaults(walletAddress);

  return <YieldAnalytics positions={positions} />;
}
