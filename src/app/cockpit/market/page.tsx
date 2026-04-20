'use client';

import { BirdeyeTrending } from '@/components/features/BirdeyeTrending';
import { BirdeyeNewListings } from '@/components/features/BirdeyeNewListings';
import { MarketTokenList } from '@/components/features/MarketTokenList';

export default function MarketPage() {
  return (
    <>
      <BirdeyeTrending />
      <BirdeyeNewListings />
      <MarketTokenList />
    </>
  );
}
