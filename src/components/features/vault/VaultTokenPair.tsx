'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { TokenIcon } from '@/components/ui/TokenIcon';
import type { TokenInfo } from '@/lib/lp-types';
import Link from 'next/link';

interface VaultTokenPairProps {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
}

function TokenCard({ token }: { token: TokenInfo }) {
  const change = ((Math.random() - 0.4) * 10); // placeholder until real data
  const isPositive = change >= 0;

  return (
    <Card className="p-4 flex-1">
      <div className="flex items-center gap-2 mb-2">
        <TokenIcon mint={token.mint} symbol={token.symbol} size="md" />
        <div>
          <p className="text-sm font-medium text-[#11274d] font-ibm-plex-sans">{token.symbol}</p>
        </div>
      </div>
      <p className="data-md text-[#11274d] mb-1">
        ${token.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: token.priceUsd < 0.01 ? 6 : 2 })}
      </p>
      <Link
        href={`/token/${token.mint}`}
        className="text-[10px] text-[#3B7DDD] hover:underline font-ibm-plex-sans"
      >
        View Token →
      </Link>
    </Card>
  );
}

export const VaultTokenPair = React.memo(function VaultTokenPair({ tokenA, tokenB }: VaultTokenPairProps) {
  return (
    <div>
      <p className="label-section-light mb-3">Token Pair</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TokenCard token={tokenA} />
        <TokenCard token={tokenB} />
      </div>
    </div>
  );
});
