'use client';

import { useState } from 'react';
import { Card, CardFooter } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { TokenIcon } from '@/components/ui/TokenIcon';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';
import { KaminoVaultPosition, LPPortfolioSummary } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';

function PositionCard({ position, index, onClick }: { position: KaminoVaultPosition; index: number; onClick?: () => void }) {
  return (
    <Card hover onClick={onClick} className="animate-fade-up" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}>
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-3 border-b-thin">
        <div className="flex items-center gap-2">
          <TokenIcon mint={position.token.mint} symbol={position.token.symbol} size="md" />
          <div>
            <span className="font-ibm-plex-sans text-sm font-medium tracking-tight text-[#11274d] block">
              {position.vaultName}
            </span>
            <span className="font-ibm-plex-sans text-[10px] text-[#6a7282] uppercase">{position.token.symbol}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-ibm-plex-sans text-[10px] font-medium uppercase text-[#111113]/50">APY</span>
          <span className="data-lg text-[#0fa87a]">
            {position.apy > 0 ? formatPercent(position.apy) : '—'}
          </span>
        </div>
      </div>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-ibm-plex-sans text-xs font-medium text-[#6a7282]">Value</span>
          <span className="w-1 h-1 rounded-full bg-[#6a7282]" />
          <span className="font-ibm-plex-sans text-xs font-medium text-[#212121]">{formatUsd(position.currentValueUsd)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-ibm-plex-sans text-xs font-medium text-[#6a7282]">Shares</span>
          <span className="w-1 h-1 rounded-full bg-[#6a7282]" />
          <span className="font-ibm-plex-sans text-xs font-medium text-[#212121]">{position.sharesOwned.toFixed(2)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

interface VaultDashboardProps {
  positions?: KaminoVaultPosition[];
  summary?: LPPortfolioSummary;
  error?: string | null;
  onVaultSelect?: (vaultAddress: string) => void;
}

const EMPTY_SUMMARY: LPPortfolioSummary = {
  totalPositions: 0,
  totalCurrentValueUsd: 0,
  weightedAvgApy: 0,
  bestPerformingVault: null,
  worstPerformingVault: null,
};

export function VaultDashboard({ positions = [], summary = EMPTY_SUMMARY, error, onVaultSelect }: VaultDashboardProps) {
  const [filter, setFilter] = useState('all');

  const tokens = ['all', ...Array.from(new Set(positions.map(p => p.token.symbol))).sort()];
  const filtered = filter === 'all' ? positions : positions.filter(p => p.token.symbol === filter);

  return (
    <>
      {/* Hero stats on dark */}
      <div className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-6 border-b border-white/20" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', paddingLeft: 'calc(50vw - 50%)', paddingRight: 'calc(50vw - 50%)' }}>
        <div>
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-2">Your Vault Portfolio</h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70 mb-6">Track your positions across Kamino K-Vaults — real on-chain data.</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Portfolio Value', value: formatUsd(summary.totalCurrentValueUsd), color: 'text-white' },
              { label: 'Positions', value: summary.totalPositions.toString(), color: 'text-white' },
              { label: 'Avg APY', value: summary.weightedAvgApy > 0 ? formatPercent(summary.weightedAvgApy) : '—', color: 'text-[#7ee5c6]' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="label-section mb-1">{stat.label}</p>
                <p className={`data-lg ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <RpcErrorBanner message={error} />
        </div>
      )}

      <div>
        <div className="flex flex-col gap-2 mb-4">
          <h2 className="label-section-light">Your Positions</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {tokens.map(s => (
              <Pill key={s} active={filter === s} onClick={() => setFilter(s)}>
                {s === 'all' ? 'All' : s}
              </Pill>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p, i) => <PositionCard key={p.id} position={p} index={i} onClick={() => onVaultSelect?.(p.vaultAddress)} />)}
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-[#6a7282] font-ibm-plex-sans text-sm">No positions found.</div>}
      </div>
    </>
  );
}
