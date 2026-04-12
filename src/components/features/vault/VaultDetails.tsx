'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ExternalLink } from 'lucide-react';
import type { KaminoVaultInfo } from '@/lib/lp-types';

interface VaultDetailsProps {
  vault: KaminoVaultInfo;
}

export const VaultDetails = React.memo(function VaultDetails({ vault }: VaultDetailsProps) {
  const shortAddr = `${vault.address.slice(0, 8)}...${vault.address.slice(-8)}`;
  const shortShares = `${vault.sharesMint.slice(0, 8)}...${vault.sharesMint.slice(-8)}`;

  return (
    <Card className="p-4 space-y-3">
      <p className="label-section-light">Vault Details</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-ibm-plex-sans">Strategy</span>
          <span className="text-xs text-[#11274d] font-ibm-plex-sans capitalize">{vault.strategy.replace('-', ' ')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-ibm-plex-sans">Fee Rate</span>
          <span className="data-sm text-[#11274d]">{vault.feeRate} bps</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-ibm-plex-sans">Shares Mint</span>
          <span className="data-sm text-[#11274d] font-mono">{shortShares}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-ibm-plex-sans">Vault Address</span>
          <span className="data-sm text-[#11274d] font-mono">{shortAddr}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-[#e2e8f0]">
        <a
          href={`https://solscan.io/account/${vault.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[#3B7DDD] hover:underline font-ibm-plex-sans"
        >
          View on Solscan <ExternalLink size={10} />
        </a>
      </div>
    </Card>
  );
});
