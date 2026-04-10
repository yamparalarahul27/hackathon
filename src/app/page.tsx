'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomBar } from '@/components/layout/BottomBar';
import { VaultDashboard } from '@/components/features/VaultDashboard';
import { VaultExplorer } from '@/components/features/VaultExplorer';
import { DepositFlow } from '@/components/features/DepositFlow';
import { YieldAnalytics } from '@/components/features/YieldAnalytics';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';
import { Agentation } from 'agentation';

export default function Home() {
  const [activeTab, setActiveTab] = useState('vaults');
  const { walletAddress, connected, openWalletModal } = useWalletConnection();
  const { positions } = useKaminoVaults(walletAddress);

  return (
    <div className="min-h-screen flex flex-col bg-[#010a13]">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        walletConnected={connected}
        walletAddress={walletAddress ?? undefined}
        onConnectWallet={openWalletModal}
      />

      <main className="flex-1 flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto px-6 py-6 flex-1">
          {activeTab === 'vaults' && <VaultDashboard />}
          {activeTab === 'explore' && <VaultExplorer />}
          {activeTab === 'deposit' && <DepositFlow />}
          {activeTab === 'analytics' && <YieldAnalytics positions={positions} />}
        </div>
      </main>

      <BottomBar />
      <Agentation />
    </div>
  );
}
