'use client';

import { cn } from '@/lib/utils';
import { getTokenIcon, handleIconError } from '@/lib/tokenIcons';

interface TokenIconProps {
  mint: string;
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

/** Scalable token icon — loads from Solana token-list CDN, fallback to avatar */
export function TokenIcon({ mint, symbol, size = 'md', className }: TokenIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic CDN URL with runtime error fallback
    <img
      src={getTokenIcon(mint, symbol)}
      alt={symbol}
      onError={(e) => handleIconError(e, symbol)}
      className={cn('rounded-full object-cover shrink-0', sizes[size], className)}
    />
  );
}

/** Overlapping token pair icons */
export function TokenPairIcons({
  tokenA,
  tokenB,
  size = 'md',
}: {
  tokenA: { mint: string; symbol: string };
  tokenB: { mint: string; symbol: string };
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="flex -space-x-1">
      <TokenIcon mint={tokenA.mint} symbol={tokenA.symbol} size={size} className="border-2 border-white" />
      <TokenIcon mint={tokenB.mint} symbol={tokenB.symbol} size={size} className="border-2 border-white" />
    </div>
  );
}
