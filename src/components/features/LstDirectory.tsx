'use client';

import { useMemo, useState } from 'react';
import { Search, ExternalLink, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { getAllLsts, type LST } from '@/services/SanctumLstService';

type SortKey = 'name' | 'symbol' | 'program';

const POOL_LABELS: Record<string, string> = {
  Spl: 'SPL Stake Pool',
  SanctumSpl: 'Sanctum SPL',
  SanctumSplMulti: 'Sanctum Multi',
  Marinade: 'Marinade',
  Lido: 'Lido',
  ReservePool: 'Reserve Pool',
  SPool: 'S Pool',
};

const POOL_FILTERS = ['All', 'SanctumSpl', 'SanctumSplMulti', 'Spl', 'Marinade', 'Lido'] as const;

const PAGE_SIZE = 10;

export function LstDirectory() {
  const allLsts = useMemo(() => getAllLsts(), []);
  const [search, setSearch] = useState('');
  const [poolFilter, setPoolFilter] = useState<string>('All');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allLsts;
    if (poolFilter !== 'All') {
      list = list.filter((l) => l.pool.program === poolFilter);
    }
    if (q) {
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.symbol.toLowerCase().includes(q) ||
          l.mint.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av: string, bv: string;
      if (sortKey === 'program') {
        av = a.pool.program;
        bv = b.pool.program;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [allLsts, search, poolFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const onSearchChange = (value: string) => { setSearch(value); setPage(0); };
  const onFilterChange = (value: string) => { setPoolFilter(value); setPage(0); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paginated = useMemo(() => filtered.slice(pageStart, pageEnd), [filtered, pageStart, pageEnd]);

  const poolCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allLsts.length };
    allLsts.forEach((l) => { counts[l.pool.program] = (counts[l.pool.program] ?? 0) + 1; });
    return counts;
  }, [allLsts]);

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
            Solana LST Directory
          </h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70 mb-6">
            {allLsts.length} Liquid Staking Tokens from the Sanctum registry — every validator LST on Solana.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total LSTs', value: String(allLsts.length) },
              { label: 'Sanctum SPL', value: String(poolCounts['SanctumSpl'] ?? 0) },
              { label: 'Multi-Validator', value: String(poolCounts['SanctumSplMulti'] ?? 0) },
              { label: 'Classic SPL', value: String(poolCounts['Spl'] ?? 0) },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-ibm-plex-sans text-[10px] uppercase text-white/60 mb-1">{s.label}</p>
                <p className="data-lg text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search + Pool Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, symbol, or mint…"
              className="w-full bg-white border border-[#cbd5e1] rounded-sm pl-9 pr-3 py-2 text-sm font-ibm-plex-sans text-[#11274d] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3B7DDD]"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <Filter size={12} className="text-[#94a3b8] shrink-0" />
            {POOL_FILTERS.map((f) => (
              <Pill key={f} active={poolFilter === f} onClick={() => onFilterChange(f)}>
                {f === 'All' ? `All (${poolCounts.All})` : `${POOL_LABELS[f] ?? f} (${poolCounts[f] ?? 0})`}
              </Pill>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-[#6a7282] font-ibm-plex-sans">
          {filtered.length === 0
            ? 'No LSTs found'
            : `Showing ${pageStart + 1}–${Math.min(pageEnd, filtered.length)} of ${filtered.length} LST${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Desktop table */}
        <Card className="hidden md:block overflow-hidden p-0">
          <table className="w-full text-sm font-ibm-plex-sans">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th
                  className="text-left py-3 px-4 text-[10px] uppercase text-[#6a7282] font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('name')}
                >
                  LST {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  className="text-left py-3 px-4 text-[10px] uppercase text-[#6a7282] font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('symbol')}
                >
                  Symbol {sortKey === 'symbol' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  className="text-left py-3 px-4 text-[10px] uppercase text-[#6a7282] font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('program')}
                >
                  Pool Type {sortKey === 'program' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="text-left py-3 px-4 text-[10px] uppercase text-[#6a7282] font-medium">Mint</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((lst) => (
                <LstRow key={lst.mint} lst={lst} />
              ))}
            </tbody>
          </table>
        </Card>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {paginated.map((lst) => (
            <LstCard key={lst.mint} lst={lst} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-sm border border-[#cbd5e1] bg-white text-xs font-ibm-plex-sans text-[#11274d] hover:bg-[#e2e8f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <span className="text-xs text-[#6a7282] font-ibm-plex-sans">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-sm border border-[#cbd5e1] bg-white text-xs font-ibm-plex-sans text-[#11274d] hover:bg-[#e2e8f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function LstRow({ lst }: { lst: LST }) {
  const poolLabel = POOL_LABELS[lst.pool.program] ?? lst.pool.program;
  return (
    <tr className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          {lst.logoUri ? (
            /* eslint-disable-next-line @next/next/no-img-element -- external CDN icon, Next Image not practical */
            <img
              src={lst.logoUri}
              alt={lst.symbol}
              className="w-6 h-6 rounded-full object-cover shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#e2e8f0] shrink-0" />
          )}
          <span className="text-sm font-medium text-[#11274d]">{lst.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-[#11274d] font-mono">{lst.symbol}</td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#f1f5f9] text-[10px] text-[#6a7282] font-medium">
          {poolLabel}
        </span>
      </td>
      <td className="py-3 px-4 text-[10px] text-[#94a3b8] font-mono">
        {lst.mint.slice(0, 8)}…{lst.mint.slice(-6)}
      </td>
      <td className="py-3 px-2">
        <a
          href={`https://jup.ag/swap/SOL-${lst.mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-[#3B7DDD] hover:underline font-ibm-plex-sans"
        >
          Swap <ExternalLink size={10} />
        </a>
      </td>
    </tr>
  );
}

function LstCard({ lst }: { lst: LST }) {
  const poolLabel = POOL_LABELS[lst.pool.program] ?? lst.pool.program;
  return (
    <a href={`https://jup.ag/swap/SOL-${lst.mint}`} target="_blank" rel="noopener noreferrer">
      <Card hover className="p-3">
        <div className="flex items-center gap-3">
          {lst.logoUri ? (
            /* eslint-disable-next-line @next/next/no-img-element -- external CDN icon, Next Image not practical */
            <img
              src={lst.logoUri}
              alt={lst.symbol}
              className="w-8 h-8 rounded-full object-cover shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#e2e8f0] shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#11274d] truncate">{lst.name}</p>
              <ExternalLink size={12} className="text-[#94a3b8] shrink-0 ml-2" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#6a7282] font-mono">{lst.symbol}</span>
              <span className="inline-flex items-center px-1.5 py-0 rounded-sm bg-[#f1f5f9] text-[9px] text-[#94a3b8]">
                {poolLabel}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}
