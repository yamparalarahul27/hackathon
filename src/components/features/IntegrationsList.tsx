'use client';

import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusDot } from '@/components/ui/StatusDot';

// ── Types ─────────────────────────────────────────────────────

type IntegrationStatus = 'live' | 'fallback' | 'disabled';

interface Integration {
  name: string;
  kind: string;
  status: IntegrationStatus;
  purpose: string;
  usedOn: string[];
  url?: string;
}

interface Category {
  title: string;
  description: string;
  items: Integration[];
}

// ── Data ──────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    title: 'RPC & Infrastructure',
    description: 'Round-robin across three providers for on-chain resilience.',
    items: [
      {
        name: 'Helius RPC',
        kind: 'primary · live',
        status: 'live',
        purpose: 'Primary Solana RPC plus the Digital Asset Standard (DAS) API — powers wallet history, NFT gallery, and all vault reads.',
        usedOn: ['Wallet', 'Vaults', 'DEX', 'NFT Gallery'],
        url: 'https://helius.dev',
      },
      {
        name: 'QuickNode',
        kind: 'fallback · live',
        status: 'live',
        purpose: 'Second RPC in the round-robin rotation. Takes over when Helius rate-limits or slows down.',
        usedOn: ['All on-chain reads'],
        url: 'https://quicknode.com',
      },
      {
        name: 'RPC Fast',
        kind: 'fallback · live',
        status: 'live',
        purpose: 'Third RPC in the rotation. Ensures read-path uptime under heavy load or provider outages.',
        usedOn: ['All on-chain reads'],
        url: 'https://rpcfast.com',
      },
    ],
  },
  {
    title: 'DeFi Protocols',
    description: 'Direct SDK + API integrations with every protocol surfaced in the cockpit.',
    items: [
      {
        name: 'Kamino Data API',
        kind: 'REST · live',
        status: 'live',
        purpose: 'K-Vaults list, per-vault metrics (APY/TVL/holders), and user positions — all read from Kamino\u2019s documented /kvaults endpoints.',
        usedOn: ['Vaults', 'Dashboard'],
        url: 'https://api.kamino.finance',
      },
      {
        name: 'Kamino Transactions API',
        kind: 'REST · live',
        status: 'live',
        purpose: 'Real deposit flow — POST /ktx/kvault/deposit returns a signed-ready transaction; we sign via the wallet adapter.',
        usedOn: ['Deposit'],
        url: 'https://api.kamino.finance/ktx/documentation',
      },
      {
        name: 'Kamino klend',
        kind: 'SDK · live',
        status: 'live',
        purpose: 'Lending-market state: supply and borrow rates, reserves, oracle prices.',
        usedOn: ['Lend'],
        url: 'https://kamino.finance',
      },
      {
        name: 'Deriverse Kit',
        kind: 'SDK · devnet',
        status: 'live',
        purpose: 'On-chain trade parsing for the Deriverse DEX — fills, PnL, and per-wallet behavior analytics.',
        usedOn: ['DEX'],
        url: 'https://www.npmjs.com/package/@deriverse/kit',
      },
      {
        name: 'Sanctum LST List',
        kind: 'package · live',
        status: 'live',
        purpose: 'Official Sanctum registry of every Solana liquid-staking token with yields and program metadata.',
        usedOn: ['LSTs', 'Vaults'],
        url: 'https://sanctum.so',
      },
    ],
  },
  {
    title: 'Trading & Price Data',
    description: 'Multi-source price and chart data with graceful fallbacks.',
    items: [
      {
        name: 'Jupiter Price V3',
        kind: 'REST · live',
        status: 'live',
        purpose: 'Up to 50 mints per request via /price/v3. Returns usdPrice, 24h change, liquidity, decimals. Default pricing source app-wide.',
        usedOn: ['All price-aware views'],
        url: 'https://developers.jup.ag',
      },
      {
        name: 'Jupiter Swap V2',
        kind: 'REST · live',
        status: 'live',
        purpose: 'Single /swap/v2/order call returns quote + ready-to-sign transaction. One-shot preview plus managed-execution flow.',
        usedOn: ['Swap'],
        url: 'https://developers.jup.ag',
      },
      {
        name: 'Jupiter Tokens V2',
        kind: 'REST · live',
        status: 'live',
        purpose: 'Search tokens by name, symbol, or mint. Returns metadata, market stats, verification status. Replaces the old token.jup.ag/strict bulk list.',
        usedOn: ['Token lookups'],
        url: 'https://developers.jup.ag',
      },
      {
        name: 'Jupiter Wallet Adapter',
        kind: 'SDK · live',
        status: 'live',
        purpose: 'Unified multi-wallet connection — Phantom, Solflare, Backpack, and more.',
        usedOn: ['Every page'],
        url: 'https://developers.jup.ag',
      },
      {
        name: 'DexScreener',
        kind: 'REST · live',
        status: 'live',
        purpose: 'Top DEX trading pairs by 24h volume, liquidity depth, and transaction count.',
        usedOn: ['Token pages'],
        url: 'https://dexscreener.com',
      },
      {
        name: 'Binance Public',
        kind: 'REST · live',
        status: 'live',
        purpose: 'Primary candlestick and 24h ticker source for the chart stack — free, no key needed.',
        usedOn: ['Token chart'],
        url: 'https://www.binance.com',
      },
      {
        name: 'CoinGecko',
        kind: 'REST · live',
        status: 'live',
        purpose: 'Token metadata, market cap, and trending feeds — 30 requests per minute on the free tier.',
        usedOn: ['Market', 'Token pages'],
        url: 'https://www.coingecko.com',
      },
      {
        name: 'Birdeye',
        kind: 'REST · fallback',
        status: 'fallback',
        purpose: 'Historical price fallback for Solana-native tokens that Binance does not list.',
        usedOn: ['Token chart'],
        url: 'https://birdeye.so',
      },
      {
        name: 'GeckoTerminal',
        kind: 'REST · fallback',
        status: 'fallback',
        purpose: 'Tertiary chart data source — used when both Binance and Birdeye come up short.',
        usedOn: ['Token chart'],
        url: 'https://www.geckoterminal.com',
      },
    ],
  },
  {
    title: 'Storage',
    description: 'Persisted user state outside the browser.',
    items: [
      {
        name: 'Supabase',
        kind: 'Postgres · live',
        status: 'live',
        purpose: 'Stores linked wallets and token watchlists so user state follows them across devices.',
        usedOn: ['Settings', 'Wallet', 'Market'],
        url: 'https://supabase.com',
      },
    ],
  },
  {
    title: 'Authentication',
    description: 'Identity provider — currently disabled while we evaluate the right fit.',
    items: [
      {
        name: 'Clerk',
        kind: 'Auth · disabled',
        status: 'disabled',
        purpose: 'Previously wired as the email-signup fallback inside the wallet connect modal. Commented out across layout.tsx, middleware.ts, providers.tsx, and Navbar — all hooks preserved for easy re-enable.',
        usedOn: ['(paused)'],
        url: 'https://clerk.com',
      },
    ],
  },
];

