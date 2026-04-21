'use client';

import { useEffect, useRef, useState } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StateNotice } from '@/components/ui/StateNotice';
import { fetchTrendingTokens, type TrendingToken } from '@/services/BirdeyeService';
import { getTokenIcon } from '@/lib/tokenIcons';

interface Props {
  limit?: number;
  refreshToken?: number;
  onSuccessfulFetch?: (at: Date) => void;
}

export function BirdeyeTrending({ limit = 12, refreshToken = 0, onSuccessfulFetch }: Props) {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showStale, setShowStale] = useState(false);
  const [manualRefreshToken, setManualRefreshToken] = useState(0);
  const hasTokensRef = useRef(false);

  useEffect(() => {
    hasTokensRef.current = tokens.length > 0;
  }, [tokens.length]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchTrendingTokens(limit);
        if (!cancelled) {
          setTokens(data);
          setError(null);
          const at = new Date();
          setLastUpdated(at);
          setShowStale(false);
          onSuccessfulFetch?.(at);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load trending');
          setShowStale(hasTokensRef.current);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [limit, manualRefreshToken, onSuccessfulFetch, refreshToken]);

  function handleRefresh() {
    if (!hasTokensRef.current) setLoading(true);
    setManualRefreshToken((value) => value + 1);
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Flame size={14} className="text-[#f59e0b]" />
        <h2 className="label-section-light">Trending on Solana</h2>
        <span className="text-[9px] text-[#94a3b8] font-ibm-plex-sans">via Birdeye</span>
      </div>

      {loading && (
        <div className="py-1">
          <StateNotice severity="info" message="Loading trending tokens..." />
        </div>
      )}

      {!loading && showStale && tokens.length > 0 && (
        <div className="mb-3">
          <StateNotice
            severity="warning"
            message="Showing cached trending tokens while live data refreshes."
            actionLabel="Refresh"
            onAction={handleRefresh}
            lastUpdated={lastUpdated}
            showStaleBadge
          />
        </div>
      )}

      {!loading && !showStale && error && (
        <div className="py-1">
          <StateNotice
            severity={isRateLimited(error) ? 'warning' : 'error'}
            message={
              isRateLimited(error)
                ? 'Rate limit reached (429). Please wait a moment and try again.'
                : 'Trending data is temporarily unavailable. Please try again.'
            }
            actionLabel="Retry"
            onAction={handleRefresh}
          />
        </div>
      )}

      {!loading && !error && tokens.length === 0 && (
        <div className="py-1">
          <StateNotice
            severity="info"
            message="No trending tokens right now."
            actionLabel="Refresh"
            onAction={handleRefresh}
            lastUpdated={lastUpdated}
          />
        </div>
      )}

      {!loading && tokens.length > 0 && (
        <>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {tokens.map((t) => (
              <TrendingCard key={t.address} token={t} />
            ))}
          </div>
          <div className="pt-2">
            <a href="#market-table" className="text-xs font-ibm-plex-sans text-[#19549b] hover:text-[#143f78]">
              View all in table
            </a>
          </div>
        </>
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

function isRateLimited(rawError: string): boolean {
  return /\b429\b/.test(rawError);
}
