'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { TokenPairIcons } from '@/components/ui/TokenIcon';
import { StatusDot } from '@/components/ui/StatusDot';
import type { KaminoVaultInfo } from '@/lib/lp-types';
import { formatPercent } from '@/lib/utils';

interface VaultDetailHeaderProps {
  vault: KaminoVaultInfo;
}

function formatCompact(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export const VaultDetailHeader = React.memo(function VaultDetailHeader({ vault }: VaultDetailHeaderProps) {
  const stats = [
    { label: 'APY', value: formatPercent(vault.apy), color: 'text-[#059669]' },
    { label: 'TVL', value: formatCompact(vault.tvl), color: 'text-[#11274d]' },
    { label: '24h Vol', value: formatCompact(vault.volume24h), color: 'text-[#11274d]' },
    { label: '24h Fees', value: formatCompact(vault.fees24h), color: 'text-[#11274d]' },
  ];

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Vault Identity */}
      <div className="flex items-center gap-3">
        <TokenPairIcons tokenA={vault.tokenA} tokenB={vault.tokenB} />
        <div>
          <h1 className="font-display font-bold text-lg text-[#11274d]">{vault.name}</h1>
          <div className="flex items-center gap-2 text-xs text-[#6a7282] font-ibm-plex-sans">
            <span>Kamino</span>
            {vault.curator && <><span>·</span><span>{vault.curator}</span></>}
            <span>·</span>
            <StatusDot variant={vault.status === 'active' ? 'live' : 'danger'} />
            <span className="capitalize">{vault.status}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-[#f8fafc] rounded-lg p-3">
            <p className="label-section-light mb-1">{s.label}</p>
            <p className={`data-md ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
});
