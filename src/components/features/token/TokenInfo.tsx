'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ExternalLink } from 'lucide-react';
import type { TokenMetadata } from '@/services/TokenDataService';

interface TokenInfoProps {
  metadata: TokenMetadata;
}

export const TokenInfo = React.memo(function TokenInfo({ metadata }: TokenInfoProps) {
  const shortMint = `${metadata.mint.slice(0, 8)}...${metadata.mint.slice(-8)}`;

  return (
    <Card className="p-4 space-y-4">
      <p className="label-section-light">Token Info</p>

      {metadata.description && (
        <p className="text-sm text-[#6a7282] font-ibm-plex-sans leading-relaxed">{metadata.description}</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-ibm-plex-sans">Mint</span>
          <span className="data-sm text-[#11274d] font-mono">{shortMint}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-ibm-plex-sans">Decimals</span>
          <span className="data-sm text-[#11274d]">{metadata.decimals}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-ibm-plex-sans">Network</span>
          <span className="data-sm text-[#11274d]">Solana Mainnet</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-[#e2e8f0]">
        <a
          href={`https://solscan.io/token/${metadata.mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[#3B7DDD] hover:underline font-ibm-plex-sans"
        >
          Solscan <ExternalLink size={10} />
        </a>
        <a
          href={`https://jup.ag/swap/USDC-${metadata.symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-[#3B7DDD] hover:underline font-ibm-plex-sans"
        >
          Jupiter <ExternalLink size={10} />
        </a>
      </div>
    </Card>
  );
});
