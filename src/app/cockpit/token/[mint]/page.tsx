'use client';

import { use, useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TokenHeader } from '@/components/features/token/TokenHeader';
import { TokenChart } from '@/components/features/token/TokenChart';
import { TokenMarketStats } from '@/components/features/token/TokenMarketStats';
import { TokenPriceSources } from '@/components/features/token/TokenPriceSources';
import { TokenVaults } from '@/components/features/token/TokenVaults';
import { TokenDexPairs } from '@/components/features/token/TokenDexPairs';
import { TokenInfo } from '@/components/features/token/TokenInfo';
import { TokenSafetyScore } from '@/components/features/token/TokenSafetyScore';
import {
  fetchTokenMetadata,
  fetchCoinGeckoMarketData,
  fetchAllPriceSources,
  type TokenMarketData,
  type TokenMetadata,
  type TokenPriceSource,
} from '@/services/TokenDataService';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

interface Props {
  params: Promise<{ mint: string }>;
}

export default function TokenDetailPage({ params }: Props) {
  const { mint } = use(params);

  const { walletAddress } = useWalletConnection();
  const { vaults } = useKaminoVaults(walletAddress);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [metadataResolved, setMetadataResolved] = useState(false);
  const [marketData, setMarketData] = useState<TokenMarketData | null>(null);
  const [priceSources, setPriceSources] = useState<TokenPriceSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      setMetadataResolved(false);
      setLoading(true);
      try {
        const [meta, market, sources] = await Promise.all([
          fetchTokenMetadata(mint),
          fetchCoinGeckoMarketData(mint),
          fetchAllPriceSources(mint),
        ]);
        if (cancelled) return;
        setMetadata(meta);
        setMarketData(market);
        setPriceSources(sources);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setMetadataResolved(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mint]);

  // Truly unknown token — Jupiter returned nothing either. Show fallback only
  // after the async lookup has actually resolved, otherwise the page flashes
  // "not found" before the metadata arrives.
  if (metadataResolved && !metadata) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-[#11274d] font-ibm-plex-sans mb-2">Token not found</p>
        <p className="text-sm text-[#6a7282] font-ibm-plex-sans mb-4">Mint: {mint}</p>
        <Link href="/cockpit/market" className="text-sm text-[#3B7DDD] hover:underline">← Back to Market</Link>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-[#e2e8f0] rounded-sm animate-pulse" />
        <div className="h-20 bg-[#e2e8f0] rounded-sm animate-pulse" />
        <div className="h-64 bg-[#e2e8f0] rounded-sm animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Back Link */}
        <Link href="/cockpit/market" className="inline-flex items-center gap-1 text-xs text-[#6a7282] hover:text-[#11274d] transition-colors font-ibm-plex-sans">
          <ArrowLeft size={12} /> Back to Market
        </Link>

        {/* Header: Name, Price, Change */}
        <TokenHeader metadata={metadata} marketData={marketData} loading={loading} />

        {/* Liveline Chart */}
        <TokenChart
          mint={mint}
          currentPrice={marketData?.price ?? 0}
        />

        {/* Market Stats (horizontal scroll on mobile) */}
        <TokenMarketStats data={marketData} symbol={metadata.symbol} />

        {/* Safety Score (Birdeye) */}
        <TokenSafetyScore mint={mint} />

        {/* Price Oracle Comparison */}
        <TokenPriceSources sources={priceSources} loading={loading} />

        {/* Top DEX Pairs */}
        <TokenDexPairs mint={mint} symbol={metadata.symbol} />

        {/* Vaults Using This Token */}
        <TokenVaults mint={mint} symbol={metadata.symbol} allVaults={vaults} />

        {/* Token Info + Links */}
        <TokenInfo metadata={metadata} />
    </div>
  );
}
