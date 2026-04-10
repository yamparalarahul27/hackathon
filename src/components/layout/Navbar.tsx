'use client';

import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Bell, Menu, BarChart3 } from 'lucide-react';

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
    <header className="sticky top-0 z-20 bg-transparent backdrop-blur-lg border-b border-white/10">
      <div className="flex items-center justify-between h-12 px-4 lg:px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#19549b] flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <span className="hidden lg:block font-satoshi font-bold text-sm text-white/80 mt-0.5">Y-Vault</span>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <button key={item.key} onClick={() => onTabChange(item.key)}
                className={cn('font-ibm-plex-sans text-xs font-normal leading-4 transition-colors duration-150 whitespace-nowrap',
                  activeTab === item.key ? 'text-white' : 'text-white/70 hover:text-white')}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center h-7 px-2 rounded-sm transition-colors duration-150 bg-white/10 text-white hover:bg-white/20">
            <Bell size={14} />
          </button>
          {walletConnected && walletAddress ? (
            <div className="flex items-center gap-2 h-7 px-3 bg-white/10 rounded-sm text-xs text-white font-ibm-plex-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0fa87a]" />
              <span className="font-mono text-xs">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
            </div>
          ) : (
            <Button variant="ghost-dark" size="sm" onClick={onConnectWallet}>
              <span className="hidden md:inline">Connect Wallet</span>
              <span className="md:hidden">Connect</span>
            </Button>
          )}
          <button className="flex items-center justify-center h-7 px-2 rounded-sm transition-colors duration-150 bg-white/10 text-white hover:bg-white/20 lg:hidden">
            <Menu size={14} />
          </button>
        </div>
      </div>
      <div className="lg:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
        {NAV_ITEMS.map(item => (
          <button key={item.key} onClick={() => onTabChange(item.key)}
            className={cn('font-ibm-plex-sans text-xs font-normal px-3 py-1.5 whitespace-nowrap transition-colors',
              activeTab === item.key ? 'text-white' : 'text-white/50')}>
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
