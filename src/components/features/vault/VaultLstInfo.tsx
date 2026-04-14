'use client';

import React, { useMemo } from 'react';
import { Layers, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { identifyVaultLsts, type LST } from '@/services/SanctumLstService';

interface Props {
  mintA: string;
  mintB: string;
  symbolA: string;
  symbolB: string;
  vaultApy: number;
}

const POOL_LABELS: Record<string, string> = {
  Spl: 'SPL Stake Pool',
  SanctumSpl: 'Sanctum SPL Pool',
  SanctumSplMulti: 'Sanctum Multi-Validator',
  Marinade: 'Marinade',
  Lido: 'Lido',
  ReservePool: 'Sanctum Reserve',
  SPool: 'Sanctum S Pool',
};

function LstCard({ lst, vaultApy }: { lst: LST; vaultApy: number }) {
  const poolType = POOL_LABELS[lst.pool.program] ?? lst.pool.program;
  const hasVoteAccount = 'voteAccount' in lst.pool && lst.pool.voteAccount;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        {lst.logoUri && (
          <img
            src={lst.logoUri}
            alt={lst.symbol}
            className="w-8 h-8 rounded-full object-cover shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div>
          <p className="text-sm font-medium text-[#11274d] font-ibm-plex-sans">{lst.name}</p>
          <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans">{lst.symbol} · {poolType}</p>
        </div>
      </div>

      <div className="bg-[#f0fdf4] rounded-sm px-3 py-2 border border-[#bbf7d0]">
        <div className="flex items-center gap-1.5 mb-1">
          <Layers size={12} className="text-[#059669]" />
          <span className="text-[10px] uppercase font-medium text-[#059669] font-ibm-plex-sans">Stacked Yield</span>
        </div>
        <p className="text-xs text-[#15803d] font-ibm-plex-sans">
          This vault LPs into <strong>{lst.symbol}</strong>, a liquid staking token that earns staking yield on top of the vault&apos;s LP fees.
          {vaultApy > 0 && (
            <> The vault APY ({vaultApy.toFixed(1)}%) compounds with {lst.symbol} staking rewards.</>
          )}
        </p>
      </div>

      {hasVoteAccount && (
        <div className="flex items-center gap-2 text-xs text-[#6a7282] font-ibm-plex-sans">
          <Shield size={12} />
          <span>Single-validator LST — delegated to one validator</span>
        </div>
      )}

      {'pool' in lst.pool && 'pool' in lst.pool && (lst.pool as { pool?: string }).pool && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#94a3b8] font-ibm-plex-sans">Pool</span>
          <span className="text-[#11274d] font-mono text-[10px]">
            {((lst.pool as { pool?: string }).pool ?? '').slice(0, 8)}…{((lst.pool as { pool?: string }).pool ?? '').slice(-6)}
          </span>
        </div>
      )}
    </Card>
  );
}

/**
 * Shows LST context on vault detail pages when the vault's tokens include
 * liquid staking tokens. Explains the "stacked yield" concept.
 */
export const VaultLstInfo = React.memo(function VaultLstInfo({ mintA, mintB, symbolA, symbolB, vaultApy }: Props) {
  const { tokenA, tokenB, hasLst } = useMemo(
    () => identifyVaultLsts(mintA, mintB),
    [mintA, mintB]
  );

  if (!hasLst) return null;

  const lsts = [tokenA, tokenB].filter((l): l is LST => l !== null);

  return (
    <div>
      <p className="label-section-light mb-3">Liquid Staking Tokens in this Vault</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lsts.map((lst) => (
          <LstCard key={lst.mint} lst={lst} vaultApy={vaultApy} />
        ))}
      </div>
    </div>
  );
});
