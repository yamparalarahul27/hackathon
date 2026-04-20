'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wallet, ArrowRight, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TokenIcon } from '@/components/ui/TokenIcon';
import type { KaminoVaultInfo, KaminoVaultPosition } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { KaminoWithdrawService } from '@/services/KaminoWithdrawService';
import { WALLET_CLUSTER_CONFIG, DEFAULT_WALLET_CLUSTER } from '@/lib/constants';

type Step = 'select-position' | 'enter-amount' | 'confirmation';

interface WithdrawFlowProps {
  preSelectedVaultAddress?: string | null;
  positions?: KaminoVaultPosition[];
  vaults?: KaminoVaultInfo[];
}

export function WithdrawFlow({ preSelectedVaultAddress, positions: positionsProp, vaults: vaultsProp }: WithdrawFlowProps) {
  const {
    connected,
    openWalletModal,
    publicKey,
    signTransaction,
    canSignTransactions,
    hasInstalledWallets,
  } = useWalletConnection();

  const positions = useMemo(() => positionsProp ?? [], [positionsProp]);
  const vaults = useMemo(() => vaultsProp ?? [], [vaultsProp]);
  const rpcUrl = WALLET_CLUSTER_CONFIG[DEFAULT_WALLET_CLUSTER].rpcUrl;
  const withdrawService = useMemo(() => (rpcUrl ? new KaminoWithdrawService(rpcUrl) : null), [rpcUrl]);

  const initialPosition = preSelectedVaultAddress
    ? positions.find((p) => p.vaultAddress === preSelectedVaultAddress) ?? null
    : null;

  const [step, setStep] = useState<Step>(initialPosition ? 'enter-amount' : 'select-position');
  const [selectedPosition, setSelectedPosition] = useState<KaminoVaultPosition | null>(initialPosition);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPosition && preSelectedVaultAddress) {
      const match = positions.find((p) => p.vaultAddress === preSelectedVaultAddress);
      if (match) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync pre-selected vault from URL param on mount
        setSelectedPosition(match);
        setStep('enter-amount');
      }
    }
  }, [preSelectedVaultAddress, selectedPosition, positions]);

  const vault = useMemo(
    () => (selectedPosition ? vaults.find((v) => v.address === selectedPosition.vaultAddress) : null),
    [selectedPosition, vaults]
  );

  const shareAmount = useMemo(() => parseFloat(amount) || 0, [amount]);

  const estimatedTokens = useMemo(() => {
    if (!vault || !shareAmount) return 0;
    const tokensPerShare = vault.sharePriceUsd / vault.token.priceUsd;
    return shareAmount * tokensPerShare;
  }, [shareAmount, vault]);

  const estimatedUsd = useMemo(() => {
    if (!selectedPosition || !shareAmount) return 0;
    return shareAmount * selectedPosition.sharePriceUsd;
  }, [shareAmount, selectedPosition]);

  const handleWithdraw = async () => {
    if (!connected || !publicKey) {
      openWalletModal();
      return;
    }
    if (!signTransaction || !canSignTransactions) {
      setError('Connected wallet does not support transaction signing.');
      return;
    }
    if (!selectedPosition || shareAmount <= 0) return;
    if (shareAmount > selectedPosition.sharesOwned) {
      setError(`Cannot withdraw more than ${selectedPosition.sharesOwned} shares.`);
      return;
    }
    if (!withdrawService) {
      setError('No mainnet RPC configured for withdrawal.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await withdrawService.withdraw(
        {
          vaultAddress: selectedPosition.vaultAddress,
          userWallet: publicKey.toBase58(),
          shareAmount,
        },
        signTransaction
      );
      setTxSignature(result.txSignature);
      setStep('confirmation');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('select-position');
    setSelectedPosition(null);
    setAmount('');
    setTxSignature(null);
    setError(null);
  };

  const steps: Step[] = ['select-position', 'enter-amount', 'confirmation'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d]">Withdraw</h2>
          <p className="text-sm text-[#6a7282] mt-1">Redeem vault shares to withdraw your tokens from a Kamino K-Vault.</p>
        </div>

        {!connected && (
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet size={18} className="text-[#6B7280]" />
              <p className="text-sm text-[#6B7280]">Connect wallet to continue.</p>
            </div>
            <Button size="sm" onClick={openWalletModal}>Connect</Button>
          </Card>
        )}

        {!connected && !hasInstalledWallets && (
          <p className="text-xs text-[#6B7280] text-center -mt-3">
            No wallet detected. Install a Solana wallet or use a wallet&apos;s in-app browser.
          </p>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-1">
          {steps.map((s, index) => {
            const labels = ['Position', 'Amount', 'Done'];
            return (
              <div key={s} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    index < currentStepIndex
                      ? 'bg-[#10B981] text-white'
                      : index === currentStepIndex
                        ? 'bg-[#3B7DDD] text-white'
                        : 'bg-[#e2e8f0] text-[#6B7280]'
                  }`}>
                    {index < currentStepIndex ? '\u2713' : index + 1}
                  </div>
                  <span className="text-[10px] text-[#6B7280] hidden sm:block">{labels[index]}</span>
                </div>
                {index < steps.length - 1 && <ArrowRight size={10} className="text-[#94a3b8] mb-4 sm:mb-0" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: select position */}
        {step === 'select-position' && (
          <div className="space-y-3">
            <p className="label-section-light">Choose a position to withdraw from</p>
            {positions.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-[#6a7282]">
                  {connected ? 'No vault positions found for this wallet.' : 'Connect your wallet to see positions.'}
                </p>
              </Card>
            ) : (
              positions.map((pos) => (
                <Card
                  key={pos.id}
                  hover
                  className="p-4"
                  onClick={() => {
                    setSelectedPosition(pos);
                    setStep('enter-amount');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TokenIcon mint={pos.token.mint} symbol={pos.token.symbol} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-[#11274d]">{pos.vaultName}</p>
                        <p className="text-xs text-[#6B7280]">{pos.sharesOwned.toFixed(4)} shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="data-md text-[#11274d]">{formatUsd(pos.currentValueUsd)}</p>
                      <p className="text-xs text-[#059669]">{formatPercent(pos.apy)} APY</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Step 2: enter amount */}
        {step === 'enter-amount' && selectedPosition && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TokenIcon mint={selectedPosition.token.mint} symbol={selectedPosition.token.symbol} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#11274d]">{selectedPosition.vaultName}</p>
                  <p className="text-xs text-[#6B7280]">
                    {selectedPosition.sharesOwned.toFixed(4)} shares &middot; {formatUsd(selectedPosition.currentValueUsd)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="data-sm text-[#059669]">{formatPercent(selectedPosition.apy)} APY</p>
                </div>
              </div>
            </Card>

            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Number of shares"
                className="w-full pl-4 pr-24 py-4 bg-white border border-[#cbd5e1] rounded-lg text-xl data-md text-[#11274d] placeholder:text-[#6B7280] focus:outline-none focus:border-[#19549b]"
              />
              <button
                type="button"
                onClick={() => setAmount(selectedPosition.sharesOwned.toString())}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-[#3B7DDD] hover:bg-[#f1f5f9] rounded-sm transition-colors"
              >
                MAX
              </button>
            </div>

            {shareAmount > 0 && (
              <Card className="space-y-2 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Estimated tokens</span>
                  <span className="data-md text-[#11274d]">
                    {estimatedTokens.toFixed(vault?.token.decimals ?? 4)} {vault?.token.symbol ?? ''}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Estimated value</span>
                  <span className="data-md text-[#11274d]">{formatUsd(estimatedUsd)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Shares to redeem</span>
                  <span className="data-sm text-[#6B7280]">{shareAmount.toFixed(4)}</span>
                </div>
              </Card>
            )}

            {error && (
              <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2">
                <p className="text-xs text-[#b91c1c]">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setStep('select-position'); setSelectedPosition(null); setAmount(''); setError(null); }}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!shareAmount || shareAmount > selectedPosition.sharesOwned || !connected || submitting}
                onClick={handleWithdraw}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  `Withdraw ${shareAmount ? shareAmount.toFixed(4) : ''} shares`.trim()
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: confirmation */}
        {step === 'confirmation' && selectedPosition && (
          <Card className="text-center py-8 space-y-4 px-4">
            <CheckCircle size={48} className="text-[#059669] mx-auto" />
            <h3 className="font-display font-bold text-xl text-[#11274d]">Withdrawal Confirmed</h3>
            <div className="space-y-1">
              <p className="text-sm text-[#6B7280]">
                Redeemed {shareAmount.toFixed(4)} shares from
              </p>
              <p className="text-sm font-semibold text-[#3B7DDD]">{selectedPosition.vaultName}</p>
              {vault && (
                <p className="data-md text-[#11274d]">
                  ~{estimatedTokens.toFixed(vault.token.decimals)} {vault.token.symbol} ({formatUsd(estimatedUsd)})
                </p>
              )}
              {txSignature && (
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#3B7DDD] hover:underline"
                >
                  View transaction <ExternalLink size={10} />
                </a>
              )}
            </div>
            <Button onClick={handleReset}>Make Another Withdrawal</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
