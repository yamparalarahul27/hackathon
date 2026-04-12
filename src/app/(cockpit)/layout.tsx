'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BottomBar } from '@/components/layout/BottomBar';
import { SettingsModal, applyThemeSettings } from '@/components/ui/SettingsModal';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';

export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { walletAddress, connected, openWalletModal } = useWalletConnection();

  useEffect(() => { applyThemeSettings(); }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
      <Navbar
        walletConnected={connected}
        walletAddress={walletAddress ?? undefined}
        onConnectWallet={openWalletModal}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col bg-[#f1f5f9]">
        <div className="max-w-[1400px] w-full mx-auto px-6 py-6 flex-1 bg-[#f1f5f9]">
          {children}
        </div>
      </main>

      <BottomBar />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
