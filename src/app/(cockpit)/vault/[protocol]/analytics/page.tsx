'use client';

import dynamic from 'next/dynamic';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

// Recharts is 6.8MB — lazy-load it since analytics page is rarely visited
const YieldAnalytics = dynamic(
  () => import('@/components/features/YieldAnalytics').then(m => ({ default: m.YieldAnalytics })),
  { loading: () => <div className="p-12 text-center text-[#6a7282] text-sm">Loading analytics...</div> }
);

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
