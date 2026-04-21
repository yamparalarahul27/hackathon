'use client';

import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { BirdeyeTrending } from '@/components/features/BirdeyeTrending';
import { BirdeyeNewListings } from '@/components/features/BirdeyeNewListings';
import { MarketTokenList } from '@/components/features/MarketTokenList';

export default function MarketPage() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return '—';
    const time = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    }).format(lastUpdated);
    return `${time} IST`;
  }, [lastUpdated]);

  function onSuccessfulFetch(at: Date) {
    setLastUpdated((current) => {
      if (!current) return at;
      return at.getTime() > current.getTime() ? at : current;
    });
    setIsRefreshing(false);
  }

  function handleRefresh() {
    setIsRefreshing(true);
    setRefreshToken((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-sm border border-[#d8e1ee] bg-white px-4 py-4 lg:px-5">
        <h1 className="font-satoshi text-2xl text-[#11274d] tracking-tight">Market Pulse</h1>
        <p className="font-ibm-plex-sans text-sm text-[#6a7282] mt-1">
          Discover what&apos;s moving on Solana. Evaluate token safety before acting.
        </p>
        <p className="text-[11px] text-[#7a8aa3] font-ibm-plex-sans mt-1">Powered by Birdeye Data</p>
        <div className="flex items-center justify-between gap-3 mt-3">
          <p className="text-xs text-[#6a7282] font-ibm-plex-sans">
            Last updated: <span className="text-[#11274d]">{lastUpdatedLabel}</span>
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border border-[#d0d9e6] hover:bg-[#f8fafc] text-xs text-[#11274d] font-ibm-plex-sans"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BirdeyeTrending refreshToken={refreshToken} onSuccessfulFetch={onSuccessfulFetch} />
        <BirdeyeNewListings refreshToken={refreshToken} onSuccessfulFetch={onSuccessfulFetch} />
      </div>

      <MarketTokenList refreshToken={refreshToken} onSuccessfulFetch={onSuccessfulFetch} />
    </div>
  );
}
