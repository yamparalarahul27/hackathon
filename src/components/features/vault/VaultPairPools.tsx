'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCompact } from '@/lib/utils';
import { fetchPairsForTokenPair, type DexPair } from '@/services/DexScreenerService';

interface Props {
  mintA: string;
  mintB: string;
  symbolA: string;
  symbolB: string;
}

/**
 * "Where This Pair Trades" — shows DEX pools from DexScreener
 * for the vault's underlying token pair.
 */
export const VaultPairPools = React.memo(function VaultPairPools({ mintA, mintB, symbolA, symbolB }: Props) {
  const [pairs, setPairs] = useState<DexPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPairsForTokenPair(mintA, mintB, 8)
      .then(setPairs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [mintA, mintB]);

  if (loading) {
    return (
      <div>
        <p className="label-section-light mb-3">Where {symbolA}/{symbolB} Trades</p>
        <Card className="p-4 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">Loading DEX pairs…</p>
        </Card>
      </div>
    );
  }

  if (error || pairs.length === 0) {
    return (
      <div>
        <p className="label-section-light mb-3">Where {symbolA}/{symbolB} Trades</p>
        <Card className="p-4 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">
            {error ?? `No DEX pools found for ${symbolA}/${symbolB}`}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <p className="label-section-light mb-3">Where {symbolA}/{symbolB} Trades</p>
      <div className="space-y-2">
        {pairs.map((p) => (
          <a
            key={p.pairAddress}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card hover className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-[#11274d] font-ibm-plex-sans w-20 shrink-0">
                    {p.dexName}
                  </span>
                  <span className="text-[10px] text-[#94a3b8] font-mono truncate hidden sm:block">
                    {p.pairAddress.slice(0, 8)}…{p.pairAddress.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-[#94a3b8] uppercase">Liquidity</p>
                    <p className="data-sm text-[#11274d]">{formatCompact(p.liquidityUsd)}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-[#94a3b8] uppercase">24h Vol</p>
                    <p className="data-sm text-[#11274d]">{formatCompact(p.volume24h)}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-[#94a3b8] uppercase">Txns</p>
                    <p className="data-sm text-[#11274d]">
                      {p.txns24h.buys + p.txns24h.sells}
                    </p>
                  </div>
                  <ExternalLink size={12} className="text-[#94a3b8] shrink-0" />
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans mt-2 text-right">
        via DexScreener
      </p>
    </div>
  );
});
