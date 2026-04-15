'use client';

import { useEffect, useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NftAsset } from '@/services/HeliusNftService';
import { NftAttributes } from './NftAttributes';
import {
  magicEdenUrl,
  tensorUrl,
  solscanTokenUrl,
  solscanAccountUrl,
} from '@/lib/nftMarketplaces';

interface Props {
  nft: NftAsset | null;
  onClose: () => void;
}

/** Rich NFT detail modal — centered on desktop, full-screen sheet on mobile. */
export function NftDetailModal({ nft, onClose }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    if (!nft) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [nft, onClose]);

  if (!nft) return null;

  const handleCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // no-op
    }
  };

  const royaltyPct = (nft.royaltyBps / 100).toFixed(2);
  const collectionLabel = nft.collection?.name ?? (nft.collection ? short(nft.collection.id) : '—');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#11274d]/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`NFT details for ${nft.name}`}
    >
      <div
        className="bg-white w-full sm:max-w-[900px] sm:max-h-[90vh] max-h-[92vh] overflow-y-auto rounded-t-lg sm:rounded-sm raised-frosted"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 backdrop-blur border-b border-[#e2e8f0] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-[#6a7282] font-ibm-plex-sans truncate">
              {collectionLabel}
            </p>
            <h2 className="font-satoshi font-medium text-sm sm:text-base text-[#11274d] truncate">
              {nft.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-2 flex items-center justify-center h-8 w-8 rounded-sm text-[#6a7282] hover:bg-[#f1f5f9] hover:text-[#11274d] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 p-4">
          {/* LEFT — image + marketplace links */}
          <div className="space-y-3">
            <div className="aspect-square bg-[#f1f5f9] rounded-sm overflow-hidden flex items-center justify-center">
              {nft.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs text-[#94a3b8] font-ibm-plex-sans">No image</span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {nft.compressed && <Badge label="cNFT" />}
              {nft.frozen && <Badge label="Frozen" icon={<Snowflake size={10} />} tone="cold" />}
              {nft.burnt && <Badge label="Burnt" tone="danger" />}
              {nft.delegated && <Badge label="Delegated" tone="warn" />}
              {!nft.mutable && <Badge label="Immutable" tone="info" />}
            </div>

            {/* Marketplace links */}
            <div className="space-y-1.5">
              <p className="text-[9px] uppercase tracking-wider text-[#6a7282] font-ibm-plex-sans">
                View on
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <ExtLink href={magicEdenUrl(nft.id)} label="Magic Eden" />
                <ExtLink href={tensorUrl(nft.id)} label="Tensor" />
                <ExtLink href={solscanTokenUrl(nft.id)} label="Solscan" />
              </div>
              {nft.externalUrl && (
                <ExtLink href={nft.externalUrl} label="Project website" fullWidth />
              )}
            </div>
          </div>

          {/* RIGHT — metadata */}
          <div className="space-y-4 min-w-0">
            {/* Description */}
            {nft.description && (
              <div>
                <p className="text-xs text-[#11274d]/80 font-ibm-plex-sans leading-relaxed whitespace-pre-wrap">
                  {nft.description}
                </p>
              </div>
            )}

            {/* Attributes */}
            {nft.attributes.length > 0 && (
              <Section title="Attributes">
                <NftAttributes attributes={nft.attributes} />
              </Section>
            )}

            {/* Details */}
            <Section title="Details">
              <dl className="space-y-1.5">
                <Row
                  label="Mint"
                  value={short(nft.id)}
                  copyable
                  copied={copiedField === 'mint'}
                  onCopy={() => handleCopy('mint', nft.id)}
                />
                {nft.owner && (
                  <Row
                    label="Owner"
                    value={short(nft.owner)}
                    copyable
                    copied={copiedField === 'owner'}
                    onCopy={() => handleCopy('owner', nft.owner!)}
                    link={solscanAccountUrl(nft.owner)}
                  />
                )}
                {nft.collection && (
                  <Row
                    label="Collection"
                    value={nft.collection.name ?? short(nft.collection.id)}
                    copyable
                    copied={copiedField === 'coll'}
                    onCopy={() => handleCopy('coll', nft.collection!.id)}
                  />
                )}
                <Row label="Royalty" value={`${royaltyPct}%`} />
                <Row label="Interface" value={nft.interface} />
                {nft.ownershipModel && (
                  <Row label="Ownership" value={nft.ownershipModel} />
                )}
                {nft.supply && (nft.supply.printCurrent != null || nft.supply.printMax != null) && (
                  <Row
                    label="Edition"
                    value={`${nft.supply.printCurrent ?? '?'} / ${nft.supply.printMax ?? '∞'}`}
                  />
                )}
                <Row label="Primary sale" value={nft.primarySaleHappened ? 'Yes' : 'No'} />
              </dl>
            </Section>

            {/* Creators */}
            {nft.creators.length > 0 && (
              <Section title="Creators">
                <div className="space-y-1.5">
                  {nft.creators.map((c, i) => (
                    <div
                      key={`${c.address}-${i}`}
                      className="flex items-center justify-between gap-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-sm px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <a
                          href={solscanAccountUrl(c.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-[#11274d] hover:underline truncate"
                        >
                          {short(c.address)}
                        </a>
                        {c.verified && (
                          <ShieldCheck size={11} className="text-[#0fa87a] flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-[#6a7282] font-ibm-plex-sans flex-shrink-0">
                        {c.share}%
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Compression (cNFTs) */}
            {nft.compressed && nft.compression && (
              <Section title="Compression">
                <dl className="space-y-1.5">
                  {nft.compression.tree && (
                    <Row label="Tree" value={short(nft.compression.tree)} />
                  )}
                  {nft.compression.leafId != null && (
                    <Row label="Leaf ID" value={String(nft.compression.leafId)} />
                  )}
                  {nft.compression.seq != null && (
                    <Row label="Seq" value={String(nft.compression.seq)} />
                  )}
                </dl>
              </Section>
            )}

            {/* Authorities */}
            {nft.authorities.length > 0 && (
              <Section title="Authorities">
                <div className="flex flex-wrap gap-1.5">
                  {nft.authorities.map((addr, i) => (
                    <a
                      key={`${addr}-${i}`}
                      href={solscanAccountUrl(addr)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] px-2 py-0.5 bg-[#f1f5f9] border border-[#e2e8f0] rounded-sm text-[#11274d] hover:underline"
                    >
                      {short(addr)}
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- sub-components -------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#6a7282] font-ibm-plex-sans mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  copyable,
  copied,
  onCopy,
  link,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: () => void;
  link?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs font-ibm-plex-sans">
      <dt className="text-[#6a7282]">{label}</dt>
      <dd className="flex items-center gap-1.5 min-w-0">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[#11274d] hover:underline truncate"
          >
            {value}
          </a>
        ) : (
          <span className="font-mono text-[#11274d] truncate">{value}</span>
        )}
        {copyable && (
          <button
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="text-[#94a3b8] hover:text-[#11274d] flex-shrink-0"
          >
            {copied ? <Check size={11} className="text-[#0fa87a]" /> : <Copy size={11} />}
          </button>
        )}
      </dd>
    </div>
  );
}

function Badge({
  label,
  icon,
  tone = 'default',
}: {
  label: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'cold' | 'danger' | 'warn' | 'info';
}) {
  const toneCls = {
    default: 'bg-[#11274d]/85 text-white',
    cold: 'bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]',
    danger: 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]',
    warn: 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]',
    info: 'bg-[#f1f5f9] text-[#11274d] border border-[#cbd5e1]',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] uppercase tracking-wider font-ibm-plex-sans',
        toneCls
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function ExtLink({ href, label, fullWidth }: { href: string; label: string; fullWidth?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-[#cbd5e1] rounded-sm text-[10px] font-ibm-plex-sans text-[#11274d] hover:bg-[#f1f5f9] transition-colors',
        fullWidth && 'w-full'
      )}
    >
      {label}
      <ExternalLink size={10} />
    </a>
  );
}

function short(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
