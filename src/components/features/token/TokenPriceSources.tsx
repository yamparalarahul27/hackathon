'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import type { TokenPriceSource } from '@/services/TokenDataService';

interface TokenPriceSourcesProps {
  sources: TokenPriceSource[];
  loading?: boolean;
}

export const TokenPriceSources = React.memo(function TokenPriceSources({ sources, loading }: TokenPriceSourcesProps) {
  const prices = sources.map(s => s.price);
  const spread = prices.length >= 2 ? Math.max(...prices) - Math.min(...prices) : 0;
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const spreadPct = avgPrice > 0 ? (spread / avgPrice) * 100 : 0;

  return (
    <Card className="p-4">
      <p className="label-section-light mb-3">Price Oracle Comparison</p>

      {loading || sources.length === 0 ? (
        <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">Loading price sources...</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {sources.map(s => (
              <div key={s.source} className="flex items-center justify-between">
                <span className="text-xs text-[#6a7282] font-ibm-plex-sans">{s.source}</span>
                <span className="data-sm text-[#11274d]">
                  ${s.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between">
            <span className="text-[10px] text-[#94a3b8] font-ibm-plex-sans">
              Spread: ${spread.toFixed(4)} ({spreadPct.toFixed(3)}%)
            </span>
            <span className="text-[10px] text-[#94a3b8] font-ibm-plex-sans">
              {sources.length} sources
            </span>
          </div>
        </div>
      )}
    </Card>
  );
});
