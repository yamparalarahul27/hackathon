'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { fetchTokenChart, type TokenChartPoint, type FetchChartResult } from '@/services/TokenChartService';

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
  const [chartSource, setChartSource] = useState<FetchChartResult['source'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [LivelineComponent, setLivelineComponent] = useState<any>(null);
  const [livelineError, setLivelineError] = useState(false);

  // Dynamic import Liveline
  useEffect(() => {
    import('liveline')
      .then(mod => {
        setLivelineComponent(() => mod.Liveline);
      })
      .catch((err) => {
        console.error('[TokenChart] Failed to load Liveline:', err);
        setLivelineError(true);
      });
  }, []);

  const fetchChart = useCallback(async (days: number) => {
    setLoading(true);
    setChartError(null);
    try {
      const result = await fetchTokenChart(mint, days);
      setChartData(result.points);
      setChartSource(result.source);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch chart data';
      setChartError(message);
      setChartData([]);
      setChartSource(null);
      console.error('[TokenChart] Chart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [mint]);

  useEffect(() => {
    fetchChart(activeDays);
  }, [activeDays, fetchChart]);

  const formatValue = useCallback((v: number) => {
    return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const Liveline = LivelineComponent;

  return (
    <Card className="p-4 space-y-3">
      {/* Chart Area — explicit width + height for canvas */}
      <div style={{ width: '100%', height: 280 }} className="sm:h-64 lg:h-80 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
            Loading chart...
          </div>
        ) : chartError || chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
            {chartError ?? 'No chart data available'}
          </div>
        ) : livelineError || !Liveline ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
            {livelineError ? 'Chart library failed to load' : 'Loading chart...'}
          </div>
        ) : currentPrice <= 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#94a3b8] font-ibm-plex-sans">
            Loading price...
          </div>
        ) : (
          <Liveline
            data={chartData}
            value={currentPrice}
            color={color}
            theme="light"
            grid={true}
            badge={true}
            fill={true}
            scrub={true}
            pulse={false}
            formatValue={formatValue}
            window={Math.floor(Date.now() / 1000) - chartData[0].time}
          />
        )}
      </div>

      {/* Time Window Pills + Source */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {TIME_WINDOWS.map(w => (
            <Pill key={w.days} active={activeDays === w.days} onClick={() => setActiveDays(w.days)}>
              {w.label}
            </Pill>
          ))}
        </div>
        {chartSource && (
          <span className="text-[10px] text-[#94a3b8] font-ibm-plex-sans uppercase tracking-wide">
            via {chartSource}
          </span>
        )}
      </div>
    </Card>
  );
});
