'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { fetchCoinGeckoChart, type TokenChartPoint } from '@/services/TokenDataService';

interface TokenChartProps {
  mint: string;
  currentPrice: number;
  color?: string;
}

const TIME_WINDOWS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export const TokenChart = React.memo(function TokenChart({ mint, currentPrice, color = '#3B7DDD' }: TokenChartProps) {
  const [activeDays, setActiveDays] = useState(7);
  const [chartData, setChartData] = useState<TokenChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [LivelineComponent, setLivelineComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  // Dynamic import Liveline (canvas component, must be client-only)
  useEffect(() => {
    import('liveline').then(mod => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLivelineComponent(() => mod.Liveline as any);
    }).catch(() => {
      setLivelineComponent(null);
    });
  }, []);

  const fetchChart = useCallback(async (days: number) => {
    setLoading(true);
    const data = await fetchCoinGeckoChart(mint, days);
    setChartData(data);
    setLoading(false);
  }, [mint]);

  useEffect(() => {
    fetchChart(activeDays);
  }, [activeDays, fetchChart]);

  const handleWindowChange = (days: number) => {
    setActiveDays(days);
  };

  // Format value for Liveline badge
  const formatValue = useCallback((v: number) => {
    return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  return (
    <Card className="p-4 space-y-3">
      {/* Chart Area */}
      <div className="h-48 sm:h-64 lg:h-80">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
            Loading chart...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
            No chart data available
          </div>
        ) : LivelineComponent ? (
          <LivelineComponent
            data={chartData}
            value={currentPrice}
            color={color}
            theme="light"
            grid
            badge
            fill
            scrub
            pulse={false}
            formatValue={formatValue}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
            Chart component loading...
          </div>
        )}
      </div>

      {/* Time Window Pills */}
      <div className="flex gap-2">
        {TIME_WINDOWS.map(w => (
          <Pill key={w.days} active={activeDays === w.days} onClick={() => handleWindowChange(w.days)}>
            {w.label}
          </Pill>
        ))}
      </div>
    </Card>
  );
});
