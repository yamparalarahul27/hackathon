'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import {
  fetchNewListings,
  fetchTokenSecurity,
  scoreTokenSecurity,
  type NewListingToken,
  type SecurityLevel,
} from '@/services/BirdeyeService';
import { getTokenIcon } from '@/lib/tokenIcons';

interface ListingWithSafety extends NewListingToken {
  safetyLevel: SecurityLevel | null;
  safetyScore: number | null;
}

interface Props {
  refreshToken?: number;
  onSuccessfulFetch?: (at: Date) => void;
}

export function BirdeyeNewListings({ refreshToken = 0, onSuccessfulFetch }: Props) {
  const [tokens, setTokens] = useState<ListingWithSafety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const listings = await fetchNewListings(20, '24h');
        if (cancelled) return;
        onSuccessfulFetch?.(new Date());

        const withSafety: ListingWithSafety[] = listings.map((t) => ({
          ...t,
          safetyLevel: null,
          safetyScore: null,
        }));
        setTokens(withSafety);
        setError(null);
        setLoading(false);

        // Enrich with safety scores (best-effort, non-blocking)
        const enriched = [...withSafety];
        const batch = enriched.slice(0, 6).map((token, index) => ({ token, index }));
        for (let i = 0; i < batch.length; i += 3) {
          if (cancelled) return;
          const chunk = batch.slice(i, i + 3);
          const settled = await Promise.allSettled(
            chunk.map(async ({ token, index }) => {
              const sec = await fetchTokenSecurity(token.address);
              const score = scoreTokenSecurity(sec);
              return { index, score };
            })
          );
          for (const result of settled) {
            if (result.status === 'fulfilled') {
              const { index, score } = result.value;
              enriched[index] = { ...enriched[index], safetyLevel: score.level, safetyScore: score.score };
            }
          }
        }
        if (!cancelled) setTokens([...enriched]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load new listings');
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onSuccessfulFetch, refreshToken]);

  if (!loading && !error && tokens.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-[#8b5cf6]" />
        <h2 className="label-section-light">New Listings (24h)</h2>
        <span className="text-[9px] text-[#94a3b8] font-ibm-plex-sans">via Birdeye · last 24h</span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[#94a3b8] py-4">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs font-ibm-plex-sans">Scanning new listings…</span>
        </div>
      )}

      {error && !loading && (
        <Card className="px-3 py-2.5 bg-[#fff7ed] border border-[#fed7aa]">
          <p className="text-xs text-[#9a3412] font-ibm-plex-sans">
            {toNewListingsFallbackMessage(error)}
          </p>
        </Card>
      )}

      {!loading && !error && tokens.length === 0 && (
        <p className="text-xs text-[#94a3b8] font-ibm-plex-sans py-2">No new listings found.</p>
      )}

      {!loading && tokens.length > 0 && (
        <>
          <Card className="overflow-hidden p-0">
            <div className="divide-y divide-[#e2e8f0]">
              {tokens.slice(0, 10).map((t) => (
                <NewListingRow key={t.address} token={t} />
              ))}
            </div>
          </Card>
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

function NewListingRow({ token }: { token: ListingWithSafety }) {
  const [imgErr, setImgErr] = useState(false);
  const icon = token.logoURI ?? getTokenIcon(token.address, token.symbol);
  const positive = token.priceChange24hPercent >= 0;
  const age = token.openTimestamp ? timeSince(token.openTimestamp) : null;

  return (
    <Link
      href={`/cockpit/token/${token.address}`}
      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#f8fafc] transition-colors"
    >
      {!imgErr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          onError={() => setImgErr(true)}
          className="rounded-full flex-shrink-0 bg-[#f1f5f9]"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-[#f1f5f9] flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[#11274d] font-ibm-plex-sans truncate">
            {token.symbol || short(token.address)}
          </span>
          <SafetyBadge level={token.safetyLevel} />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#94a3b8] font-ibm-plex-sans">
          {token.name && <span className="truncate">{token.name}</span>}
          {age && <span>· {age}</span>}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="data-sm text-[#11274d]">${formatPrice(token.price)}</p>
        <p className={`text-[10px] font-ibm-plex-sans font-medium ${positive ? 'text-[#059669]' : 'text-[#ef4444]'}`}>
          {positive ? '+' : ''}{token.priceChange24hPercent.toFixed(1)}%
        </p>
      </div>

      {token.liquidity > 0 && (
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans">Liquidity</p>
          <p className="text-xs text-[#6a7282] font-ibm-plex-sans">${formatCompact(token.liquidity)}</p>
        </div>
      )}

      <ExternalLink size={12} className="text-[#cbd5e1] flex-shrink-0" />
    </Link>
  );
}

function SafetyBadge({ level }: { level: SecurityLevel | null }) {
  if (!level) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[8px] uppercase tracking-wider font-ibm-plex-sans border bg-[#f8fafc] text-[#64748b] border-[#dbe3ef]">
        N/A
      </span>
    );
  }

  const config = {
    safe: 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]',
    caution: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]',
    danger: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  }[level];

  const label = level === 'danger' ? 'RISK' : level === 'safe' ? 'SAFE' : 'CAUTION';

  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded-sm text-[8px] uppercase tracking-wider font-ibm-plex-sans border ${config}`}>
      {label}
    </span>
  );
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toExponential(2);
}

function formatCompact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}

function timeSince(ts: number): string {
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function short(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function toNewListingsFallbackMessage(rawError: string): string {
  if (/\b429\b/.test(rawError)) {
    return 'New listings are temporarily rate-limited. Please retry in about a minute.';
  }
  if (/\b403\b/.test(rawError)) {
    return 'New listings are temporarily unavailable due to provider access limits.';
  }
  if (/timeout|aborted|network/i.test(rawError)) {
    return 'New listings request timed out. Please refresh and try again.';
  }
  return 'New listings are temporarily unavailable. Please try again shortly.';
}
