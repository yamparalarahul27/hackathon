'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Search } from 'lucide-react';
import type { NftAsset } from '@/services/HeliusNftService';
import { NftDetailModal } from './NftDetailModal';

interface Props {
  nfts: NftAsset[];
  total: number;
  loading: boolean;
  error: string | null;
}

const CNFT_FILTER = '__cnft__';
const ALL_FILTER = '__all__';

export function NftGallery({ nfts, total, loading, error }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>(ALL_FILTER);
  const [activeNft, setActiveNft] = useState<NftAsset | null>(null);

  // Build collection buckets for filter pills (sorted by count desc).
  const collectionBuckets = useMemo(() => {
    const buckets = new Map<string, { id: string; name: string; count: number }>();
    for (const nft of nfts) {
      if (!nft.collection) continue;
      const id = nft.collection.id;
      const existing = buckets.get(id);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(id, {
          id,
          name: nft.collection.name ?? shortMint(id),
          count: 1,
        });
      }
    }
    return Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  }, [nfts]);

  const compressedCount = useMemo(
    () => nfts.filter((n) => n.compressed).length,
    [nfts]
  );

  const filtered = useMemo(() => {
    let out = nfts;
    if (filter === CNFT_FILTER) {
      out = out.filter((n) => n.compressed);
    } else if (filter !== ALL_FILTER) {
      out = out.filter((n) => n.collection?.id === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.symbol.toLowerCase().includes(q) ||
          (n.collection?.name ?? '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [nfts, filter, search]);

  const collectionsShown = collectionBuckets.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="label-section-light">NFT Holdings</h2>
          <p className="text-xs text-[#6a7282] font-ibm-plex-sans mt-0.5">
            {total} NFT{total !== 1 ? 's' : ''}
            {collectionsShown > 0 && ` • ${collectionsShown} collection${collectionsShown !== 1 ? 's' : ''}`}
            {' • via Helius DAS'}
          </p>
        </div>
        {nfts.length > 0 && (
          <div className="relative max-w-xs w-full sm:w-auto">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            />
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

      {/* Collection filter pills */}
      {nfts.length > 0 && (collectionBuckets.length > 0 || compressedCount > 0) && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          <FilterPill
            label="All"
            count={nfts.length}
            active={filter === ALL_FILTER}
            onClick={() => setFilter(ALL_FILTER)}
          />
          {compressedCount > 0 && (
            <FilterPill
              label="cNFTs"
              count={compressedCount}
              active={filter === CNFT_FILTER}
              onClick={() => setFilter(CNFT_FILTER)}
            />
          )}
          {collectionBuckets.map((b) => (
            <FilterPill
              key={b.id}
              label={b.name}
              count={b.count}
              active={filter === b.id}
              onClick={() => setFilter(b.id)}
            />
          ))}
        </div>
      )}

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

      {!loading && nfts.length > 0 && filtered.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">No NFTs match this filter.</p>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((nft) => (
            <NftCard key={nft.id} nft={nft} onClick={() => setActiveNft(nft)} />
          ))}
        </div>
      )}

      <NftDetailModal nft={activeNft} onClose={() => setActiveNft(null)} />
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'flex-shrink-0 inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-ibm-plex-sans transition-colors whitespace-nowrap ' +
        (active
          ? 'bg-[#11274d] text-white border border-[#11274d]'
          : 'bg-white text-[#11274d] border border-[#cbd5e1] hover:bg-[#f1f5f9]')
      }
    >
      <span className="truncate max-w-[140px]">{label}</span>
      <span className={active ? 'text-white/75' : 'text-[#94a3b8]'}>{count}</span>
    </button>
  );
}

function NftCard({ nft, onClick }: { nft: NftAsset; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const collectionName = nft.collection?.name ?? null;

  return (
    <Card hover onClick={onClick} className="overflow-hidden p-0">
      <div className="aspect-square bg-[#f1f5f9] relative">
        {nft.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
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
        <p
          className="text-xs font-medium text-[#11274d] truncate font-ibm-plex-sans"
          title={nft.name}
        >
          {nft.name}
        </p>
        <p
          className="text-[10px] text-[#94a3b8] font-ibm-plex-sans truncate"
          title={collectionName ?? nft.symbol}
        >
          {collectionName ?? nft.symbol ?? ''}
        </p>
      </div>
    </Card>
  );
}

function shortMint(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
