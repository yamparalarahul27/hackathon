'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomBar } from '@/components/layout/BottomBar';
import { VaultDashboard } from '@/components/features/VaultDashboard';
import { VaultExplorer } from '@/components/features/VaultExplorer';
import { DepositFlow } from '@/components/features/DepositFlow';
import { YieldAnalytics } from '@/components/features/YieldAnalytics';
import { MOCK_KAMINO_POSITIONS } from '@/lib/mockKaminoData';

export default function Home() {
  const [activeTab, setActiveTab] = useState('vaults');

  return (
    <div className="min-h-screen bg-[#0F1521] pb-10">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {activeTab === 'vaults' && <VaultDashboard />}
        {activeTab === 'explore' && <VaultExplorer />}
        {activeTab === 'deposit' && <DepositFlow />}
        {activeTab === 'analytics' && <YieldAnalytics positions={MOCK_KAMINO_POSITIONS} />}
      </main>

      <BottomBar />
    </div>
  );
}
