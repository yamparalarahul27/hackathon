'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { TokenIcon } from '@/components/ui/TokenIcon';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';
import { formatCompact, formatPercent } from '@/lib/utils';
import type { LendingMarketSnapshot, LendingReserve } from '@/lib/lend-types';

type SortKey = 'totalSupplyUsd' | 'totalBorrowUsd' | 'supplyApy' | 'borrowApy' | 'utilization';

interface Props {
  snapshot: LendingMarketSnapshot | null;
  loading: boolean;
  error: string | null;
}

const HEADERS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'totalSupplyUsd', label: 'Supplied', align: 'right' },
  { key: 'supplyApy', label: 'Supply APY', align: 'right' },
  { key: 'totalBorrowUsd', label: 'Borrowed', align: 'right' },
  { key: 'borrowApy', label: 'Borrow APY', align: 'right' },
  { key: 'utilization', label: 'Utilization', align: 'right' },
];

export function LendingMarketTable({ snapshot, loading, error }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('totalSupplyUsd');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const reserves = snapshot?.reserves ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = reserves;
    if (q) {
      list = list.filter(
        (r) =>
          r.symbol.toLowerCase().includes(q) ||
          r.mint.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return list;
  }, [reserves, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-12 min-h-screen">
      {/* Hero */}
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
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-2">
            Kamino Lending Market
          </h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70 mb-6">
            Live klend reserves on the Main Market — supply, borrow, utilization, and rates.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Supplied', value: snapshot ? formatCompact(snapshot.market.totalSupplyUsd) : '—' },
              { label: 'Total Borrowed', value: snapshot ? formatCompact(snapshot.market.totalBorrowUsd) : '—' },
              { label: 'Reserves', value: snapshot ? String(snapshot.market.reserveCount) : '—' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-ibm-plex-sans text-[10px] uppercase text-white/60 mb-1">{s.label}</p>
                <p className="data-lg text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-4">
        {error && <RpcErrorBanner message={error} />}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by symbol or mint…"
            className="w-full bg-white border border-[#cbd5e1] rounded-sm pl-9 pr-3 py-2 text-sm font-ibm-plex-sans text-[#11274d] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3B7DDD]"
          />
        </div>

        {/* Loading */}
        {loading && reserves.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">Loading lending reserves…</p>
          </Card>
        )}

        {/* Empty */}
        {!loading && reserves.length === 0 && !error && (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">No reserves found.</p>
          </Card>
        )}

        {/* Desktop table */}
        {filtered.length > 0 && (
          <Card className="hidden md:block overflow-hidden p-0">
            <table className="w-full text-sm font-ibm-plex-sans">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="text-left py-3 px-4 text-[10px] uppercase text-[#6a7282] font-medium">Asset</th>
                  {HEADERS.map((h) => (
                    <th
                      key={h.key}
                      className="py-3 px-4 text-[10px] uppercase text-[#6a7282] font-medium cursor-pointer select-none"
                      onClick={() => toggleSort(h.key)}
                    >
                      <span className={`inline-flex items-center gap-1 ${h.align === 'right' ? 'justify-end w-full' : ''}`}>
                        {h.label}
                        <ArrowUpDown size={10} className={sortKey === h.key ? 'text-[#11274d]' : 'text-[#cbd5e1]'} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <ReserveRow key={r.address} reserve={r} />
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Mobile cards */}
        {filtered.length > 0 && (
          <div className="md:hidden space-y-2">
            {filtered.map((r) => (
              <ReserveCard key={r.address} reserve={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReserveRow({ reserve }: { reserve: LendingReserve }) {
  return (
    <tr className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
      <td className="py-3 px-4">
        <Link href={`/token/${reserve.mint}`} className="flex items-center gap-2 hover:opacity-80">
          <TokenIcon mint={reserve.mint} symbol={reserve.symbol} size="sm" />
          <div>
            <p className="text-sm font-medium text-[#11274d]">{reserve.symbol}</p>
            <p className="text-[10px] text-[#94a3b8]">${reserve.priceUsd.toFixed(reserve.priceUsd < 1 ? 4 : 2)}</p>
          </div>
        </Link>
      </td>
      <td className="py-3 px-4 text-right data-md text-[#11274d]">{formatCompact(reserve.totalSupplyUsd)}</td>
      <td className="py-3 px-4 text-right data-md text-[#0fa87a]">{formatPercent(reserve.supplyApy * 100)}</td>
      <td className="py-3 px-4 text-right data-md text-[#11274d]">{formatCompact(reserve.totalBorrowUsd)}</td>
      <td className="py-3 px-4 text-right data-md text-[#ef4444]">{formatPercent(reserve.borrowApy * 100)}</td>
      <td className="py-3 px-4 text-right data-md text-[#6a7282]">{formatPercent(reserve.utilization * 100)}</td>
    </tr>
  );
}

function ReserveCard({ reserve }: { reserve: LendingReserve }) {
  return (
    <Link href={`/token/${reserve.mint}`}>
      <Card hover className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TokenIcon mint={reserve.mint} symbol={reserve.symbol} size="sm" />
            <div>
              <p className="text-sm font-medium text-[#11274d]">{reserve.symbol}</p>
              <p className="text-[10px] text-[#94a3b8]">${reserve.priceUsd.toFixed(reserve.priceUsd < 1 ? 4 : 2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#94a3b8] uppercase">Supply APY</p>
            <p className="data-md text-[#0fa87a]">{formatPercent(reserve.supplyApy * 100)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f1f5f9]">
          <Stat label="Supplied" value={formatCompact(reserve.totalSupplyUsd)} />
          <Stat label="Borrowed" value={formatCompact(reserve.totalBorrowUsd)} />
          <Stat label="Utilization" value={formatPercent(reserve.utilization * 100)} />
        </div>
      </Card>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#94a3b8] uppercase">{label}</p>
      <p className="text-xs text-[#11274d] font-medium">{value}</p>
    </div>
  );
}
