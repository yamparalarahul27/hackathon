'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import type { DexTrade } from '@/lib/dex-types';

interface DexBehaviorSectionProps {
  trades: DexTrade[];
}

export const DexBehaviorSection = React.memo(function DexBehaviorSection({ trades }: DexBehaviorSectionProps) {
  const stats = useMemo(() => {
    const limitOrders = trades.filter(t => t.orderType === 'limit' || t.orderType === 'stop_limit');
    const marketOrders = trades.filter(t => t.orderType === 'market' || t.orderType === 'stop_market');
    const longs = trades.filter(t => t.side === 'long' || t.side === 'buy');
    const shorts = trades.filter(t => t.side === 'short' || t.side === 'sell');

    const total = trades.length || 1; // avoid division by zero
    return {
      limitPct: ((limitOrders.length / total) * 100).toFixed(1),
      marketPct: ((marketOrders.length / total) * 100).toFixed(1),
      longPct: ((longs.length / total) * 100).toFixed(1),
      shortPct: ((shorts.length / total) * 100).toFixed(1),
    };
  }, [trades]);

  const noData = trades.length === 0;

  return (
    <div className="space-y-4">
      <h3 className="label-section-light">Trading Behavior & Risk</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Order Type Ratio */}
        <Card className="p-4">
          <p className="label-section-light mb-3">Order Type Ratio</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-ibm-plex-sans text-[#11274d]">Limit</span>
              <span className="data-md text-[#11274d]">{noData ? '0' : stats.limitPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div className="h-full bg-[#3B7DDD] rounded-full transition-all" style={{ width: noData ? '0%' : `${stats.limitPct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-ibm-plex-sans text-[#11274d]">Market</span>
              <span className="data-md text-[#11274d]">{noData ? '0' : stats.marketPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div className="h-full bg-[#6a7282] rounded-full transition-all" style={{ width: noData ? '0%' : `${stats.marketPct}%` }} />
            </div>
          </div>
        </Card>

        {/* Long/Short Ratio */}
        <Card className="p-4">
          <p className="label-section-light mb-3">Long / Short Ratio</p>
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="data-lg text-[#059669]">{noData ? '0' : stats.longPct}%</span>
                <span className="text-xs text-[#6a7282] font-ibm-plex-sans">Long</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="data-lg text-[#EF4444]">{noData ? '0' : stats.shortPct}%</span>
                <span className="text-xs text-[#6a7282] font-ibm-plex-sans">Short</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});
