'use client';

import { useEffect, useMemo, useState } from 'react';
import { Wallet, ArrowRight, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { trackDepositEvent } from '@/services/TorqueService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TokenIcon } from '@/components/ui/TokenIcon';
import type { KaminoVaultInfo } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { KaminoDepositService } from '@/services/KaminoDepositService';
import { WALLET_CLUSTER_CONFIG, DEFAULT_WALLET_CLUSTER } from '@/lib/constants';

type Step = 'select-vault' | 'enter-amount' | 'confirmation';

interface DepositFlowProps {
  preSelectedVaultAddress?: string | null;
  vaults?: KaminoVaultInfo[];
}

export function DepositFlow({ preSelectedVaultAddress, vaults: vaultsProp }: DepositFlowProps) {
  const {
    connected,
    openWalletModal,
    publicKey,
    signTransaction,
    canSignTransactions,
    hasInstalledWallets,
  } = useWalletConnection();

  const vaults = (vaultsProp ?? []).filter((vault) => vault.status === 'active');
  const rpcUrl = WALLET_CLUSTER_CONFIG[DEFAULT_WALLET_CLUSTER].rpcUrl;
  const depositService = useMemo(() => (rpcUrl ? new KaminoDepositService(rpcUrl) : null), [rpcUrl]);

  const initialVault = preSelectedVaultAddress
    ? vaults.find((v) => v.address === preSelectedVaultAddress) ?? null
    : null;

  const [step, setStep] = useState<Step>(initialVault ? 'enter-amount' : 'select-vault');
  const [selectedVault, setSelectedVault] = useState<KaminoVaultInfo | null>(initialVault);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync pre-selected vault when vaults load asynchronously
  useEffect(() => {
    if (!selectedVault && preSelectedVaultAddress) {
      const match = vaults.find((v) => v.address === preSelectedVaultAddress);
      if (match) {
         
        setSelectedVault(match);
        setStep('enter-amount');
      }
    }
  }, [preSelectedVaultAddress, selectedVault, vaults]);

  const tokenAmount = useMemo(() => parseFloat(amount) || 0, [amount]);
  const estimatedUsd = useMemo(() => {
    if (!selectedVault) return 0;
    return tokenAmount * selectedVault.token.priceUsd;
  }, [tokenAmount, selectedVault]);
  const estimatedYearlyYield = useMemo(() => {
    if (!selectedVault) return 0;
    return estimatedUsd * (selectedVault.apy / 100);
  }, [estimatedUsd, selectedVault]);

  const handleDeposit = async () => {
    if (!connected || !publicKey) {
      openWalletModal();
      return;
    }
    if (!signTransaction || !canSignTransactions) {
      setError('Connected wallet does not support transaction signing.');
      return;
    }
    if (!selectedVault || tokenAmount <= 0) return;
    if (!depositService) {
      setError('No mainnet RPC configured for deposit.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await depositService.deposit(
        {
          vaultAddress: selectedVault.address,
          userWallet: publicKey.toBase58(),
          tokenAmount,
        },
        signTransaction
      );
      setTxSignature(result.txSignature);
      if (publicKey && selectedVault) {
        trackDepositEvent(
          publicKey.toBase58(),
          selectedVault.address,
          String(tokenAmount),
          result.txSignature
        );
      }
      setStep('confirmation');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deposit failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('select-vault');
    setSelectedVault(null);
    setAmount('');
    setTxSignature(null);
    setError(null);
  };

  const steps: Step[] = ['select-vault', 'enter-amount', 'confirmation'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="font-satoshi font-bold text-xl text-[#11274d]">Deposit</h2>
          <p className="text-sm text-[#6a7282] mt-1">Deposit a single token into a Kamino K-Vault to earn yield.</p>
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
            const labels = ['Vault', 'Amount', 'Done'];
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
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <span className="text-[10px] text-[#6B7280] hidden sm:block">{labels[index]}</span>
                </div>
                {index < steps.length - 1 && <ArrowRight size={10} className="text-[#94a3b8] mb-4 sm:mb-0" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: select vault */}
        {step === 'select-vault' && (
          <div className="space-y-3">
            <p className="label-section-light">Choose a vault</p>
            {vaults.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-[#6a7282]">No vaults available.</p>
              </Card>
            ) : (
              vaults.map((vault) => (
                <Card
                  key={vault.address}
                  hover
                  className="p-4"
                  onClick={() => {
                    setSelectedVault(vault);
                    setStep('enter-amount');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TokenIcon mint={vault.token.mint} symbol={vault.token.symbol} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-[#11274d]">{vault.name}</p>
                        <p className="text-xs text-[#6B7280]">{vault.token.symbol} Earn</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="data-md text-[#059669]">{formatPercent(vault.apy)} APY</p>
                      <p className="text-xs text-[#6B7280]">
                        TVL: {vault.tvl >= 1e6 ? `$${(vault.tvl / 1e6).toFixed(1)}M` : `$${(vault.tvl / 1e3).toFixed(0)}K`}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Step 2: enter amount */}
        {step === 'enter-amount' && selectedVault && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TokenIcon mint={selectedVault.token.mint} symbol={selectedVault.token.symbol} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#11274d]">{selectedVault.name}</p>
                  <p className="data-sm text-[#059669]">{formatPercent(selectedVault.apy)} APY</p>
                </div>
              </div>
            </Card>

            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Amount in ${selectedVault.token.symbol}`}
                className="w-full pl-4 pr-20 py-4 bg-white border border-[#cbd5e1] rounded-sm text-xl data-md text-[#11274d] placeholder:text-[#6B7280] focus:outline-none focus:border-[#19549b]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 data-sm text-[#6B7280] uppercase">
                {selectedVault.token.symbol}
              </span>
            </div>

            {tokenAmount > 0 && (
              <Card className="space-y-2 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Deposit value</span>
                  <span className="data-md text-[#11274d]">{formatUsd(estimatedUsd)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Estimated yearly yield</span>
                  <span className="data-md text-[#059669]">+{formatUsd(estimatedYearlyYield)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Performance fee</span>
                  <span className="data-sm text-[#6B7280]">{selectedVault.performanceFeeBps} bps</span>
                </div>
              </Card>
            )}

            {error && (
              <div className="rounded-sm border border-[#fecaca] bg-[#fef2f2] px-3 py-2">
                <p className="text-xs text-[#b91c1c]">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setStep('select-vault'); setSelectedVault(null); }}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!tokenAmount || !connected || submitting}
                onClick={handleDeposit}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  `Deposit ${tokenAmount || ''} ${selectedVault.token.symbol}`.trim()
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: confirmation */}
        {step === 'confirmation' && selectedVault && (
          <Card className="text-center py-8 space-y-4 px-4">
            <CheckCircle size={48} className="text-[#059669] mx-auto" />
            <h3 className="font-satoshi font-bold text-xl text-[#11274d]">Deposit Confirmed</h3>
            <div className="space-y-1">
              <p className="text-sm text-[#6B7280]">
                Deposited {tokenAmount} {selectedVault.token.symbol} into
              </p>
              <p className="text-sm font-semibold text-[#3B7DDD]">{selectedVault.name}</p>
              <p className="data-md text-[#059669]">Target APY: {formatPercent(selectedVault.apy)}</p>
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
            <Button onClick={handleReset}>Make Another Deposit</Button>
          </Card>
        )}
    </div>
  );
}
