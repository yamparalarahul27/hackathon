'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Search } from 'lucide-react';
import type { NftAsset } from '@/services/HeliusNftService';

interface Props {
  nfts: NftAsset[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function NftGallery({ nfts, total, loading, error }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? nfts.filter(
        (n) =>
          n.name.toLowerCase().includes(search.toLowerCase()) ||
          n.symbol.toLowerCase().includes(search.toLowerCase())
      )
    : nfts;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="label-section-light">NFT Holdings</h2>
          <p className="text-xs text-[#6a7282] font-ibm-plex-sans mt-0.5">
            {total} NFT{total !== 1 ? 's' : ''} via Helius DAS
          </p>
        </div>
        {nfts.length > 0 && (
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search NFTs…"
              className="w-full bg-white border border-[#cbd5e1] rounded-sm pl-9 pr-3 py-2 text-sm font-ibm-plex-sans text-[#11274d] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3B7DDD]"
            />
          </div>
        )}
      </div>

      {loading && nfts.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">Loading NFTs…</p>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-[#fef2f2] border border-[#fecaca]">
          <p className="text-sm text-[#991b1b] font-ibm-plex-sans">{error}</p>
        </Card>
      )}

      {!loading && nfts.length === 0 && !error && (
        <Card className="p-8 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">No NFTs found in this wallet.</p>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((nft) => (
            <NftCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}

function NftCard({ nft }: { nft: NftAsset }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card hover className="overflow-hidden p-0">
      <div className="aspect-square bg-[#f1f5f9] relative">
        {nft.image && !imgError ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#94a3b8] text-xs font-ibm-plex-sans">
            No image
          </div>
        )}
        {nft.compressed && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#11274d]/70 rounded-sm text-[8px] text-white font-ibm-plex-sans">
            cNFT
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-medium text-[#11274d] truncate font-ibm-plex-sans" title={nft.name}>
          {nft.name}
        </p>
        {nft.symbol && (
          <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans truncate">{nft.symbol}</p>
        )}
      </div>
    </Card>
  );
}
