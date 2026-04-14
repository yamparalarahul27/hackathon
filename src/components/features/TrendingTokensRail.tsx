'use client';

import { useEffect, useState } from 'react';
import { Flame, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { fetchTrendingTokens } from '@/services/DexScreenerService';

interface TrendingToken {
  tokenAddress: string;
  chainId: string;
  amount: number;
  url: string;
  icon?: string;
  name?: string;
  symbol?: string;
}

/**
 * "Trending on Solana" rail — shows top boosted tokens from DexScreener.
 * Horizontal scrollable on mobile, wraps on desktop.
 */
export function TrendingTokensRail() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingTokens()
      .then((items) => {
        // Enrich with DexScreener token page URLs
        setTokens(
          items.slice(0, 12).map((t) => ({
            ...t,
            symbol: t.tokenAddress.slice(0, 6),
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || tokens.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={14} className="text-[#f59e0b]" />
        <h2 className="label-section-light">Trending on Solana</h2>
        <span className="text-[10px] text-[#94a3b8] font-ibm-plex-sans">via DexScreener</span>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tokens.map((t) => (
          <a
            key={t.tokenAddress}
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Card hover className="px-3 py-2 flex items-center gap-2 min-w-[140px]">
              <span className="text-xs font-mono text-[#11274d] truncate max-w-[80px]">
                {t.tokenAddress.slice(0, 4)}…{t.tokenAddress.slice(-4)}
              </span>
              <span className="text-[10px] text-[#f59e0b] font-ibm-plex-sans font-medium">
                🔥 {t.amount}
              </span>
              <ExternalLink size={10} className="text-[#94a3b8] shrink-0" />
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
