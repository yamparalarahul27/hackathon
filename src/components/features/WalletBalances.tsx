'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Snowflake, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  JupiterUltraService,
  type UltraHolding,
  type UltraSearchToken,
} from '@/services/JupiterUltraService';
import { getTokenIcon } from '@/lib/tokenIcons';
import { useUmbra } from '@/lib/hooks/useUmbra';

const ultra = new JupiterUltraService();

interface Props {
  walletAddress: string;
  onMintsLoaded?: (mints: string[]) => void;
}

interface BalanceRow extends UltraHolding {
  symbol: string | null;
  name: string | null;
  icon: string | null;
  usdPrice: number | null;
}

export function WalletBalances({ walletAddress, onMintsLoaded }: Props) {
  const [holdings, setHoldings] = useState<UltraHolding[]>([]);
  const [meta, setMeta] = useState<Record<string, UltraSearchToken>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const fetched = await ultra.getHoldings(walletAddress);
        if (cancelled) return;
        const nonZero = fetched.filter((h) => h.uiAmount > 0);
        setHoldings(nonZero);
        onMintsLoaded?.(nonZero.map((h) => h.mint));

        // Enrich with symbol/name/price via a single /search call per mint.
        // The /search endpoint supports comma-separated mints (up to 100).
        const mints = nonZero.map((h) => h.mint);
        if (mints.length > 0) {
          try {
            const tokens = await ultra.searchTokens(mints.join(','));
            if (cancelled) return;
            const map: Record<string, UltraSearchToken> = {};
            for (const t of tokens) {
              map[t.id] = t;
            }
            setMeta(map);
          } catch {
            // Metadata is best-effort; holdings will render with fallback labels.
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to fetch balances.');
        setHoldings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [walletAddress]);

  const rows: BalanceRow[] = useMemo(() => {
    return holdings.map((h) => {
      const m = meta[h.mint];
      return {
        ...h,
        symbol: m?.symbol ?? null,
        name: m?.name ?? null,
        icon: m?.icon ?? null,
        usdPrice: m?.usdPrice ?? null,
      };
    });
  }, [holdings, meta]);

  const totalUsd = useMemo(() => {
    return rows.reduce((acc, r) => {
      if (r.usdPrice == null) return acc;
      return acc + r.uiAmount * r.usdPrice;
    }, 0);
  }, [rows]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="label-section-light">Balances</h2>
          <p className="text-xs text-[#6a7282] font-ibm-plex-sans mt-0.5">
            {loading
              ? 'Fetching via Jupiter Ultra…'
              : `${rows.length} holding${rows.length !== 1 ? 's' : ''} via Jupiter Ultra`}
          </p>
        </div>
        {totalUsd > 0 && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-[#6a7282] font-ibm-plex-sans">
              Est. value
            </p>
            <p className="data-md text-[#11274d]">
              ${totalUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      {loading && (
        <Card className="p-6 text-center">
          <Loader2 size={14} className="inline animate-spin text-[#94a3b8]" />
          <p className="text-xs text-[#94a3b8] font-ibm-plex-sans mt-2">
            Loading wallet balances
          </p>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-[#fef2f2] border border-[#fecaca]">
          <p className="text-sm text-[#991b1b] font-ibm-plex-sans">{error}</p>
        </Card>
      )}

      {!loading && !error && rows.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">
            No tokens in this wallet.
          </p>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-[#e2e8f0]">
            {rows.map((r) => (
              <BalanceRowItem key={r.mint} row={r} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function BalanceRowItem({ row }: { row: BalanceRow }) {
  const [imgErr, setImgErr] = useState(false);
  const [shielding, setShielding] = useState(false);
  const { available, shield } = useUmbra();
  const icon = row.icon ?? getTokenIcon(row.mint);
  const usdValue = row.usdPrice != null ? row.uiAmount * row.usdPrice : null;

  const handleShield = async () => {
    if (!row.amount || shielding) return;
    setShielding(true);
    try {
      await shield(row.mint, BigInt(row.amount));
    } finally {
      setShielding(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
      {!imgErr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          onError={() => setImgErr(true)}
          className="rounded-full flex-shrink-0 bg-[#f1f5f9]"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-[#f1f5f9] flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-[#11274d] font-ibm-plex-sans truncate">
            {row.symbol ?? short(row.mint)}
          </p>
          {row.isFrozen && (
            <span
              title="Frozen — cannot be transferred"
              className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe] rounded-sm text-[9px] uppercase tracking-wider"
            >
              <Snowflake size={9} /> Frozen
            </span>
          )}
        </div>
        {row.name && (
          <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans truncate">{row.name}</p>
        )}
      </div>
      <div className="text-right flex items-center gap-2">
        <div>
          <p className="data-sm text-[#11274d]">
            {row.uiAmount.toLocaleString('en-US', { maximumFractionDigits: 6 })}
          </p>
          {usdValue != null ? (
            <p className="text-[11px] text-[#6a7282] font-ibm-plex-sans">
              ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          ) : (
            <p className="text-[11px] text-[#94a3b8] font-ibm-plex-sans">Price unavailable</p>
          )}
        </div>
        {available && !row.isFrozen && (
          <button
            onClick={handleShield}
            disabled={shielding}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-[#6a7282] hover:text-[#3B7DDD] hover:bg-[#f1f5f9] rounded-sm transition-colors disabled:opacity-40"
            title="Shield — encrypt this balance"
          >
            {shielding ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Shield size={10} />
            )}
            <span className="hidden sm:inline">Shield</span>
          </button>
        )}
      </div>
    </div>
  );
}

function short(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
