'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { TokenIcon } from '@/components/ui/TokenIcon';
import type { TokenMetadata, TokenMarketData } from '@/services/TokenDataService';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

interface TokenHeaderProps {
  metadata: TokenMetadata;
  marketData: TokenMarketData | null;
  loading?: boolean;
}

export const TokenHeader = React.memo(function TokenHeader({ metadata, marketData, loading }: TokenHeaderProps) {
  const price = marketData?.price ?? 0;
  const change = marketData?.change24h ?? 0;
  const isPositive = change >= 0;

  const { walletAddress } = useWalletConnection();
  const { isWatched, add, remove, error: watchError } = useWatchlist(walletAddress);
  const supabaseReady = isSupabaseConfigured();
  const watched = isWatched(metadata.mint);

  const handleToggleWatch = async () => {
    if (!walletAddress) return;
    try {
      if (watched) await remove(metadata.mint);
      else await add(metadata.mint, metadata.symbol);
    } catch {
      // surfaced via watchError below
    }
  };

  const watchTitle = !supabaseReady
    ? 'Watchlist requires Supabase config'
    : !walletAddress
      ? 'Connect a wallet to use the watchlist'
      : watched ? 'Remove from watchlist' : 'Add to watchlist';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TokenIcon mint={metadata.mint} symbol={metadata.symbol} size="lg" />
          <div>
            <h1 className="font-display font-bold text-xl text-[#11274d]">{metadata.name}</h1>
            <span className="text-sm text-[#6a7282] font-ibm-plex-sans">{metadata.symbol}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleWatch}
          disabled={!walletAddress || !supabaseReady}
          title={watchTitle}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-sm border transition-colors text-xs font-ibm-plex-sans ${
            watched
              ? 'bg-[#fff7e6] border-[#fbbf24] text-[#92400e]'
              : 'bg-white border-[#cbd5e1] text-[#6a7282] hover:text-[#11274d] hover:border-[#94a3b8]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Star size={12} fill={watched ? '#fbbf24' : 'none'} />
          {watched ? 'Watching' : 'Watch'}
        </button>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="data-lg text-[#11274d]">
          {loading ? '...' : `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </span>
        <span className={`text-sm font-ibm-plex-sans font-medium ${isPositive ? 'text-[#059669]' : 'text-[#EF4444]'}`}>
          {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{change.toFixed(2)}% (24h)
        </span>
      </div>

      {watchError && (
        <p className="text-[10px] text-[#ef4444] font-ibm-plex-sans">{watchError}</p>
      )}
    </div>
  );
});
