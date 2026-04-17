'use client';

import { useState } from 'react';
import { Loader2, ShieldCheck, ShieldOff, KeyRound, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUmbra } from '@/lib/hooks/useUmbra';

export function PrivacyPanel() {
  const {
    available,
    initialized,
    registered,
    loading,
    error,
    initialize,
    register,
    issueGrant,
    revokeGrant,
    recoverStagedSpl,
    clearError,
  } = useUmbra();

  const [auditorAddress, setAuditorAddress] = useState('');
  const [revokeAddress, setRevokeAddress] = useState('');
  const [recoverMint, setRecoverMint] = useState('');
  const [actionResult, setActionResult] = useState<string | null>(null);

  if (!available) {
    return (
      <div className="space-y-3">
        <p className="label-section-light">Privacy & Compliance</p>
        <div className="rounded-sm bg-[#f8fafc] border border-[#e2e8f0] p-4 text-center">
          <ShieldCheck size={20} className="mx-auto text-[#94a3b8] mb-2" />
          <p className="text-xs text-[#94a3b8] font-ibm-plex-sans">
            Privacy features require Umbra configuration.
          </p>
          <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans mt-1">
            Set NEXT_PUBLIC_UMBRA_INDEXER_URL in .env.local
          </p>
        </div>
      </div>
    );
  }

  const handleAction = async (label: string, fn: () => Promise<void>) => {
    setActionResult(null);
    try {
      await fn();
      setActionResult(`${label} succeeded.`);
    } catch {
      // Error is captured by useUmbra's error state
    }
  };

  return (
    <div className="space-y-5">
      <p className="label-section-light">Privacy & Compliance</p>

      {error && (
        <div className="rounded-sm border border-[#fecaca] bg-[#fef2f2] px-3 py-2 flex items-start justify-between">
          <p className="text-xs text-[#b91c1c] font-ibm-plex-sans">{error}</p>
          <button onClick={clearError} className="text-[10px] text-[#b91c1c] underline ml-2 shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {actionResult && (
        <div className="rounded-sm border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2">
          <p className="text-xs text-[#166534] font-ibm-plex-sans">{actionResult}</p>
        </div>
      )}

      {/* Registration Status */}
      <div className="rounded-sm bg-[#f8fafc] border border-[#e2e8f0] p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className={registered ? 'text-[#0fa87a]' : 'text-[#94a3b8]'} />
            <span className="text-sm font-ibm-plex-sans text-[#11274d]">
              {registered ? 'Registered' : initialized ? 'Initialized' : 'Not registered'}
            </span>
          </div>
          {!registered && (
            <Button
              size="sm"
              onClick={() => handleAction('Registration', async () => {
                if (!initialized) await initialize();
                await register();
              })}
              disabled={loading}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : 'Register'}
            </Button>
          )}
        </div>
        <p className="text-[10px] text-[#6a7282] font-ibm-plex-sans">
          Register once to enable encrypted balances on Umbra (devnet).
        </p>
      </div>

      {/* Compliance Grants */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#11274d] font-ibm-plex-sans flex items-center gap-1.5">
          <ShieldCheck size={12} /> Compliance Grants
        </p>

        {/* Issue Grant */}
        <div className="flex gap-2">
          <input
            type="text"
            value={auditorAddress}
            onChange={(e) => setAuditorAddress(e.target.value)}
            placeholder="Auditor wallet address"
            className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-[#cbd5e1] rounded-sm font-ibm-plex-sans text-[#11274d] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#19549b]"
          />
          <Button
            size="sm"
            disabled={!auditorAddress || loading}
            onClick={() => handleAction('Issue grant', () => issueGrant(auditorAddress))}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : 'Grant'}
          </Button>
        </div>

        {/* Revoke Grant */}
        <div className="flex gap-2">
          <input
            type="text"
            value={revokeAddress}
            onChange={(e) => setRevokeAddress(e.target.value)}
            placeholder="Auditor address to revoke"
            className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-[#cbd5e1] rounded-sm font-ibm-plex-sans text-[#11274d] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#19549b]"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!revokeAddress || loading}
            onClick={() => handleAction('Revoke grant', () => revokeGrant(revokeAddress))}
          >
            <ShieldOff size={10} /> Revoke
          </Button>
        </div>

        <p className="text-[10px] text-[#6a7282] font-ibm-plex-sans">
          Compliance grants allow authorized auditors to view your encrypted balances without making them public.
        </p>
      </div>

      {/* Recovery */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#11274d] font-ibm-plex-sans flex items-center gap-1.5">
          <LifeBuoy size={12} /> Fund Recovery
        </p>
        <p className="text-[10px] text-[#6a7282] font-ibm-plex-sans">
          Recover tokens stuck from failed MPC callbacks during shield/unshield operations.
        </p>

        <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans">
          Enter the token mint, amount (raw), and destination wallet to recover stuck funds.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={recoverMint}
            onChange={(e) => setRecoverMint(e.target.value)}
            placeholder="Token mint address"
            className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-[#cbd5e1] rounded-sm font-ibm-plex-sans text-[#11274d] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#19549b]"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!recoverMint || loading}
            onClick={() => handleAction('Recovery', () => recoverStagedSpl(recoverMint, BigInt(0), ''))}
          >
            <KeyRound size={10} /> Recover
          </Button>
        </div>
      </div>
    </div>
  );
}
