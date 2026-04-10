'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { preloadTokenIcons } from '@/lib/tokenIcons';
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

  // Preload token icons from Jupiter API on mount
  useEffect(() => { preloadTokenIcons(); }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        walletConnected={connected}
        walletAddress={walletAddress ?? undefined}
        onConnectWallet={openWalletModal}
      />

      <main className="flex-1 flex flex-col bg-[#f1f5f9]">
        <div className="max-w-[1400px] w-full mx-auto px-6 py-6 flex-1 bg-[#f1f5f9]">
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
