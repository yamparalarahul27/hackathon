'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChevronDown } from 'lucide-react';
import type { DexTrade, FilterType } from '@/lib/dex-types';

interface DexPnLCardProps {
  trades: DexTrade[];
  activeFilter: FilterType;
}

export const DexPnLCard = React.memo(function DexPnLCard({ trades, activeFilter }: DexPnLCardProps) {
  const [chartVisible, setChartVisible] = useState(false);

  const totalPnl = useMemo(() => trades.reduce((sum, t) => sum + t.pnl, 0), [trades]);
  const isPositive = totalPnl >= 0;

  const pnlFormatted = `${isPositive ? '+' : '-'}$${Math.abs(totalPnl).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-ibm-plex-sans font-semibold text-sm text-[#11274d]">PnL Analysis</h3>
          <p className="text-[10px] text-[#6a7282] uppercase tracking-wider">Net Profit & Loss</p>
        </div>

        {/* Main Metric */}
        <div className="text-center py-4 sm:py-6">
          <p className="text-[10px] text-[#6a7282] uppercase tracking-widest mb-2">Total PnL ({activeFilter})</p>
          <p className={`data-lg ${isPositive ? 'text-[#059669]' : 'text-[#EF4444]'}`}>
            {pnlFormatted}
          </p>
        </div>

        {/* Chart Toggle */}
        <button
          onClick={() => setChartVisible(!chartVisible)}
          className="w-full flex items-center justify-between pt-3 border-t border-[#e2e8f0]"
        >
          <span className="label-section-light">Visualise PnL</span>
          <ChevronDown
            size={14}
            className={`text-[#6a7282] transition-transform duration-300 ${chartVisible ? 'rotate-180' : ''}`}
          />
        </button>

        {chartVisible && (
          <div className="h-48 sm:h-64 flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
            {trades.length === 0 ? 'No trade data to visualise' : 'Chart renders here with trade data'}
          </div>
        )}
      </div>
    </Card>
  );
});
