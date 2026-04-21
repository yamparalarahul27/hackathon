'use client';

import React from 'react';
import { TokenIcon } from '@/components/ui/TokenIcon';
import type { TokenMetadata, TokenMarketData } from '@/services/TokenDataService';

interface TokenHeaderProps {
  metadata: TokenMetadata;
  marketData: TokenMarketData | null;
  loading?: boolean;
}

export const TokenHeader = React.memo(function TokenHeader({ metadata, marketData, loading }: TokenHeaderProps) {
  const price = marketData?.price ?? 0;
  const change = marketData?.change24h ?? 0;
  const isPositive = change >= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <TokenIcon mint={metadata.mint} symbol={metadata.symbol} size="lg" />
        <div>
          <h1 className="font-satoshi font-bold text-xl text-[#11274d]">{metadata.name}</h1>
          <span className="text-sm text-[#6a7282] font-ibm-plex-sans">{metadata.symbol}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="data-lg text-[#11274d]">
          {loading ? '...' : `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </span>
        <span className={`text-sm font-ibm-plex-sans font-medium ${isPositive ? 'text-[#059669]' : 'text-[#EF4444]'}`}>
          {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{change.toFixed(2)}% (24h)
        </span>
      </div>
    </div>
  );
});
