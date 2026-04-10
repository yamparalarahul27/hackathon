'use client';

import { cn } from '@/lib/utils';
import { StatusDot } from '../ui/StatusDot';
import { Button } from '../ui/Button';
import { Wallet, BarChart3 } from 'lucide-react';

interface NavItem {
  label: string;
  key: string;
}

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  walletConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Vaults', key: 'vaults' },
  { label: 'Explore', key: 'explore' },
  { label: 'Deposit', key: 'deposit' },
  { label: 'Analytics', key: 'analytics' },
];

/** Asgard-style top navigation bar */
export function Navbar({ activeTab, onTabChange, walletConnected, walletAddress, onConnectWallet }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-[#0F1521] border-b border-white/8">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3B7DDD] flex items-center justify-center">
            <BarChart3 size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">Y-Vault</span>
        </div>

        {/* Nav Items */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                activeTab === item.key
                  ? 'text-white bg-white/5'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-white/3'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Network Status */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#9CA3AF]">
            <StatusDot variant="live" size="sm" />
            <span className="font-data">Solana</span>
          </div>

          {/* Wallet */}
          {walletConnected && walletAddress ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1A2332] border border-white/8 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="data-sm text-[#9CA3AF]">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <Button size="sm" onClick={onConnectWallet}>
              <Wallet size={14} />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all',
              activeTab === item.key
                ? 'text-white bg-white/5'
                : 'text-[#9CA3AF]'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
