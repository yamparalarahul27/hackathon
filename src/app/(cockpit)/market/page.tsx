'use client';

import { TrendingTokensRail } from '@/components/features/TrendingTokensRail';
import { MarketTokenList } from '@/components/features/MarketTokenList';

export default function MarketPage() {
  return (
    <>
      <TrendingTokensRail />
      <MarketTokenList />
    </>
  );
}
