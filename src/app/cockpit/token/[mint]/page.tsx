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
  getTokenMetadata,
  fetchCoinGeckoMarketData,
  fetchAllPriceSources,
  type TokenMarketData,
  type TokenPriceSource,
} from '@/services/TokenDataService';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useKaminoVaults } from '@/lib/hooks/useKaminoVaults';

interface Props {
  params: Promise<{ mint: string }>;
}

export default function TokenDetailPage({ params }: Props) {
  const { mint } = use(params);
  const metadata = getTokenMetadata(mint);

  const { walletAddress } = useWalletConnection();
  const { vaults } = useKaminoVaults(walletAddress);
  const [marketData, setMarketData] = useState<TokenMarketData | null>(null);
  const [priceSources, setPriceSources] = useState<TokenPriceSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);

      try {
        const [market, sources] = await Promise.all([
          fetchCoinGeckoMarketData(mint),
          fetchAllPriceSources(mint),
        ]);
        if (cancelled) return;
        setMarketData(market);
        setPriceSources(sources);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mint]);

  // Unknown token fallback
  if (!metadata) {
    return (
      <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
        <div className="max-w-[1400px] mx-auto text-center py-20">
          <p className="text-lg text-[#11274d] font-ibm-plex-sans mb-2">Token not found</p>
          <p className="text-sm text-[#6a7282] font-ibm-plex-sans mb-4">Mint: {mint}</p>
          <Link href="/vault/kamino" className="text-sm text-[#3B7DDD] hover:underline">← Back to Vaults</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Back Link */}
        <Link href="/vault/kamino" className="inline-flex items-center gap-1 text-xs text-[#6a7282] hover:text-[#11274d] transition-colors font-ibm-plex-sans">
          <ArrowLeft size={12} /> Back
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
    </div>
  );
}
