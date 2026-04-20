'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatUsd, formatCompact } from '@/lib/utils';
import { fetchTokenList, type TokenListItem } from '@/services/BirdeyeService';
import { getTokenIcon } from '@/lib/tokenIcons';

type SortField = 'rank' | 'price' | 'priceChange24hPercent' | 'mc' | 'v24hUSD';
type SortDir = 'asc' | 'desc';

interface RankedToken extends TokenListItem {
  rank: number;
}

export function MarketTokenList() {
  const router = useRouter();
  const [tokens, setTokens] = useState<RankedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await fetchTokenList(50, 'mc');
        if (cancelled) return;
        const ranked: RankedToken[] = raw.map((t, i) => ({ ...t, rank: i + 1 }));
        setTokens(ranked);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch market data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = tokens;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.name ?? '').toLowerCase().includes(q) ||
        (t.symbol ?? '').toLowerCase().includes(q) ||
        t.address.toLowerCase().startsWith(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = (a[sortField] as number) ?? 0;
      const bv = (b[sortField] as number) ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [tokens, search, sortField, sortDir]);

  // Headline stats
  const totalMarketCap = tokens.reduce((s, t) => s + (t.mc ?? 0), 0);
  const totalVolume = tokens.reduce((s, t) => s + (t.v24hUSD ?? 0), 0);
  const avgChange = tokens.length > 0
    ? tokens.reduce((s, t) => s + (t.priceChange24hPercent ?? 0), 0) / tokens.length
    : 0;

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
            Top Solana tokens by market cap — powered by Birdeye.
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
        {/* ── Search ───────────────────────────────────────────── */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search by name, symbol or mint…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#cbd5e1] rounded-sm text-sm text-[#11274d] placeholder:text-[#6B7280] focus:outline-none focus:border-[#19549b]"
          />
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
                    {renderSortHead('price', 'Price')}
                  </th>
                  <th className="text-right py-3 px-3">
                    {renderSortHead('priceChange24hPercent', '24h %')}
                  </th>
                  <th className="text-right py-3 px-3 hidden md:table-cell">
                    {renderSortHead('mc', 'Mkt Cap')}
                  </th>
                  <th className="text-right py-3 pl-3 pr-4 hidden md:table-cell">
                    {renderSortHead('v24hUSD', 'Volume')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((token) => {
                  const change = token.priceChange24hPercent ?? 0;
                  const positive = change >= 0;
                  const href = `/cockpit/token/${token.address}`;
                  const icon = token.logoURI ?? getTokenIcon(token.address, token.symbol);

                  return (
                    <tr
                      key={token.address}
                      onClick={() => router.push(href)}
                      className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pl-4 pr-2">
                        <span className="data-sm text-[#6B7280]">{token.rank}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element -- external CDN icon with dynamic fallback */}
                          <img
                            src={icon}
                            alt={token.symbol}
                            className="w-6 h-6 rounded-full object-cover shrink-0 bg-[#f1f5f9]"
                            onError={(e) => {
                              const t = e.currentTarget;
                              t.src = `https://ui-avatars.com/api/?name=${(token.symbol ?? '?').slice(0, 3)}&background=19549b&color=fff&size=64&bold=true&format=svg`;
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#11274d] truncate">{token.name || token.symbol}</p>
                            <p className="text-xs text-[#6B7280] uppercase">{token.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3.5 px-3">
                        <span className="data-md text-[#11274d]">
                          {token.price < 0.01
                            ? `$${token.price.toFixed(6)}`
                            : formatUsd(token.price)}
                        </span>
                      </td>
                      <td className="text-right py-3.5 px-3">
                        <span className={`data-md flex items-center justify-end gap-1 ${positive ? 'text-[#059669]' : 'text-[#ef4444]'}`}>
                          <TrendingUp size={12} className={!positive ? 'rotate-180' : ''} />
                          {positive ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-right py-3.5 px-3 hidden md:table-cell">
                        <span className="data-sm text-[#11274d]">{formatCompact(token.mc)}</span>
                      </td>
                      <td className="text-right py-3.5 pl-3 pr-4 hidden md:table-cell">
                        <span className="data-sm text-[#6B7280]">{formatCompact(token.v24hUSD)}</span>
                      </td>
                    </tr>
                  );
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
