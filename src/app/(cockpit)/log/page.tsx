'use client';

import { Card } from '@/components/ui/Card';

interface DayEntry {
  date: string;
  added: string;
  fixed: string;
  learned: string;
}

const LOG: DayEntry[] = [
  {
    date: '2026-04-10',
    added: 'Jupiter Swap wired into deposit flow — 5-step user story complete. Asgard UI design system (frost/hela/loki tokens) applied across all components.',
    fixed: 'Scalable token icons using Solana CDN replaced local images. Mobile 320px responsive pass on all cards and grids.',
    learned: 'No single CDN has all Solana token icons — need a multi-source fallback chain (known URLs → runtime cache → CDN → avatar).',
  },
  {
    date: '2026-04-11',
    added: 'Logo, live SOL price in bottom bar, clickable vault cards linking to detail view. Devnet vault strategy documented using SPL Token PDAs.',
    fixed: 'ETH token icon was wrong Wormhole-wrapped asset. Green text contrast on light background improved for accessibility.',
    learned: 'Kamino vault deposits are mainnet-only — can\'t demo without real money. This constraint drove the pivot to read-only cockpit.',
  },
  {
    date: '2026-04-12',
    added: 'Pivoted to DeFi Cockpit. Built route architecture (10 pages), protocol-agnostic DEX analytics, token detail with multi-source oracles, vault detail page, Project Overview dashboard.',
    fixed: 'Removed ALL hardcoded mock data — real Kamino SDK data or error banner, nothing fake. Liveline chart rendering fixed with explicit pixel height.',
    learned: 'Experience-first design wins hackathons — real data flowing through a stunning UI that people screenshot is more compelling than a half-working deposit pipeline.',
  },
  {
    date: '2026-04-13',
    added: 'Market page with live CoinGecko token list. Kamino Lending product integration. Multi-source token chart service (Binance → Birdeye → GeckoTerminal).',
    fixed: 'Removed fiat/Dodo deposit flow — enforced crypto-only deposits. Optimized build by removing 4 unused deps, externalizing Solana SDKs, lazy-loading Recharts.',
    learned: 'Agentation must be stripped from main on every merge — added a checklist in CLAUDE.md. Vault data split (general every 1hr, positions on wallet connect) cut RPC calls by 60%.',
  },
  {
    date: '2026-04-14',
    added: 'Sprint 1+2: DexScreener pairs, Sanctum LST Directory, NFT Holdings gallery, Trending tokens rail. Deriverse DEX devnet trade analytics with real on-chain parsing.',
    fixed: 'Vault APY/TVL/symbols now match kamino.finance exactly. RPC Fast + round-robin rotation across 3 providers eliminated single-point RPC failures.',
    learned: 'Pre-push hooks (lockfile sync + lint + typecheck + build + audit gate) catch issues before they reach CI — saves 10 min per push cycle.',
  },
  {
    date: '2026-04-15',
    added: 'Rich NFT view — attributes, creators, royalty, ownership, cNFT compression, collection filter pills, detail modal with Magic Eden/Tensor/Solscan links. Wallet chip dropdown (copy/disconnect/switch-soon).',
    fixed: 'Migrated Kamino + Jupiter + Deriverse services to current official docs. HeliusNftService expanded from 8 to 20+ parsed DAS fields. Pagination fix: 50 → 1000 NFT cap.',
    learned: 'Helius DAS response already contains all the NFT richness (attributes, creators, royalties) — we were just throwing it away in the parser. No new API needed.',
  },
  {
    date: '2026-04-16',
    added: 'Jupiter Ultra upgrade — swap page now uses /ultra/v1 (order/execute/shield/search/holdings). Live SPL token search combobox. Wallet balances section via Ultra holdings. Side track research: Umbra Privacy, Torque MCP, LI.FI.',
    fixed: 'Purged all mocks: deleted MockJupiterSwapService, ServiceFactory, useServices (dead code), FALLBACK_PRICES, stale cache. Prices return null when unavailable — UI shows "Price unavailable" instead of fake numbers.',
    learned: 'Jupiter Ultra\'s /shield endpoint detects scam tokens before swap execution — free safety layer. Umbra SDK uses @solana/kit (not web3.js) — adapter needed. Torque MCP is an AI-agent tool, not a traditional SDK.',
  },
];

export default function ProjectLogPage() {
  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div
        className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-6 border-b border-white/20"
        style={{
          marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)', paddingRight: 'calc(50vw - 50%)',
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-2">
            Project Log
          </h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70">
            Day-by-day evolution of DeFi Cockpit — what was added, what was fixed, what we learned.
          </p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-px bg-[#cbd5e1]" />

          <div className="space-y-6">
            {LOG.map((day, i) => (
              <div key={day.date} className="relative pl-9 sm:pl-12">
                {/* Dot */}
                <div className={
                  'absolute left-1.5 sm:left-2.5 top-4 w-3 h-3 rounded-full border-2 border-white ' +
                  (i === LOG.length - 1
                    ? 'bg-[#19549b]'
                    : 'bg-[#cbd5e1]')
                } />

                <Card className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <time className="font-mono text-xs text-[#6a7282]">{formatDate(day.date)}</time>
                    <span className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-ibm-plex-sans">
                      Day {i + 1}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <LogPoint
                      tag="Added"
                      tagColor="bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"
                      text={day.added}
                    />
                    <LogPoint
                      tag="Fixed"
                      tagColor="bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                      text={day.fixed}
                    />
                    <LogPoint
                      tag="Learned"
                      tagColor="bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]"
                      text={day.learned}
                    />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogPoint({ tag, tagColor, text }: { tag: string; tagColor: string; text: string }) {
  return (
    <div className="flex gap-2.5">
      <span className={
        'flex-shrink-0 inline-flex items-center h-5 px-1.5 rounded-sm text-[9px] uppercase tracking-wider font-ibm-plex-sans border ' + tagColor
      }>
        {tag}
      </span>
      <p className="text-xs text-[#11274d] font-ibm-plex-sans leading-relaxed">{text}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
