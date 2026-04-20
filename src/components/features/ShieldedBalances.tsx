'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock, Unlock, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUmbra } from '@/lib/hooks/useUmbra';
import { getTokenIcon } from '@/lib/tokenIcons';
import type { EncryptedBalance } from '@/services/UmbraService';

interface Props {
  walletAddress: string;
  /** Mints the user holds publicly — used to query shielded counterparts. */
  publicMints: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- walletAddress reserved for future shielded-balance queries
export function ShieldedBalances({ walletAddress, publicMints }: Props) {
  const {
    available,
    initialized,
    registered,
    loading,
    error,
    shieldedBalances,
    initialize,
    register,
    refreshBalances,
    unshield,
    clearError,
  } = useUmbra();

  const [unshielding, setUnshielding] = useState<string | null>(null);

  // Auto-refresh balances when initialized and public mints change
  useEffect(() => {
    if (initialized && registered && publicMints.length > 0) {
      refreshBalances(publicMints);
    }
  }, [initialized, registered, publicMints, refreshBalances]);

  const handleEnablePrivacy = async () => {
    await initialize();
    await register();
  };

  const handleUnshield = async (bal: EncryptedBalance) => {
    setUnshielding(bal.mint);
    try {
      await unshield(bal.mint, bal.amount);
      // Refresh after unshielding
      await refreshBalances(publicMints);
    } finally {
      setUnshielding(null);
    }
  };

  // Not configured — subtle placeholder
  if (!available) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-[#94a3b8]" />
          <h2 className="label-section-light">Shielded Balances</h2>
        </div>
        <Card className="p-4 text-center">
          <ShieldCheck size={20} className="mx-auto text-[#94a3b8] mb-2" />
          <p className="text-xs text-[#94a3b8] font-ibm-plex-sans">
            Privacy features powered by Umbra — coming soon.
          </p>
        </Card>
      </div>
    );
  }

  // Available but not initialized
  if (!initialized || !registered) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-[#6a7282]" />
          <h2 className="label-section-light">Shielded Balances</h2>
        </div>
        <Card className="p-5 text-center space-y-3">
          <ShieldCheck size={24} className="mx-auto text-[#3B7DDD]" />
          <div>
            <p className="text-sm font-medium text-[#11274d] font-ibm-plex-sans">
              Enable privacy
            </p>
            <p className="text-xs text-[#6a7282] font-ibm-plex-sans mt-1">
              Encrypt your token balances on-chain with Umbra Privacy.
              Only you can view the amounts.
            </p>
          </div>
          {error && (
            <div className="rounded-sm border border-[#fecaca] bg-[#fef2f2] px-3 py-2">
              <p className="text-xs text-[#b91c1c] font-ibm-plex-sans">{error}</p>
              <button onClick={clearError} className="text-[10px] text-[#b91c1c] underline mt-1">
                Dismiss
              </button>
            </div>
          )}
          <Button
            size="sm"
            onClick={handleEnablePrivacy}
            disabled={loading}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Enable Privacy'}
          </Button>
        </Card>
      </div>
    );
  }

  // Initialized — show balances
  const nonZero = shieldedBalances.filter((b) => b.amount > BigInt(0));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#0fa87a]" />
          <h2 className="label-section-light">Shielded Balances</h2>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-[#6a7282] font-ibm-plex-sans">
          Encrypted via Umbra
        </p>
      </div>

      {error && (
        <Card className="p-3 bg-[#fef2f2] border border-[#fecaca]">
          <p className="text-xs text-[#991b1b] font-ibm-plex-sans">{error}</p>
        </Card>
      )}

      {loading && nonZero.length === 0 && (
        <Card className="p-6 text-center">
          <Loader2 size={14} className="inline animate-spin text-[#94a3b8]" />
          <p className="text-xs text-[#94a3b8] font-ibm-plex-sans mt-2">
            Querying encrypted balances
          </p>
        </Card>
      )}

      {!loading && nonZero.length === 0 && (
        <Card className="p-5 text-center">
          <p className="text-xs text-[#94a3b8] font-ibm-plex-sans">
            No shielded balances. Use the shield button on any token to encrypt it.
          </p>
        </Card>
      )}

      {nonZero.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-[#e2e8f0]">
            {nonZero.map((bal) => (
              <ShieldedRow
                key={bal.mint}
                balance={bal}
                onUnshield={handleUnshield}
                unshielding={unshielding === bal.mint}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ShieldedRow({
  balance,
  onUnshield,
  unshielding,
}: {
  balance: EncryptedBalance;
  onUnshield: (bal: EncryptedBalance) => void;
  unshielding: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  const icon = getTokenIcon(balance.mint);
  const short = `${balance.mint.slice(0, 4)}…${balance.mint.slice(-4)}`;

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
        <div className="w-7 h-7 rounded-full bg-[#f1f5f9] flex-shrink-0 flex items-center justify-center">
          <Lock size={12} className="text-[#94a3b8]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#11274d] font-ibm-plex-sans truncate">
          {short}
        </p>
        <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans flex items-center gap-1">
          <Lock size={8} /> Encrypted
        </p>
      </div>
      <div className="text-right flex items-center gap-2">
        <p className="data-sm text-[#11274d]">{balance.amount.toString()}</p>
        <button
          onClick={() => onUnshield(balance)}
          disabled={unshielding}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-[#3B7DDD] hover:bg-[#f1f5f9] rounded-sm transition-colors disabled:opacity-40"
          title="Unshield — decrypt to public balance"
        >
          {unshielding ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Unlock size={10} />
          )}
          <span className="hidden sm:inline">Unshield</span>
        </button>
      </div>
    </div>
  );
}
