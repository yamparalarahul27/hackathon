'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import type { TokenMarketData } from '@/services/TokenDataService';

interface TokenMarketStatsProps {
  data: TokenMarketData | null;
  symbol: string;
}

function formatCompact(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatSupply(value: number, symbol: string): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B ${symbol}`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M ${symbol}`;
  return `${value.toLocaleString()} ${symbol}`;
}

export const TokenMarketStats = React.memo(function TokenMarketStats({ data, symbol }: TokenMarketStatsProps) {
  const stats = [
    { label: 'Market Cap', value: data ? formatCompact(data.marketCap) : '--' },
    { label: '24h Volume', value: data ? formatCompact(data.volume24h) : '--' },
    { label: 'Circulating', value: data ? formatSupply(data.circulatingSupply, symbol) : '--' },
    { label: 'FDV', value: data ? formatCompact(data.fdv) : '--' },
    { label: '24h High', value: data ? `$${data.high24h.toFixed(2)}` : '--' },
    { label: '24h Low', value: data ? `$${data.low24h.toFixed(2)}` : '--' },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
      {stats.map(s => (
        <Card key={s.label} className="p-3 min-w-[120px] flex-shrink-0">
          <p className="label-section-light mb-1">{s.label}</p>
          <p className="data-md text-[#11274d]">{s.value}</p>
        </Card>
      ))}
    </div>
  );
});
