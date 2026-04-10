'use client';

import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, TrendingUp, Layers } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { MOCK_KAMINO_VAULTS } from '@/lib/mockKaminoData';
import { KaminoVaultInfo } from '@/lib/lp-types';
import { formatPercent, formatCompact } from '@/lib/utils';

type SortField = 'apy' | 'tvl' | 'volume24h' | 'fees24h';
type SortDir = 'asc' | 'desc';

export function VaultExplorer() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('tvl');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [strategyFilter, setStrategyFilter] = useState('all');

  const vaults = MOCK_KAMINO_VAULTS;
  const strategies = ['all', ...new Set(vaults.map(v => v.strategy))];

  const filtered = useMemo(() => {
    let result = vaults;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(q) || v.tokenA.symbol.toLowerCase().includes(q) || v.tokenB.symbol.toLowerCase().includes(q));
    }
    if (strategyFilter !== 'all') result = result.filter(v => v.strategy === strategyFilter);
    return [...result].sort((a, b) => sortDir === 'desc' ? b[sortField] - a[sortField] : a[sortField] - b[sortField]);
  }, [vaults, search, strategyFilter, sortField, sortDir]);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const SortHead = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => toggleSort(field)} className={`flex items-center gap-1 label-section transition-colors ${sortField === field ? 'text-white' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}>
      {label} <ArrowUpDown size={10} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-xl text-white">Vault Explorer</h2>
        <p className="text-sm text-[#9CA3AF] mt-1">Browse and compare Kamino vaults</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search by name or token..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-white/12 rounded-lg text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-white/25"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {strategies.map(s => (
            <Pill key={s} active={strategyFilter === s} onClick={() => setStrategyFilter(s)}>
              {s === 'all' ? 'All' : s.replace('-', ' ')}
            </Pill>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left py-3 pr-4"><span className="label-section">Vault</span></th>
              <th className="text-right py-3 px-3"><SortHead field="apy" label="APY" /></th>
              <th className="text-right py-3 px-3"><SortHead field="tvl" label="TVL" /></th>
              <th className="text-right py-3 px-3 hidden md:table-cell"><SortHead field="volume24h" label="24h Vol" /></th>
              <th className="text-right py-3 px-3 hidden md:table-cell"><SortHead field="fees24h" label="24h Fees" /></th>
              <th className="text-right py-3 pl-3"><span className="label-section">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(vault => (
              <tr key={vault.address} className="border-b border-white/8 hover:bg-white/2 transition-colors">
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                      <div className="w-6 h-6 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-[9px] font-medium text-[#9CA3AF]">
                        {vault.tokenA.symbol.slice(0, 2)}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white/8 border border-white/12 flex items-center justify-center text-[9px] font-medium text-[#9CA3AF]">
                        {vault.tokenB.symbol.slice(0, 2)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{vault.name}</p>
                      <p className="text-xs text-[#6B7280]">{vault.strategy.replace('-', ' ')}{vault.curator ? ` · ${vault.curator}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="text-right py-4 px-3">
                  <span className="data-md text-[#10B981] flex items-center justify-end gap-1">
                    <TrendingUp size={12} />{formatPercent(vault.apy)}
                  </span>
                </td>
                <td className="text-right py-4 px-3"><span className="data-md text-[#9CA3AF]">{formatCompact(vault.tvl)}</span></td>
                <td className="text-right py-4 px-3 hidden md:table-cell"><span className="data-sm text-[#6B7280]">{formatCompact(vault.volume24h)}</span></td>
                <td className="text-right py-4 px-3 hidden md:table-cell"><span className="data-sm text-[#6B7280]">{formatCompact(vault.fees24h)}</span></td>
                <td className="text-right py-4 pl-3">
                  <Button variant="success" size="sm">Deposit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-12 text-center text-[#6B7280] text-sm">No vaults found.</p>}
      </div>
    </div>
  );
}
