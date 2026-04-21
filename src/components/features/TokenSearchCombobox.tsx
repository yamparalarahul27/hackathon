'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JupiterUltraService, type UltraSearchToken } from '@/services/JupiterUltraService';
import { getTokenIcon } from '@/lib/tokenIcons';

interface Props {
  value: UltraSearchToken | null;
  onChange: (token: UltraSearchToken) => void;
  placeholder?: string;
  disabledMint?: string; // prevent picking the same token on both sides
  ariaLabel?: string;
}

const ultra = new JupiterUltraService();
const DEBOUNCE_MS = 250;

/**
 * Autocomplete token picker backed by Jupiter Ultra /search.
 * Shows icon, symbol, name, verified badge, and mint (short).
 * Real data only — if the search fails, the dropdown surfaces the error.
 */
export function TokenSearchCombobox({ value, onChange, placeholder = 'Search tokens…', disabledMint, ariaLabel }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<UltraSearchToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      // Nothing to search — results already default to [].
      setError(null);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const tokens = await ultra.searchTokens(trimmed);
        if (!cancelled) setResults(tokens);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  const handleSelect = (token: UltraSearchToken) => {
    onChange(token);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 20);
        }}
        className="flex items-center gap-2 h-9 px-3 bg-white border border-[#cbd5e1] rounded-sm text-sm font-ibm-plex-sans text-[#11274d] hover:bg-[#f1f5f9] transition-colors min-w-[140px]"
        aria-label={ariaLabel ?? 'Select token'}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value ? (
          <TokenBadge token={value} />
        ) : (
          <span className="text-[#94a3b8]">Select token</span>
        )}
        <ChevronDown size={12} className={cn('text-[#6a7282] transition-transform ml-auto', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-10 z-30 w-[320px] max-w-[calc(100vw-32px)] bg-white border border-[#cbd5e1] rounded-sm raised-frosted overflow-hidden"
        >
          <div className="relative border-b border-[#e2e8f0]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-3 py-2.5 text-sm font-ibm-plex-sans text-[#11274d] placeholder:text-[#94a3b8] focus:outline-none"
            />
            {loading && (
              <Loader2
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] animate-spin"
              />
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {!query.trim() && (
              <p className="px-3 py-4 text-xs text-[#94a3b8] font-ibm-plex-sans">
                Start typing a symbol, name, or mint.
              </p>
            )}
            {error && (
              <p className="px-3 py-3 text-xs text-[#991b1b] font-ibm-plex-sans bg-[#fef2f2] border-t border-[#fecaca]">
                {error}
              </p>
            )}
            {!loading && !error && query.trim() && results.length === 0 && (
              <p className="px-3 py-4 text-xs text-[#94a3b8] font-ibm-plex-sans">
                No tokens match &quot;{query}&quot;.
              </p>
            )}
            {results.map((t) => {
              const disabled = disabledMint === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={value?.id === t.id}
                  disabled={disabled}
                  onClick={() => handleSelect(t)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-[#f1f5f9]'
                  )}
                >
                  <TokenIcon icon={t.icon} mint={t.id} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[#11274d] font-ibm-plex-sans truncate">
                        {t.symbol || short(t.id)}
                      </span>
                      {t.isVerified && (
                        <ShieldCheck size={10} className="text-[#0fa87a] flex-shrink-0" />
                      )}
                    </div>
                    {t.name && (
                      <div className="text-[10px] text-[#94a3b8] font-ibm-plex-sans truncate">
                        {t.name}
                      </div>
                    )}
                  </div>
                  {t.usdPrice != null && (
                    <span className="text-[11px] font-mono text-[#6a7282] flex-shrink-0">
                      ${formatPrice(t.usdPrice)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TokenBadge({ token }: { token: UltraSearchToken }) {
  return (
    <>
      <TokenIcon icon={token.icon} mint={token.id} size={20} />
      <span className="font-semibold text-[#11274d]">{token.symbol || short(token.id)}</span>
      {token.isVerified && <ShieldCheck size={10} className="text-[#0fa87a]" />}
    </>
  );
}

function TokenIcon({ icon, mint, size }: { icon: string | null; mint: string; size: number }) {
  const src = icon ?? getTokenIcon(mint);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="rounded-full flex-shrink-0 bg-[#f1f5f9]"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
}

function short(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toExponential(2);
}
