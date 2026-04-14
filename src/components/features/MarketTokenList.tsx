'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { formatUsd, formatCompact } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────

interface MarketToken {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  market_cap_rank: number;
}

// Map CoinGecko IDs → Solana mint addresses for tokens we support
const GECKO_TO_MINT: Record<string, string> = {
  'solana': 'So11111111111111111111111111111111111111112',
  'usd-coin': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'ethereum': '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  'jupiter-exchange-solana': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'jito-governance-token': 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  'bonk': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

// Category tags for filtering
const DEFI_IDS = new Set(['jupiter-exchange-solana', 'jito-governance-token', 'raydium', 'orca', 'marinade', 'drift-protocol', 'kamino']);
const MEME_IDS = new Set(['bonk', 'dogwifcoin', 'popcat', 'book-of-meme', 'cat-in-a-dogs-world']);
const STABLE_IDS = new Set(['usd-coin', 'tether', 'dai']);

type FilterTab = 'all' | 'defi' | 'meme' | 'stablecoin';
type SortField = 'market_cap_rank' | 'current_price' | 'price_change_percentage_24h' | 'market_cap' | 'total_volume';
type SortDir = 'asc' | 'desc';

function getCategory(id: string): FilterTab {
  if (DEFI_IDS.has(id)) return 'defi';
  if (MEME_IDS.has(id)) return 'meme';
  if (STABLE_IDS.has(id)) return 'stablecoin';
  return 'all';
}

// ── Component ─────────────────────────────────────────────────

export function MarketTokenList() {
  const [tokens, setTokens] = useState<MarketToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sortField, setSortField] = useState<SortField>('market_cap_rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&order=market_cap_desc&per_page=50&page=1&sparkline=false'
        );
        if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
        const raw = await res.json();
        if (!Array.isArray(raw)) {
          throw new Error('CoinGecko returned unexpected payload.');
        }
        const data = raw as MarketToken[];
        setTokens(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    }
    fetchMarket();
    const interval = setInterval(fetchMarket, 60_000);
    return () => clearInterval(interval);
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = tokens;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q));
    }
    if (filter !== 'all') {
      list = list.filter(t => getCategory(t.id) === filter);
    }
    return [...list].sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      return sortDir === 'desc' ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
  }, [tokens, search, filter, sortField, sortDir]);

  // Headline stats
  const totalMarketCap = tokens.reduce((s, t) => s + (t.market_cap ?? 0), 0);
  const totalVolume = tokens.reduce((s, t) => s + (t.total_volume ?? 0), 0);
  const avgChange = tokens.length > 0 ? tokens.reduce((s, t) => s + (t.price_change_percentage_24h ?? 0), 0) / tokens.length : 0;

  const renderSortHead = (field: SortField, label: string) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 ml-auto label-section-light transition-colors ${sortField === field ? 'text-[#11274d]' : 'text-[#6B7280] hover:text-[#11274d]'}`}
    >
      {label} <ArrowUpDown size={10} />
    </button>
  );

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div
        className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-6 border-b border-white/20"
        style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)',
          paddingRight: 'calc(50vw - 50%)',
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-1">
            Market Overview
          </h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70 mb-6">
            Live prices from the Solana ecosystem — powered by CoinGecko.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Tokens', value: tokens.length.toString(), color: 'text-white' },
              { label: 'Total Market Cap', value: formatCompact(totalMarketCap), color: 'text-white' },
              { label: '24h Volume', value: formatCompact(totalVolume), color: 'text-white' },
              { label: 'Avg 24h Change', value: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`, color: avgChange >= 0 ? 'text-[#7ee5c6]' : 'text-[#ef4444]' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="label-section mb-1">{stat.label}</p>
                <p className={`data-lg ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* ── Search + Filters ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#cbd5e1] rounded-sm text-sm text-[#11274d] placeholder:text-[#6B7280] focus:outline-none focus:border-[#19549b]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'defi', 'meme', 'stablecoin'] as FilterTab[]).map(tab => (
              <Pill key={tab} active={filter === tab} onClick={() => setFilter(tab)}>
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Pill>
            ))}
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────────── */}
        {error && (
          <Card className="p-4 bg-[#FEF2F2] border border-[#FECACA]">
            <p className="text-sm text-[#991B1B] font-ibm-plex-sans">Failed to load market data: {error}</p>
          </Card>
        )}

        {/* ── Token Table ──────────────────────────────────────── */}
        {loading ? (
          <Card className="p-4">
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-[#e2e8f0] rounded-sm" />
              ))}
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto bg-white rounded-sm raised-frosted">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left py-3 pl-4 pr-2 w-10">
                    <span className="label-section-light">#</span>
                  </th>
                  <th className="text-left py-3 pr-4">
                    <span className="label-section-light">Token</span>
                  </th>
                  <th className="text-right py-3 px-3">
                    {renderSortHead('current_price', 'Price')}
                  </th>
                  <th className="text-right py-3 px-3">
                    {renderSortHead('price_change_percentage_24h', '24h %')}
                  </th>
                  <th className="text-right py-3 px-3 hidden md:table-cell">
                    {renderSortHead('market_cap', 'Mkt Cap')}
                  </th>
                  <th className="text-right py-3 pl-3 pr-4 hidden md:table-cell">
                    {renderSortHead('total_volume', 'Volume')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((token) => {
                  const change = token.price_change_percentage_24h ?? 0;
                  const positive = change >= 0;
                  const mint = GECKO_TO_MINT[token.id];
                  const href = mint ? `/token/${mint}` : undefined;

                  const row = (
                    <tr
                      key={token.id}
                      className={`border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] transition-colors ${href ? 'cursor-pointer' : ''}`}
                    >
                      <td className="py-3.5 pl-4 pr-2">
                        <span className="data-sm text-[#6B7280]">{token.market_cap_rank ?? '—'}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={token.image}
                            alt={token.symbol}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                            onError={(e) => {
                              const t = e.currentTarget;
                              t.src = `https://ui-avatars.com/api/?name=${token.symbol.slice(0, 3)}&background=19549b&color=fff&size=64&bold=true&format=svg`;
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium text-[#11274d]">{token.name}</p>
                            <p className="text-xs text-[#6B7280] uppercase">{token.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3.5 px-3">
                        <span className="data-md text-[#11274d]">
                          {token.current_price < 0.01
                            ? `$${token.current_price.toFixed(6)}`
                            : formatUsd(token.current_price)}
                        </span>
                      </td>
                      <td className="text-right py-3.5 px-3">
                        <span className={`data-md flex items-center justify-end gap-1 ${positive ? 'text-[#059669]' : 'text-[#ef4444]'}`}>
                          <TrendingUp size={12} className={!positive ? 'rotate-180' : ''} />
                          {positive ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-right py-3.5 px-3 hidden md:table-cell">
                        <span className="data-sm text-[#11274d]">{formatCompact(token.market_cap)}</span>
                      </td>
                      <td className="text-right py-3.5 pl-3 pr-4 hidden md:table-cell">
                        <span className="data-sm text-[#6B7280]">{formatCompact(token.total_volume)}</span>
                      </td>
                    </tr>
                  );

                  return href ? <Link key={token.id} href={href} className="contents">{row}</Link> : row;
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-12 text-center text-[#6B7280] text-sm">No tokens found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
