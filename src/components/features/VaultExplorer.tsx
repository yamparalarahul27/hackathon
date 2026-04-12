'use client';

import { useState } from 'react';
import { Search, ArrowUpDown, TrendingUp } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { TokenPairIcons, TokenIcon } from '@/components/ui/TokenIcon';
import { MOCK_KAMINO_VAULTS } from '@/lib/mockKaminoData';
import { KaminoVaultInfo } from '@/lib/lp-types';
import { formatPercent, formatCompact } from '@/lib/utils';

type SortField = 'apy' | 'tvl' | 'volume24h' | 'fees24h';
type SortDir = 'asc' | 'desc';

interface VaultExplorerProps {
  vaults?: KaminoVaultInfo[];
}

export function VaultExplorer({ vaults = MOCK_KAMINO_VAULTS }: VaultExplorerProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('tvl');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [strategyFilter, setStrategyFilter] = useState('all');
  const strategies = ['all', ...new Set(vaults.map(v => v.strategy))];

  let filtered = vaults;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(v => v.name.toLowerCase().includes(q) || v.tokenA.symbol.toLowerCase().includes(q) || v.tokenB.symbol.toLowerCase().includes(q));
  }
  if (strategyFilter !== 'all') filtered = filtered.filter(v => v.strategy === strategyFilter);
  filtered = [...filtered].sort((a, b) => sortDir === 'desc' ? b[sortField] - a[sortField] : a[sortField] - b[sortField]);

  const toggleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const renderSortHead = (field: SortField, label: string) => (
    <button onClick={() => toggleSort(field)} className={`flex items-center gap-1 ml-auto label-section-light transition-colors ${sortField === field ? 'text-[#11274d]' : 'text-[#6B7280] hover:text-[#11274d]'}`}>
      {label} <ArrowUpDown size={10} />
    </button>
  );

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d]">Vault Explorer</h2>
          <p className="text-sm text-[#6a7282] mt-1">Browse and compare Kamino vaults</p>
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
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-sm text-[#11274d] placeholder:text-[#6B7280] focus:outline-none focus:border-[#19549b]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {strategies.map(s => (
              <Pill key={s} active={strategyFilter === s} onClick={() => setStrategyFilter(s)}>
                {s === 'all' ? 'All' : s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Pill>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-sm raised-frosted">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="text-left py-3 pr-4 pl-4"><span className="label-section-light">Vault</span></th>
                <th className="text-right py-3 px-3">{renderSortHead('apy', 'APY')}</th>
                <th className="text-right py-3 px-3">{renderSortHead('tvl', 'TVL')}</th>
                <th className="text-right py-3 px-3 hidden md:table-cell">{renderSortHead('volume24h', '24h Vol')}</th>
                <th className="text-right py-3 px-3 hidden md:table-cell">{renderSortHead('fees24h', '24h Fees')}</th>
                <th className="text-right py-3 pl-3 pr-4"><span className="label-section-light">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(vault => (
                <tr key={vault.address} className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] transition-colors">
                  <td className="py-4 pr-4 pl-4">
                    <div className="flex items-center gap-3">
                      <TokenPairIcons tokenA={vault.tokenA} tokenB={vault.tokenB} />
                      <div>
                        <p className="text-sm font-medium text-[#11274d]">{vault.name}</p>
                        <p className="text-xs text-[#6B7280]">{vault.strategy.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}{vault.curator ? ` · ${vault.curator}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-3">
                    <span className="data-md text-[#059669] flex items-center justify-end gap-1">
                      <TrendingUp size={12} />{formatPercent(vault.apy)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-3"><span className="data-md text-[#11274d]">{formatCompact(vault.tvl)}</span></td>
                  <td className="text-right py-4 px-3 hidden md:table-cell"><span className="data-sm text-[#6B7280]">{formatCompact(vault.volume24h)}</span></td>
                  <td className="text-right py-4 px-3 hidden md:table-cell"><span className="data-sm text-[#6B7280]">{formatCompact(vault.fees24h)}</span></td>
                  <td className="text-right py-4 pl-3 pr-4">
                    <Button variant="execute" size="sm">Deposit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-12 text-center text-[#6B7280] text-sm">No vaults found.</p>}
        </div>
      </div>
    </div>
  );
}
