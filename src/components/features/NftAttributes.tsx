'use client';

import type { NftAttribute } from '@/services/HeliusNftService';

interface Props {
  attributes: NftAttribute[];
}

export function NftAttributes({ attributes }: Props) {
  if (!attributes || attributes.length === 0) {
    return (
      <p className="text-xs text-[#94a3b8] font-ibm-plex-sans italic">No attributes.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {attributes.map((attr, i) => (
        <div
          key={`${attr.trait_type}-${i}`}
          className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-sm px-2.5 py-2"
        >
          <p className="text-[9px] uppercase tracking-wider text-[#6a7282] font-ibm-plex-sans truncate">
            {attr.trait_type}
          </p>
          <p className="text-xs font-medium text-[#11274d] font-ibm-plex-sans truncate mt-0.5">
            {String(attr.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
