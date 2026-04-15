'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import type { KaminoVaultPosition } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';

interface VaultPositionProps {
  position: KaminoVaultPosition | null;
  connected: boolean;
}

export const VaultPosition = React.memo(function VaultPosition({ position, connected }: VaultPositionProps) {
  if (!connected) {
    return (
      <div>
        <p className="label-section-light mb-3">Your Position</p>
        <Card className="p-6 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">Connect wallet to view your position</p>
        </Card>
      </div>
    );
  }

  if (!position) {
    return (
      <div>
        <p className="label-section-light mb-3">Your Position</p>
        <Card className="p-6 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">No position in this vault</p>
        </Card>
      </div>
    );
  }

  const rows = [
    { label: 'Current Value', value: formatUsd(position.currentValueUsd), highlight: true },
    { label: 'Shares Owned', value: position.sharesOwned.toFixed(4) },
    { label: 'Share Price', value: `$${position.sharePriceUsd.toFixed(4)}` },
    { label: 'APY (7d)', value: formatPercent(position.apy), color: 'text-[#059669]' },
  ];

  return (
    <div>
      <p className="label-section-light mb-3">Your Position</p>
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {rows.map(r => (
            <div key={r.label} className={r.highlight ? 'bg-[#f8fafc] rounded-lg p-2.5' : 'p-2.5'}>
              <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans uppercase tracking-wider mb-0.5">{r.label}</p>
              <p className={`data-sm ${r.color ?? 'text-[#11274d]'}`}>{r.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});