// ── Derived stats ─────────────────────────────────────────────

const ALL_ITEMS = CATEGORIES.flatMap((c) => c.items);
const TOTAL = ALL_ITEMS.length;
const LIVE = ALL_ITEMS.filter((i) => i.status === 'live').length;
const FALLBACK = ALL_ITEMS.filter((i) => i.status === 'fallback').length;
const DISABLED = ALL_ITEMS.filter((i) => i.status === 'disabled').length;
const CATEGORY_COUNT = CATEGORIES.length;

// ── Component ─────────────────────────────────────────────────

export function IntegrationsList() {
  return (
    <>
      {/* Hero */}
      <div
        className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-6 border-b border-white/20"
        style={{
          marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)', paddingRight: 'calc(50vw - 50%)',
        }}
      >
        <div>
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-2">
            Integrations
          </h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70 mb-6">
            Every live data source powering DeFi Triangle — real APIs, SDKs, and on-chain reads.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: String(TOTAL) },
              { label: 'Live', value: String(LIVE) },
              { label: 'Fallback', value: String(FALLBACK) },
              { label: 'Disabled', value: String(DISABLED) },
              { label: 'Categories', value: String(CATEGORY_COUNT) },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-ibm-plex-sans text-[10px] uppercase text-white/60 mb-1">{s.label}</p>
                <p className="data-lg text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.title}>
            <div className="mb-3">
              <h2 className="font-satoshi font-medium text-base lg:text-lg text-[#11274d] tracking-tight">
                {cat.title}
              </h2>
              <p className="font-ibm-plex-sans text-xs text-[#6a7282] mt-0.5">
                {cat.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.items.map((item) => (
                <IntegrationCard key={item.name} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

// ── Card ──────────────────────────────────────────────────────

function IntegrationCard({ item }: { item: Integration }) {
  return (
    <Card className="p-4 flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot variant={item.status === 'live' ? 'live' : item.status === 'disabled' ? 'danger' : 'warning'} />
            <h3 className="font-satoshi font-medium text-sm text-[#11274d] truncate">
              {item.name}
            </h3>
          </div>
          <p className="font-ibm-plex-sans text-[10px] uppercase tracking-wide text-[#6a7282] mt-1">
            {item.kind}
          </p>
        </div>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[#6a7282] hover:text-[#11274d] transition-colors"
            aria-label={`Open ${item.name} site`}
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Purpose */}
      <p className="font-ibm-plex-sans text-xs text-[#374151] leading-relaxed flex-1">
        {item.purpose}
      </p>

      {/* Used on */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#e2e8f0]">
        <span className="font-ibm-plex-sans text-[10px] uppercase text-[#94a3b8] mr-1 pt-0.5">
          Used on
        </span>
        {item.usedOn.map((u) => (
          <span
            key={u}
            className="font-ibm-plex-sans text-[10px] text-[#11274d] bg-[#f1f5f9] border border-[#e2e8f0] rounded-sm px-1.5 py-0.5"
          >
            {u}
          </span>
        ))}
      </div>
    </Card>
  );
}
