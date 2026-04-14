'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCompact, formatPercent } from '@/lib/utils';
import { fetchPairsForToken, type DexPair } from '@/services/DexScreenerService';

interface Props {
  mint: string;
  symbol: string;
}

export const TokenDexPairs = React.memo(function TokenDexPairs({ mint, symbol }: Props) {
  const [pairs, setPairs] = useState<DexPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);

      try {
        const nextPairs = await fetchPairsForToken(mint, 8);
        if (!cancelled) setPairs(nextPairs);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mint]);

  return (
    <div>
      <p className="label-section-light mb-3">Top DEX Pairs for {symbol}</p>
      {loading ? (
        <Card className="p-4 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">Loading DEX pairs…</p>
        </Card>
      ) : error || pairs.length === 0 ? (
        <Card className="p-4 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">
            {error ?? `No DEX pairs found for ${symbol}`}
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden p-0">
            <table className="w-full text-sm font-ibm-plex-sans">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase text-[#6a7282] font-medium">Pair</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase text-[#6a7282] font-medium">DEX</th>
                  <th className="text-right py-2.5 px-4 text-[10px] uppercase text-[#6a7282] font-medium">Liquidity</th>
                  <th className="text-right py-2.5 px-4 text-[10px] uppercase text-[#6a7282] font-medium">24h Vol</th>
                  <th className="text-right py-2.5 px-4 text-[10px] uppercase text-[#6a7282] font-medium">24h Chg</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((p) => {
                  const changeColor = p.priceChange24h >= 0 ? 'text-[#059669]' : 'text-[#ef4444]';
                  return (
                    <tr key={p.pairAddress} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="text-sm font-medium text-[#11274d]">
                          {p.baseToken.symbol}/{p.quoteToken.symbol}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-[#6a7282]">{p.dexName}</td>
                      <td className="py-2.5 px-4 text-right data-sm text-[#11274d]">{formatCompact(p.liquidityUsd)}</td>
                      <td className="py-2.5 px-4 text-right data-sm text-[#11274d]">{formatCompact(p.volume24h)}</td>
                      <td className={`py-2.5 px-4 text-right data-sm ${changeColor}`}>
                        {p.priceChange24h >= 0 ? '+' : ''}{formatPercent(p.priceChange24h)}
                      </td>
                      <td className="py-2.5 px-2">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" title="View on DexScreener">
                          <ExternalLink size={12} className="text-[#94a3b8] hover:text-[#3B7DDD]" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {pairs.map((p) => (
              <a key={p.pairAddress} href={p.url} target="_blank" rel="noopener noreferrer">
                <Card hover className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#11274d]">
                      {p.baseToken.symbol}/{p.quoteToken.symbol}
                    </p>
                    <p className="text-[10px] text-[#94a3b8]">{p.dexName}</p>
                  </div>
                  <div className="text-right">
                    <p className="data-sm text-[#11274d]">{formatCompact(p.liquidityUsd)}</p>
                    <p className="text-[10px] text-[#94a3b8]">{formatCompact(p.volume24h)} vol</p>
                  </div>
                </Card>
              </a>
            ))}
          </div>

          <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans mt-2 text-right">
            via DexScreener
          </p>
        </>
      )}
    </div>
  );
});
