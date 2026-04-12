'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrendingUp } from 'lucide-react';
import { KaminoVaultInfo } from '@/lib/lp-types';
import { formatPercent } from '@/lib/utils';
import Link from 'next/link';

interface TokenVaultsProps {
  mint: string;
  symbol: string;
  allVaults?: KaminoVaultInfo[];
}

export const TokenVaults = React.memo(function TokenVaults({ mint, symbol, allVaults = [] }: TokenVaultsProps) {
  const vaults = useMemo(() => {
    return allVaults.filter(
      v => v.tokenA.mint === mint || v.tokenB.mint === mint
    );
  }, [mint]);

  if (vaults.length === 0) {
    return (
      <div>
        <p className="label-section-light mb-3">Vaults Using {symbol}</p>
        <Card className="p-4 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">No Kamino vaults found using {symbol}</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <p className="label-section-light mb-3">Vaults Using {symbol}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vaults.map(vault => (
          <Card key={vault.address} hover className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#11274d] font-ibm-plex-sans">{vault.name}</p>
              <div className="flex items-center justify-between">
                <span className="data-md text-[#059669] flex items-center gap-1">
                  <TrendingUp size={12} /> {formatPercent(vault.apy)} APY
                </span>
                <span className="text-xs text-[#6a7282] font-ibm-plex-sans">
                  ${vault.tvl >= 1e6 ? `${(vault.tvl / 1e6).toFixed(1)}M` : `${(vault.tvl / 1e3).toFixed(0)}K`} TVL
                </span>
              </div>
              <Link href={`/vault/kamino/deposit?vault=${vault.address}`}>
                <Button variant="execute" size="sm" className="w-full mt-1">Deposit</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});
