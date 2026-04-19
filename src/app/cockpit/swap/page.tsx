'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Loader2, ShieldCheck, ShieldAlert, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TokenSearchCombobox } from '@/components/features/TokenSearchCombobox';
import {
  JupiterUltraService,
  type UltraOrder,
  type UltraSearchToken,
  type ShieldWarning,
  type ShieldSeverity,
  maxShieldSeverity,
  decodeBase64Transaction,
} from '@/services/JupiterUltraService';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { useUmbra } from '@/lib/hooks/useUmbra';
import { trackSwapEvent } from '@/services/TorqueService';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

const ultra = new JupiterUltraService();

const DEFAULT_INPUT_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
const DEFAULT_OUTPUT_MINT = 'So11111111111111111111111111111111111111112'; // SOL

export default function SwapPage() {
  const searchParams = useSearchParams();
  const seedInputMint = searchParams.get('inputMint') || DEFAULT_INPUT_MINT;
  const seedOutputMint = searchParams.get('outputMint') || DEFAULT_OUTPUT_MINT;
  const {
    connected,
    openWalletModal,
    publicKey,
    signTransaction,
    canSignTransactions,
    hasInstalledWallets,
  } = useWalletConnection();

  const [inputToken, setInputToken] = useState<UltraSearchToken | null>(null);
  const [outputToken, setOutputToken] = useState<UltraSearchToken | null>(null);
  const [amount, setAmount] = useState('');
  const [order, setOrder] = useState<UltraOrder | null>(null);
  const [outputShield, setOutputShield] = useState<ShieldWarning[]>([]);
  const [quoting, setQuoting] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shieldingOutput, setShieldingOutput] = useState(false);
  const { available: umbraAvailable, shield: umbraShield } = useUmbra();

  // Seed tokens on mount via /search — supports URL params for deep-linking.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [inputResults, outputResults] = await Promise.all([
          ultra.searchTokens(seedInputMint),
          ultra.searchTokens(seedOutputMint),
        ]);
        if (cancelled) return;
        if (inputResults[0]) setInputToken(inputResults[0]);
        if (outputResults[0]) setOutputToken(outputResults[0]);
      } catch {
        // Leave pickers empty on seed failure; user can still search manually.
      }
    })();
    return () => { cancelled = true; };
  }, [seedInputMint, seedOutputMint]);

  const outputShieldSeverity: ShieldSeverity | null = useMemo(
    () => maxShieldSeverity(outputShield),
    [outputShield]
  );
  const outputBlocked = outputShieldSeverity === 'critical';

  const outputAmountDisplay = useMemo(() => {
    if (!order || !outputToken) return '';
    return (Number(order.outAmount) / (10 ** outputToken.decimals)).toFixed(
      outputToken.decimals <= 4 ? outputToken.decimals : 6
    );
  }, [order, outputToken]);

  const resetResult = useCallback(() => {
    setOrder(null);
    setOutputShield([]);
    setError(null);
    setSuccess(false);
    setTxSignature(null);
  }, []);

  const handleGetQuote = async () => {
    const num = parseFloat(amount);
    if (!inputToken || !outputToken) {
      setError('Select both tokens to swap.');
      return;
    }
    if (!num || num <= 0) return;
    if (inputToken.id === outputToken.id) {
      setError('Select two different tokens to swap.');
      return;
    }

    setQuoting(true);
    resetResult();
    try {
      const baseUnits = Math.floor(num * (10 ** inputToken.decimals));
      const taker = connected && publicKey ? publicKey.toBase58() : undefined;
      const [orderResp, shieldMap] = await Promise.all([
        ultra.getOrder({
          inputMint: inputToken.id,
          outputMint: outputToken.id,
          amount: baseUnits,
          taker,
        }),
        ultra.getShield([outputToken.id]).catch(() => ({} as Record<string, ShieldWarning[]>)),
      ]);
      setOrder(orderResp);
      setOutputShield(shieldMap[outputToken.id] ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch quote.');
    } finally {
      setQuoting(false);
    }
  };

  const handleSwap = async () => {
    if (!order || !inputToken || !outputToken) return;
    if (!connected || !publicKey) {
      openWalletModal();
      return;
    }
    if (!signTransaction || !canSignTransactions) {
      setError('Connected wallet does not support transaction signing.');
      return;
    }
    if (!order.transaction || !order.requestId) {
      setError('Order is missing a transaction. Reconnect your wallet and re-quote.');
      return;
    }
    if (outputBlocked) {
      setError('Output token is flagged as unsafe by Jupiter Shield.');
      return;
    }

    setSwapping(true);
    setError(null);
    try {
      const tx = decodeBase64Transaction(order.transaction);
      const signed = await signTransaction(tx);
      const result = await ultra.executeOrder(signed, order.requestId);
      setTxSignature(result.signature);
      if (publicKey && inputToken && outputToken) {
        trackSwapEvent(
          publicKey.toBase58(),
          inputToken.id,
          outputToken.id,
          order.inAmount,
          order.outAmount,
          result.signature
        );
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setOrder(null);
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed.');
    } finally {
      setSwapping(false);
    }
  };

  const handleFlip = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setAmount('');
    resetResult();
  };

  const sameToken = inputToken && outputToken && inputToken.id === outputToken.id;

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d]">Swap</h2>
          <p className="text-sm text-[#6a7282] mt-1">
            Powered by Jupiter Ultra — MEV-protected routing, Shield scam detection, Jupiter-landed transactions.
          </p>
        </div>

        <Card className="p-5 space-y-4">
          {/* Input Token */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6a7282] font-ibm-plex-sans">You pay</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f1f5f9] rounded-sm p-3">
              <TokenSearchCombobox
                value={inputToken}
                onChange={(t) => { setInputToken(t); resetResult(); }}
                disabledMint={outputToken?.id}
                ariaLabel="Input token"
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); resetResult(); }}
                className="flex-1 min-w-0 text-right bg-transparent text-lg font-ibm-plex-sans text-[#11274d] focus:outline-none placeholder:text-[#94a3b8]"
              />
            </div>
          </div>

          {/* Flip */}
          <div className="flex justify-center">
            <button
              onClick={handleFlip}
              aria-label="Flip tokens"
              className="p-2 rounded-sm bg-white border border-[#cbd5e1] hover:bg-[#e2e8f0] transition-colors"
            >
              <ArrowDownUp size={16} className="text-[#11274d]" />
            </button>
          </div>

          {/* Output Token */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6a7282] font-ibm-plex-sans">You receive</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f1f5f9] rounded-sm p-3">
              <TokenSearchCombobox
                value={outputToken}
                onChange={(t) => { setOutputToken(t); resetResult(); }}
                disabledMint={inputToken?.id}
                ariaLabel="Output token"
              />
              <div className="flex-1 min-w-0 text-right text-lg font-ibm-plex-sans text-[#11274d] truncate">
                {quoting ? '…' : outputAmountDisplay || '0.00'}
              </div>
            </div>
          </div>

          {/* Shield warnings */}
          {outputShield.length > 0 && outputToken && (
            <ShieldBanner severity={outputShieldSeverity} warnings={outputShield} />
          )}

          {/* Quote details */}
          {order && (
            <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
              <p className="text-[11px] text-[#11274d] font-ibm-plex-sans font-medium">Review before wallet signature</p>
              <Row label="Price impact" value={`${order.priceImpactPct}%`} />
              <Row
                label="Route"
                value={order.routePlan.map((r) => r.swapInfo.label).join(' → ') || '—'}
              />
              <Row label="Slippage" value={`${(order.slippageBps / 100).toFixed(2)}%`} />
              {order.prioritizationFeeLamports != null && (
                <Row
                  label="Priority fee"
                  value={`${order.prioritizationFeeLamports.toLocaleString()} lamports`}
                />
              )}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center py-2 text-sm text-[#059669] font-ibm-plex-sans font-medium">
              Swap landed via Jupiter Ultra.
            </div>
          )}
          {txSignature && (
            <div className="text-center space-y-2">
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-[#3B7DDD] hover:underline"
              >
                View transaction on Solscan
              </a>
              {umbraAvailable && outputToken && order && (
                <button
                  onClick={async () => {
                    setShieldingOutput(true);
                    try {
                      await umbraShield(outputToken.id, BigInt(order.outAmount));
                    } finally {
                      setShieldingOutput(false);
                    }
                  }}
                  disabled={shieldingOutput}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#11274d] bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-sm transition-colors disabled:opacity-40"
                >
                  {shieldingOutput ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Lock size={10} />
                  )}
                  Shield output
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-sm border border-[#fecaca] bg-[#fef2f2] px-3 py-2">
              <p className="text-xs text-[#b91c1c] font-ibm-plex-sans">{error}</p>
            </div>
          )}

          {/* Actions */}
          {!connected ? (
            <div className="space-y-2">
              <Button className="w-full" onClick={openWalletModal}>Connect Wallet</Button>
              {!hasInstalledWallets && (
                <p className="text-[11px] text-[#6a7282] text-center">
                  No wallet detected. Install a Solana wallet extension or open in a wallet in-app browser.
                </p>
              )}
            </div>
          ) : !order ? (
            <Button
              className="w-full"
              onClick={handleGetQuote}
              disabled={
                !amount ||
                quoting ||
                !inputToken ||
                !outputToken ||
                Boolean(sameToken)
              }
            >
              {quoting ? <Loader2 size={14} className="animate-spin" /> : 'Get Quote'}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleSwap}
              disabled={swapping || !canSignTransactions || outputBlocked}
            >
              {swapping ? (
                <Loader2 size={14} className="animate-spin" />
              ) : outputBlocked ? (
                'Blocked by Shield'
              ) : (
                `Swap ${inputToken?.symbol ?? ''} → ${outputToken?.symbol ?? ''}`
              )}
            </Button>
          )}

          {/* Footer */}
          <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans text-center flex items-center justify-center gap-1">
            <ShieldCheck size={10} className="text-[#0fa87a]" />
            Protected by Jupiter Ultra
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs font-ibm-plex-sans">
      <span className="text-[#6a7282]">{label}</span>
      <span className="text-[#11274d] text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

function ShieldBanner({
  severity,
  warnings,
}: {
  severity: ShieldSeverity | null;
  warnings: ShieldWarning[];
}) {
  const tone = {
    info: 'bg-[#f1f5f9] border-[#cbd5e1] text-[#11274d]',
    warning: 'bg-[#fef3c7] border-[#fde68a] text-[#92400e]',
    critical: 'bg-[#fee2e2] border-[#fecaca] text-[#991b1b]',
  }[severity ?? 'info'];

  const Icon = severity === 'critical' || severity === 'warning' ? ShieldAlert : ShieldCheck;

  return (
    <div className={cn('rounded-sm border px-3 py-2 space-y-1', tone)}>
      <div className="flex items-center gap-1.5 text-[11px] font-ibm-plex-sans font-medium uppercase tracking-wider">
        <Icon size={12} />
        <span>Jupiter Shield</span>
      </div>
      <ul className="space-y-0.5">
        {warnings.map((w, i) => (
          <li key={`${w.type}-${i}`} className="text-[11px] font-ibm-plex-sans">
            • {w.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
