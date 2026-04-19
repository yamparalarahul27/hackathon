'use client';

import { BirdeyeTrending } from '@/components/features/BirdeyeTrending';
import { BirdeyeNewListings } from '@/components/features/BirdeyeNewListings';
import { TrendingTokensRail } from '@/components/features/TrendingTokensRail';
import { MarketTokenList } from '@/components/features/MarketTokenList';

export default function MarketPage() {
  return (
    <>
      <BirdeyeTrending />
      <BirdeyeNewListings />
      <TrendingTokensRail />
      <MarketTokenList />
    </>
  );
}
