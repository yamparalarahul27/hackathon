'use client';

import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Bell, Menu } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  walletConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
}

const NAV_ITEMS = [
  { label: 'Vaults', key: 'vaults' },
  { label: 'Explore', key: 'explore' },
  { label: 'Deposit', key: 'deposit' },
  { label: 'Analytics', key: 'analytics' },
];

/** Asgard-style compact header — 48px, transparent + blur */
export function Navbar({ activeTab, onTabChange, walletConnected, walletAddress, onConnectWallet }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 bg-[#f1f5f9]/95 backdrop-blur-lg border-b border-[#cbd5e1]">
      <div className="flex items-center justify-between h-12 px-4 lg:px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Y-Vault" width={24} height={24} />
            <span className="hidden lg:block font-satoshi font-bold text-sm text-[#11274d] mt-0.5">Y-Vault</span>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={() => onTabChange(item.key)}
                className={cn('font-ibm-plex-sans text-xs font-normal leading-4 transition-colors duration-150 whitespace-nowrap',
                  activeTab === item.key ? 'text-[#11274d]' : 'text-[#6a7282] hover:text-[#11274d]')}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center h-7 px-2 rounded-sm transition-colors duration-150 bg-white border border-[#cbd5e1] text-[#11274d] hover:bg-[#e2e8f0]">
            <Bell size={14} />
          </button>
          {walletConnected && walletAddress ? (
            <div className="flex items-center gap-2 h-7 px-3 bg-white border border-[#cbd5e1] rounded-sm text-xs text-[#11274d] font-ibm-plex-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0fa87a]" />
              <span className="font-mono text-xs text-[#11274d]">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
            </div>
          ) : (
            <Button variant="ghost-light" size="sm" className="border border-[#cbd5e1] bg-white hover:bg-[#e2e8f0]" onClick={onConnectWallet}>
              <span className="hidden md:inline">Connect Wallet</span>
              <span className="md:hidden">Connect</span>
            </Button>
          )}
          <button className="flex items-center justify-center h-7 px-2 rounded-sm transition-colors duration-150 bg-white border border-[#cbd5e1] text-[#11274d] hover:bg-[#e2e8f0] lg:hidden">
            <Menu size={14} />
          </button>
        </div>
      </div>
      <div className="lg:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
        {NAV_ITEMS.map(item => (
          <button key={item.key} onClick={() => onTabChange(item.key)}
            className={cn('font-ibm-plex-sans text-xs font-normal px-3 py-1.5 whitespace-nowrap transition-colors',
              activeTab === item.key ? 'text-[#11274d]' : 'text-[#6a7282]')}>
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
