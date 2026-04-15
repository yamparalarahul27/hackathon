'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Menu, Settings, Sliders, Plug, Copy, Check, ArrowLeftRight, LogOut, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Clerk disabled — restore the avatar/UserButton block below when re-enabling.
// import { Show, UserButton } from '@clerk/nextjs';

interface NavbarProps {
  walletConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
  onDisconnectWallet?: () => void;
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
export function Navbar({ walletConnected, walletAddress, onConnectWallet, onDisconnectWallet, onSettingsClick }: NavbarProps) {
  const pathname = usePathname();
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!settingsMenuOpen && !walletMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (settingsMenuOpen && settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsMenuOpen(false);
      }
      if (walletMenuOpen && walletRef.current && !walletRef.current.contains(e.target as Node)) {
        setWalletMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsMenuOpen(false);
        setWalletMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [settingsMenuOpen, walletMenuOpen]);

  // Reset copied state when dropdown closes
  useEffect(() => {
    if (!walletMenuOpen) setAddressCopied(false);
  }, [walletMenuOpen]);

  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 1500);
    } catch {
      // Clipboard API may fail in insecure contexts; silently ignore
    }
  };

  const handleDisconnect = () => {
    setWalletMenuOpen(false);
    onDisconnectWallet?.();
  };

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
            <div ref={walletRef} className="relative">
              <button
                onClick={() => setWalletMenuOpen((v) => !v)}
                className="flex items-center gap-2 h-7 px-3 bg-white border border-[#cbd5e1] rounded-sm text-xs text-[#11274d] font-ibm-plex-sans hover:bg-[#e2e8f0] transition-colors"
                aria-label="Wallet menu"
                aria-haspopup="menu"
                aria-expanded={walletMenuOpen}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0fa87a]" />
                <span className="font-mono text-xs text-[#11274d]">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
                <ChevronDown size={12} className={cn('text-[#6a7282] transition-transform', walletMenuOpen && 'rotate-180')} />
              </button>
              {walletMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-8 z-30 min-w-[240px] bg-white border border-[#cbd5e1] rounded-sm raised-frosted py-1"
                >
                  <div className="px-3 py-2 border-b border-[#e2e8f0]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0fa87a]" />
                      <span className="text-[10px] uppercase tracking-wider font-ibm-plex-sans text-[#6a7282]">Connected</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#11274d] break-all leading-snug">{walletAddress}</div>
                  </div>
                  <button
                    role="menuitem"
                    onClick={handleCopyAddress}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-ibm-plex-sans text-[#11274d] hover:bg-[#f1f5f9] transition-colors"
                  >
                    {addressCopied ? (
                      <>
                        <Check size={12} className="text-[#0fa87a]" />
                        <span className="text-[#0fa87a]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="text-[#6a7282]" />
                        Copy address
                      </>
                    )}
                  </button>
                  <button
                    role="menuitem"
                    disabled
                    aria-disabled="true"
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-ibm-plex-sans text-[#94a3b8] cursor-not-allowed"
                  >
                    <ArrowLeftRight size={12} className="text-[#94a3b8]" />
                    <span>Switch wallet</span>
                    <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#f1f5f9] text-[#6a7282] rounded-sm">Soon</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleDisconnect}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-ibm-plex-sans text-[#11274d] hover:bg-[#f1f5f9] transition-colors"
                  >
                    <LogOut size={12} className="text-[#6a7282]" />
                    Disconnect
                  </button>
                </div>
              )}
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
