'use client';

import { useEffect, useState } from 'react';
import { Flame, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { fetchTrendingTokens, type TrendingToken } from '@/services/BirdeyeService';
import { getTokenIcon } from '@/lib/tokenIcons';

interface Props {
  limit?: number;
}

export function BirdeyeTrending({ limit = 12 }: Props) {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTrendingTokens(limit);
        if (!cancelled) setTokens(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load trending');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  // Hide the section entirely if the proxy is unavailable or returned no data.
  if (!loading && (error || tokens.length === 0)) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Flame size={14} className="text-[#f59e0b]" />
        <h2 className="label-section-light">Trending on Solana</h2>
        <span className="text-[9px] text-[#94a3b8] font-ibm-plex-sans">via Birdeye</span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[#94a3b8] py-4">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs font-ibm-plex-sans">Loading trending…</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-[#991b1b] font-ibm-plex-sans py-2">{error}</p>
      )}

      {!loading && !error && tokens.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {tokens.map((t) => (
            <TrendingCard key={t.address} token={t} />
          ))}
        </div>
      )}
    </section>
  );
}

function TrendingCard({ token }: { token: TrendingToken }) {
  const [imgErr, setImgErr] = useState(false);
  const icon = token.logoURI ?? getTokenIcon(token.address, token.symbol);
  const positive = token.priceChange24hPercent >= 0;

  return (
    <Link href={`/cockpit/token/${token.address}`}>
      <Card hover className="flex-shrink-0 w-[140px] p-3">
        <div className="flex items-center gap-2 mb-2">
          {!imgErr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon}
              alt=""
              width={20}
              height={20}
              loading="lazy"
              onError={() => setImgErr(true)}
              className="rounded-full bg-[#f1f5f9]"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#f1f5f9]" />
          )}
          <span className="text-xs font-semibold text-[#11274d] font-ibm-plex-sans truncate">
            {token.symbol || token.name}
          </span>
        </div>
        <p className="data-sm text-[#11274d] mb-0.5">
          ${formatPrice(token.price)}
        </p>
        <div className={`flex items-center gap-0.5 text-[10px] font-ibm-plex-sans font-medium ${positive ? 'text-[#059669]' : 'text-[#ef4444]'}`}>
          <TrendingUp size={10} className={!positive ? 'rotate-180' : ''} />
          {positive ? '+' : ''}{token.priceChange24hPercent.toFixed(2)}%
        </div>
      </Card>
    </Link>
  );
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toExponential(2);
}
