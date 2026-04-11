'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardFooter } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { StatusDot } from '@/components/ui/StatusDot';
import { TokenPairIcons } from '@/components/ui/TokenIcon';
import { MOCK_KAMINO_POSITIONS, MOCK_PORTFOLIO_SUMMARY } from '@/lib/mockKaminoData';
import { KaminoVaultPosition } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';

function PositionCard({ position, index, onClick }: { position: KaminoVaultPosition; index: number; onClick?: () => void }) {
  const pnl = position.currentValueUsd - position.depositValueUsd;
  const pnlPct = position.depositValueUsd > 0 ? (pnl / position.depositValueUsd) * 100 : 0;
  const positive = pnl >= 0;

  return (
    <Card hover onClick={onClick} className="animate-fade-up" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}>
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-3 border-b-thin">
        <div className="flex items-center gap-2">
          <TokenPairIcons tokenA={position.tokenA} tokenB={position.tokenB} />
          <span className="font-ibm-plex-sans text-lg font-medium tracking-tight text-[#11274d]">
            {position.tokenA.symbol}/{position.tokenB.symbol}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-ibm-plex-sans text-[10px] font-medium uppercase text-[#111113]/50">APY</span>
          <span className="data-lg text-[#0fa87a]">{formatPercent(position.apy)}</span>
        </div>
      </div>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-ibm-plex-sans text-xs font-medium text-[#6a7282]">Value</span>
          <span className="w-1 h-1 rounded-full bg-[#6a7282]" />
          <span className="font-ibm-plex-sans text-xs font-medium text-[#212121]">{formatUsd(position.currentValueUsd)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-ibm-plex-sans text-xs font-medium text-[#6a7282]">P&L</span>
          <span className="w-1 h-1 rounded-full bg-[#6a7282]" />
          <span className={`font-ibm-plex-sans text-xs font-medium flex items-center gap-0.5 ${positive ? 'text-[#0fa87a]' : 'text-[#ef4444]'}`}>
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {positive ? '+' : ''}{formatPercent(pnlPct)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

interface VaultDashboardProps {
  onVaultSelect?: (vaultAddress: string) => void;
}

export function VaultDashboard({ onVaultSelect }: VaultDashboardProps) {
  const positions = MOCK_KAMINO_POSITIONS;
  const summary = MOCK_PORTFOLIO_SUMMARY;
  const [filter, setFilter] = useState('all');

  const strategies = ['all', ...new Set(positions.map(p => p.strategy))];
  const filtered = filter === 'all' ? positions : positions.filter(p => p.strategy === filter);
  const totalPnl = summary.totalCurrentValueUsd - summary.totalDepositedUsd;

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-12 min-h-screen">
      {/* Hero stats on dark — full viewport width */}
      <div className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-6 border-b border-white/20" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', paddingLeft: 'calc(50vw - 50%)', paddingRight: 'calc(50vw - 50%)' }}>
        <div className="max-w-[1400px] mx-auto">
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-2">Your Vault Portfolio</h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70 mb-6">Track yield, impermanent loss, and performance across Kamino vaults.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Portfolio Value', value: formatUsd(summary.totalCurrentValueUsd), color: 'text-white' },
              { label: 'Total Yield', value: `+${formatUsd(summary.totalYieldEarnedUsd)}`, color: 'text-[#7ee5c6]' },
              { label: 'Net P&L', value: `${totalPnl >= 0 ? '+' : ''}${formatUsd(totalPnl)}`, color: totalPnl >= 0 ? 'text-[#7ee5c6]' : 'text-[#ef4444]' },
              { label: 'Avg APY', value: formatPercent(summary.weightedAvgApy), color: 'text-[#7ee5c6]' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="label-section mb-1">{stat.label}</p>
                <p className={`data-lg ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content — LIGHT bg */}
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col gap-2 mb-4">
          <h2 className="label-section-light">Your Positions</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {strategies.map(s => (
              <Pill key={s} active={filter === s} onClick={() => setFilter(s)}>
                {s === 'all' ? 'All' : s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Pill>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => <PositionCard key={p.id} position={p} index={i} onClick={() => onVaultSelect?.(p.vaultAddress)} />)}
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-[#6a7282] font-ibm-plex-sans text-sm">No positions found.</div>}
      </div>
    </div>
  );
}
