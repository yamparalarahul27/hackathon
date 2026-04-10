'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { StatusDot } from '@/components/ui/StatusDot';
import { MOCK_KAMINO_POSITIONS, MOCK_PORTFOLIO_SUMMARY } from '@/lib/mockKaminoData';
import { KaminoVaultPosition } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <Card>
      <p className="label-section mb-2">{label}</p>
      <p className={`data-lg ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#6B7280] mt-1">{sub}</p>}
    </Card>
  );
}

function PositionRow({ position, onClick }: { position: KaminoVaultPosition; onClick: () => void }) {
  const pnl = position.currentValueUsd - position.depositValueUsd;
  const pnlPct = position.depositValueUsd > 0 ? (pnl / position.depositValueUsd) * 100 : 0;
  const positive = pnl >= 0;

  return (
    <Card hover onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Token pair icons */}
          <div className="flex -space-x-1">
            <div className="w-7 h-7 rounded-full bg-[#3B7DDD]/20 border border-white/12 flex items-center justify-center text-[10px] font-medium text-[#3B7DDD]">
              {position.tokenA.symbol.slice(0, 2)}
            </div>
            <div className="w-7 h-7 rounded-full bg-[#10B981]/20 border border-white/12 flex items-center justify-center text-[10px] font-medium text-[#10B981]">
              {position.tokenB.symbol.slice(0, 2)}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {position.tokenA.symbol}/{position.tokenB.symbol}
            </p>
            <p className="text-xs text-[#6B7280]">{position.vaultName}</p>
          </div>
        </div>
        <StatusDot variant={positive ? 'success' : 'danger'} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] text-[#6B7280] mb-0.5">Value</p>
          <p className="data-md text-white">{formatUsd(position.currentValueUsd)}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#6B7280] mb-0.5">APY</p>
          <p className="data-md text-[#10B981]">{formatPercent(position.apy)}</p>
        </div>
        <div>
          <p className="text-[11px] text-[#6B7280] mb-0.5">P&L</p>
          <p className={`data-md flex items-center gap-1 ${positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {positive ? '+' : ''}{formatPercent(pnlPct)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
        <span className="text-[11px] text-[#6B7280]">
          Yield: <span className="text-[#10B981]">+{formatUsd(position.yieldEarnedUsd)}</span>
        </span>
        <span className="text-[11px] text-[#6B7280]">
          IL: <span className="text-[#F59E0B]">{position.impermanentLoss.toFixed(2)}%</span>
        </span>
      </div>
    </Card>
  );
}

export function VaultDashboard() {
  const positions = MOCK_KAMINO_POSITIONS;
  const summary = MOCK_PORTFOLIO_SUMMARY;
  const [filter, setFilter] = useState('all');

  const strategies = ['all', ...new Set(positions.map(p => p.strategy))];
  const filtered = filter === 'all' ? positions : positions.filter(p => p.strategy === filter);

  const totalPnl = summary.totalCurrentValueUsd - summary.totalDepositedUsd;

  return (
    <div className="space-y-6">
      {/* Demo banner */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg">
        <StatusDot variant="warning" pulse={false} />
        <span className="text-xs font-medium text-[#F59E0B]">Demo Mode — Showing sample vault data. Connect wallet for real positions.</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Portfolio Value" value={formatUsd(summary.totalCurrentValueUsd)} sub={`${summary.totalPositions} positions`} color="text-white" />
        <StatCard label="Total Yield" value={`+${formatUsd(summary.totalYieldEarnedUsd)}`} sub={`Avg ${formatPercent(summary.weightedAvgApy)} APY`} color="text-[#10B981]" />
        <StatCard label="Net P&L" value={`${totalPnl >= 0 ? '+' : ''}${formatUsd(totalPnl)}`} sub={`IL: ${formatUsd(summary.totalImpermanentLossUsd)}`} color={totalPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'} />
        <StatCard label="Avg APY" value={formatPercent(summary.weightedAvgApy)} sub={summary.bestPerformingVault ? `Best: ${summary.bestPerformingVault}` : undefined} color="text-[#3B7DDD]" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {strategies.map(s => (
          <Pill key={s} active={filter === s} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.replace('-', ' ')}
          </Pill>
        ))}
      </div>

      {/* Positions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <PositionRow key={p.id} position={p} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
}
