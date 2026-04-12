'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import type { DexTrade } from '@/lib/dex-types';

interface DexFinancesSectionProps {
  trades: DexTrade[];
}

export const DexFinancesSection = React.memo(function DexFinancesSection({ trades }: DexFinancesSectionProps) {
  const stats = useMemo(() => {
    const volume = trades.reduce((sum, t) => sum + t.notional, 0);
    const wins = trades.filter(t => t.isWin);
    const losses = trades.filter(t => !t.isWin);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length : 0;
    const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);
    const makerFees = trades.filter(t => t.isMaker).reduce((sum, t) => sum + t.fee, 0);
    const takerFees = totalFees - makerFees;
    const makerPct = totalFees > 0 ? ((makerFees / totalFees) * 100).toFixed(0) : '0';
    const takerPct = totalFees > 0 ? ((takerFees / totalFees) * 100).toFixed(0) : '0';

    return { volume, avgWin, avgLoss, totalFees, makerFees, takerFees, makerPct, takerPct };
  }, [trades]);

  const formatUsd = (value: number) => `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatCompact = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return formatUsd(value);
  };

  return (
    <div className="space-y-4">
      <h3 className="label-section-light">Finances</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Volume */}
        <Card className="p-4">
          <p className="label-section-light mb-2">Trading Volume</p>
          <p className="data-lg text-[#11274d]">{formatCompact(stats.volume)}</p>
        </Card>

        {/* Avg Win */}
        <Card className="p-4">
          <p className="label-section-light mb-2">Avg Win</p>
          <p className="data-lg text-[#059669]">+{formatUsd(stats.avgWin)}</p>
        </Card>

        {/* Avg Loss */}
        <Card className="p-4">
          <p className="label-section-light mb-2">Avg Loss</p>
          <p className="data-lg text-[#EF4444]">
            {stats.avgLoss === 0 ? '$0.00' : `-${formatUsd(stats.avgLoss)}`}
          </p>
        </Card>

        {/* Fee Distribution */}
        <Card className="p-4">
          <p className="label-section-light mb-2">Fees</p>
          {stats.totalFees === 0 ? (
            <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">No fee data</p>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-ibm-plex-sans">
                <span className="text-[#6a7282]">Maker {stats.makerPct}%</span>
                <span className="text-[#11274d]">{formatUsd(stats.makerFees)}</span>
              </div>
              <div className="flex justify-between text-xs font-ibm-plex-sans">
                <span className="text-[#6a7282]">Taker {stats.takerPct}%</span>
                <span className="text-[#11274d]">{formatUsd(stats.takerFees)}</span>
              </div>
              <div className="flex justify-between text-xs font-ibm-plex-sans font-semibold pt-1 border-t border-[#e2e8f0]">
                <span className="text-[#11274d]">Total</span>
                <span className="text-[#11274d]">{formatUsd(stats.totalFees)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
});
