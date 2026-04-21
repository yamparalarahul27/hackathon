'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, ArrowDownUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatUsd, formatCompact } from '@/lib/utils';
import { fetchTopTokens, type MarketToken } from '@/services/JupiterTokenListService';
import {
  fetchNewListings,
  fetchTokenSecurity,
  fetchTrendingTokens,
  scoreTokenSecurity,
  type SecurityLevel,
} from '@/services/BirdeyeService';
import { getTokenIcon } from '@/lib/tokenIcons';

type SortField = 'rank' | 'price' | 'priceChange24h' | 'mcap' | 'volume24h';
type SortDir = 'asc' | 'desc';
type SourceFilter = 'all' | 'trending' | 'new';
type SafetyFilter = 'all' | SecurityLevel | 'na';

interface Props {
  refreshToken?: number;
  onSuccessfulFetch?: (at: Date) => void;
}

export function MarketTokenList({ refreshToken = 0, onSuccessfulFetch }: Props) {
  const [tokens, setTokens] = useState<MarketToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [safetyFilter, setSafetyFilter] = useState<SafetyFilter>('all');
  const [trendingSet, setTrendingSet] = useState<Set<string>>(new Set());
  const [newSet, setNewSet] = useState<Set<string>>(new Set());
  const [safetyByMint, setSafetyByMint] = useState<Record<string, SecurityLevel | 'na'>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchTopTokens('toptraded', '24h');
        if (cancelled) return;
        setTokens(data);
        setError(null);
        onSuccessfulFetch?.(new Date());
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
  }, [onSuccessfulFetch, refreshToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [trending, listings] = await Promise.all([
          fetchTrendingTokens(60, 0),
          fetchNewListings(60, '24h'),
        ]);
        if (cancelled) return;
        setTrendingSet(new Set(trending.map((t) => t.address)));
        setNewSet(new Set(listings.map((t) => t.address)));
      } catch {
        // Keep page usable even if one of these lists fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    let cancelled = false;
    if (tokens.length === 0) return;

    const base: Record<string, SecurityLevel | 'na'> = {};
    for (const token of tokens) base[token.address] = 'na';
    setSafetyByMint(base);

    (async () => {
      const sample = tokens.slice(0, 12);
      const next = { ...base };

      for (let i = 0; i < sample.length; i += 4) {
        if (cancelled) return;
        const chunk = sample.slice(i, i + 4);
        const settled = await Promise.allSettled(
          chunk.map(async (token) => {
            const sec = await fetchTokenSecurity(token.address);
            const score = scoreTokenSecurity(sec);
            return { mint: token.address, level: score.level };
          })
        );
        for (const result of settled) {
          if (result.status === 'fulfilled') {
            next[result.value.mint] = result.value.level;
          }
        }
      }
      if (!cancelled) setSafetyByMint(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [tokens]);

  const filtered = useMemo(() => {
    let list = tokens;

    if (sourceFilter === 'trending') {
      list = list.filter((t) => trendingSet.has(t.address));
    } else if (sourceFilter === 'new') {
      list = list.filter((t) => newSet.has(t.address));
    }

    if (safetyFilter !== 'all') {
      list = list.filter((t) => (safetyByMint[t.address] ?? 'na') === safetyFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
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
  }, [newSet, safetyByMint, safetyFilter, search, sortDir, sortField, sourceFilter, tokens, trendingSet]);

  return (
    <section id="market-table" className="space-y-3 scroll-mt-24">
      <div className="rounded-sm border border-[#d8e1ee] bg-white p-3 space-y-3">
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

        <div className="flex flex-wrap items-center gap-2">
          <Chip active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')}>
            All
          </Chip>
          <Chip active={sourceFilter === 'trending'} onClick={() => setSourceFilter('trending')}>
            Trending
          </Chip>
          <Chip active={sourceFilter === 'new'} onClick={() => setSourceFilter('new')}>
            New
          </Chip>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-[#6a7282] font-ibm-plex-sans">Safety</label>
            <select
              value={safetyFilter}
              onChange={(e) => setSafetyFilter(e.target.value as SafetyFilter)}
              className="h-8 rounded-sm border border-[#d0d9e6] bg-white px-2 text-xs font-ibm-plex-sans text-[#11274d]"
            >
              <option value="all">All</option>
              <option value="safe">Safe</option>
              <option value="caution">Caution</option>
              <option value="danger">Risk</option>
              <option value="na">N/A</option>
            </select>
            <label className="text-xs text-[#6a7282] font-ibm-plex-sans">Sort</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="h-8 rounded-sm border border-[#d0d9e6] bg-white px-2 text-xs font-ibm-plex-sans text-[#11274d]"
            >
              <option value="volume24h">24h Volume</option>
              <option value="priceChange24h">24h %</option>
              <option value="mcap">Mkt Cap</option>
              <option value="price">Price</option>
              <option value="rank">Rank</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              className="inline-flex items-center gap-1 h-8 px-2 rounded-sm border border-[#d0d9e6] text-xs font-ibm-plex-sans text-[#11274d] hover:bg-[#f8fafc]"
            >
              <ArrowDownUp size={12} />
              {sortDir === 'desc' ? 'Desc' : 'Asc'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-[#fff7ed] border border-[#fed7aa]">
          <p className="text-sm text-[#9a3412] font-ibm-plex-sans">
            {toMarketFallbackMessage(error, tokens.length > 0)}
          </p>
        </Card>
      )}

      {loading ? (
        <Card className="p-4">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
                  <span className="label-section-light">Price</span>
                </th>
                <th className="text-right py-3 px-3">
                  <span className="label-section-light">24h %</span>
                </th>
                <th className="text-right py-3 px-3 hidden md:table-cell">
                  <span className="label-section-light">Volume 24h</span>
                </th>
                <th className="text-right py-3 px-3 hidden md:table-cell">
                  <span className="label-section-light">Mkt Cap</span>
                </th>
                <th className="text-right py-3 px-3">
                  <span className="label-section-light">Safety</span>
                </th>
                <th className="text-right py-3 pl-3 pr-4">
                  <span className="label-section-light">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((token) => {
                const change = token.priceChange24h ?? 0;
                const positive = change >= 0;
                const href = `/cockpit/token/${token.address}`;
                const icon = token.icon ?? getTokenIcon(token.address, token.symbol);
                const safety = safetyByMint[token.address] ?? 'na';

                return (
                  <tr
                    key={token.address}
                    className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] transition-colors"
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
                      <span className="data-sm text-[#11274d]">{formatCompact(token.volume24h)}</span>
                    </td>
                    <td className="text-right py-3.5 px-3 hidden md:table-cell">
                      <span className="data-sm text-[#6B7280]">{formatCompact(token.mcap)}</span>
                    </td>
                    <td className="text-right py-3.5 px-3">
                      <SafetyPill level={safety} />
                    </td>
                    <td className="text-right py-3.5 pl-3 pr-4">
                      <Link
                        href={href}
                        className="inline-flex items-center h-7 px-2.5 rounded-sm border border-[#d0d9e6] text-xs font-ibm-plex-sans text-[#11274d] hover:bg-[#f8fafc]"
                      >
                        View
                      </Link>
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

      <p className="text-xs text-[#6a7282] font-ibm-plex-sans">
        Safety legend: <span className="text-[#059669]">Safe</span> |{' '}
        <span className="text-[#d97706]">Caution</span> |{' '}
        <span className="text-[#dc2626]">Risk</span> |{' '}
        <span className="text-[#64748b]">N/A</span>
      </p>
    </section>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-sm text-xs font-ibm-plex-sans border transition-colors ${
        active
          ? 'border-[#19549b] bg-[#e8f0ff] text-[#19549b]'
          : 'border-[#d0d9e6] text-[#11274d] hover:bg-[#f8fafc]'
      }`}
    >
      {children}
    </button>
  );
}

function SafetyPill({ level }: { level: SecurityLevel | 'na' }) {
  if (level === 'na') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] border bg-[#f8fafc] text-[#64748b] border-[#dbe3ef] font-ibm-plex-sans">
        N/A
      </span>
    );
  }

  const config = {
    safe: 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]',
    caution: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]',
    danger: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  }[level];

  const label = level === 'danger' ? 'Risk' : level === 'safe' ? 'Safe' : 'Caution';

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] border font-ibm-plex-sans ${config}`}>
      {label}
    </span>
  );
}

function toMarketFallbackMessage(rawError: string, hasSnapshot: boolean): string {
  if (/\b429\b/.test(rawError)) {
    if (hasSnapshot) {
      return 'Market API is temporarily rate-limited. Showing the latest available snapshot.';
    }
    return 'Market data is temporarily rate-limited. Please retry in about a minute.';
  }
  if (/\b403\b/.test(rawError)) {
    return 'Market data is temporarily unavailable due to provider access limits.';
  }
  if (/timeout|aborted|network/i.test(rawError)) {
    return 'Market request timed out. Please refresh and try again.';
  }
  return hasSnapshot
    ? 'Live market refresh is temporarily unavailable. Showing the latest available snapshot.'
    : 'Market data is temporarily unavailable. Please try again shortly.';
}
