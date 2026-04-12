'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import type { DexTrade } from '@/lib/dex-types';

interface DexPerformanceSectionProps {
  trades: DexTrade[];
}

export const DexPerformanceSection = React.memo(function DexPerformanceSection({ trades }: DexPerformanceSectionProps) {
  const stats = useMemo(() => {
    const wins = trades.filter(t => t.isWin);
    const losses = trades.filter(t => !t.isWin);
    const winRate = trades.length > 0 ? ((wins.length / trades.length) * 100).toFixed(1) : '0';

    const avgDuration = trades.length > 0
      ? Math.round(trades.reduce((sum, t) => sum + t.durationSeconds, 0) / trades.length)
      : 0;

    const bestTrade = wins.length > 0
      ? wins.reduce((best, t) => t.pnl > best.pnl ? t : best, wins[0])
      : null;

    const worstTrade = losses.length > 0
      ? losses.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, losses[0])
      : null;

    return { winRate, wins: wins.length, losses: losses.length, avgDuration, bestTrade, worstTrade };
  }, [trades]);

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="label-section-light">Performance & Time In Market</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Win Rate */}
        <Card className="p-4">
          <p className="label-section-light mb-2">Win Rate</p>
          <p className="data-lg text-[#11274d]">{stats.winRate}%</p>
          <p className="text-xs text-[#6a7282] font-ibm-plex-sans mt-1">{stats.wins}W / {stats.losses}L</p>
        </Card>

        {/* Avg Duration */}
        <Card className="p-4">
          <p className="label-section-light mb-2">Avg Duration</p>
          <p className="data-lg text-[#11274d]">{formatDuration(stats.avgDuration)}</p>
          <p className="text-xs text-[#6a7282] font-ibm-plex-sans mt-1">avg hold time</p>
        </Card>

        {/* Largest Trades */}
        <Card className="p-4">
          <p className="label-section-light mb-2">Largest Trades</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="data-md text-[#059669]">{stats.bestTrade ? formatPnl(stats.bestTrade.pnl) : '$0.00'}</p>
              <p className="text-[10px] text-[#6a7282] font-ibm-plex-sans mt-0.5">
                {stats.bestTrade ? `${stats.bestTrade.symbol} ${stats.bestTrade.side.toUpperCase()}` : '--'}
              </p>
            </div>
            <div>
              <p className="data-md text-[#EF4444]">{stats.worstTrade ? formatPnl(stats.worstTrade.pnl) : '$0.00'}</p>
              <p className="text-[10px] text-[#6a7282] font-ibm-plex-sans mt-0.5">
                {stats.worstTrade ? `${stats.worstTrade.symbol} ${stats.worstTrade.side.toUpperCase()}` : '--'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Time-Based Performance */}
      <Card className="p-4">
        <p className="label-section-light mb-3">Time-Based Performance</p>
        <div className="h-48 sm:h-64 flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
          {trades.length === 0 ? 'No trades in selected period' : 'Session/hourly chart renders here with trade data'}
        </div>
      </Card>
    </div>
  );
});
