'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomBar } from '@/components/layout/BottomBar';
import { SettingsModal, applyThemeSettings } from '@/components/ui/SettingsModal';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { trackWalletConnect } from '@/services/TorqueService';

export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { walletAddress, connected, openWalletModal, disconnect } = useWalletConnection();

  useEffect(() => { applyThemeSettings(); }, []);

  useEffect(() => {
    if (connected && walletAddress) trackWalletConnect(walletAddress);
  }, [connected, walletAddress]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
      <Navbar
        walletConnected={connected}
        walletAddress={walletAddress ?? undefined}
        onConnectWallet={openWalletModal}
        onDisconnectWallet={() => { void disconnect(); }}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col bg-[#f1f5f9] pb-20">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 flex-1">
          {children}
        </div>
      </main>

      <BottomBar />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
