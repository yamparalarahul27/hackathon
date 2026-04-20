'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { TokenIcon } from '@/components/ui/TokenIcon';
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
    { label: 'APY (7d)', value: formatPercent(vault.apy), color: 'text-[#059669]' },
    { label: 'TVL', value: formatCompact(vault.tvl), color: 'text-[#11274d]' },
    { label: 'Share Price', value: `$${vault.sharePriceUsd.toFixed(4)}`, color: 'text-[#11274d]' },
    { label: 'Holders', value: vault.holders.toLocaleString(), color: 'text-[#11274d]' },
  ];

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Vault Identity */}
      <div className="flex items-center gap-3">
        <TokenIcon mint={vault.token.mint} symbol={vault.token.symbol} size="lg" />
        <div>
          <h1 className="font-display font-bold text-lg text-[#11274d]">{vault.name}</h1>
          <div className="flex items-center gap-2 text-xs text-[#6a7282] font-ibm-plex-sans flex-wrap">
            <a
              href={`https://app.kamino.finance/earn/${vault.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#11274d] hover:text-[#3B7DDD] transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external favicon, Next Image not practical */}
              <img
                src="https://app.kamino.finance/favicon.ico"
                alt="Kamino"
                className="w-3.5 h-3.5 rounded-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="font-medium">Kamino K-Vault</span>
              <ExternalLink size={10} />
            </a>
            <span>·</span>
            <StatusDot variant="live" />
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
