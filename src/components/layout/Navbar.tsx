'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Menu, Settings, Sliders, Plug } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Clerk disabled — restore the avatar/UserButton block below when re-enabling.
// import { Show, UserButton } from '@clerk/nextjs';

interface NavbarProps {
  walletConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
  onSettingsClick?: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Market', href: '/market' },
  { label: 'DEX', href: '/dex/deriverse' },
  { label: 'Lend', href: '/lend/kamino' },
  { label: 'Vaults', href: '/vault/kamino' },
  { label: 'LSTs', href: '/lst' },
  { label: 'Swap', href: '/swap' },
  { label: 'Wallet', href: '/wallet' },
];

/** DeFi Cockpit header — 48px, transparent + blur */
export function Navbar({ walletConnected, walletAddress, onConnectWallet, onSettingsClick }: NavbarProps) {
  const pathname = usePathname();
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!settingsMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [settingsMenuOpen]);

  return (
    <header className="sticky top-0 z-20 bg-[#f1f5f9]/95 backdrop-blur-lg border-b border-[#cbd5e1]">
      <div className="flex items-center justify-between h-12 px-4 lg:px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="DeFi Cockpit" width={24} height={24} />
            <span className="hidden lg:block font-satoshi font-bold text-sm text-[#11274d] mt-0.5">DeFi Cockpit</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'font-ibm-plex-sans text-xs font-normal leading-4 transition-colors duration-150 whitespace-nowrap',
                  isActive(item.href) ? 'text-[#11274d]' : 'text-[#6a7282] hover:text-[#11274d]'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div ref={settingsRef} className="relative">
            <button
              onClick={() => setSettingsMenuOpen((v) => !v)}
              className="flex items-center justify-center h-7 px-2 rounded-sm transition-colors duration-150 bg-white border border-[#cbd5e1] text-[#11274d] hover:bg-[#e2e8f0]"
              aria-label="Settings menu"
              aria-haspopup="menu"
              aria-expanded={settingsMenuOpen}
            >
              <Settings size={14} />
            </button>
            {settingsMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-8 z-30 min-w-[180px] bg-white border border-[#cbd5e1] rounded-sm raised-frosted py-1"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setSettingsMenuOpen(false);
                    onSettingsClick?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-ibm-plex-sans text-[#11274d] hover:bg-[#f1f5f9] transition-colors"
                >
                  <Sliders size={12} className="text-[#6a7282]" />
                  Preferences
                </button>
                <Link
                  role="menuitem"
                  href="/integration"
                  onClick={() => setSettingsMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-ibm-plex-sans text-[#11274d] hover:bg-[#f1f5f9] transition-colors"
                >
                  <Plug size={12} className="text-[#6a7282]" />
                  Integrations
                </Link>
              </div>
            )}
          </div>
          {/* Clerk UserButton disabled — restore when re-enabling Clerk:
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: { avatarBox: 'h-7 w-7 border border-[#cbd5e1] rounded-sm' },
                }}
              />
            </Show>
          */}
          {walletConnected && walletAddress ? (
            <Link
              href="/wallet"
              className="flex items-center gap-2 h-7 px-3 bg-white border border-[#cbd5e1] rounded-sm text-xs text-[#11274d] font-ibm-plex-sans hover:bg-[#e2e8f0] transition-colors"
              aria-label="Open wallet page"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0fa87a]" />
              <span className="font-mono text-xs text-[#11274d]">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
            </Link>
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
      {/* Mobile nav */}
      <div className="lg:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'font-ibm-plex-sans text-xs font-normal px-3 py-1.5 whitespace-nowrap transition-colors',
              isActive(item.href) ? 'text-[#11274d]' : 'text-[#6a7282]'
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
