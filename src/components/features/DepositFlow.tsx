'use client';

import { useState, useMemo, useEffect } from 'react';
import { Wallet, ArrowRight, CheckCircle, Loader2, Shield, Repeat, Route } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { KaminoVaultInfo } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { MockJupiterSwapService, TOKEN_MINTS, type SwapQuote } from '@/services/JupiterSwapService';

type Step = 'select-vault' | 'enter-amount' | 'swap' | 'confirmation';

const jupiterService = new MockJupiterSwapService();

interface DepositFlowProps {
  preSelectedVaultAddress?: string | null;
  vaults?: KaminoVaultInfo[];
}

export function DepositFlow({ preSelectedVaultAddress, vaults: vaultsProp }: DepositFlowProps) {
  const { connected, openWalletModal } = useWalletConnection();
  const vaults = (vaultsProp ?? []).filter((vault) => vault.status === 'active');

  const initialVault = preSelectedVaultAddress
    ? vaults.find((vault) => vault.address === preSelectedVaultAddress) ?? null
    : null;

  const [step, setStep] = useState<Step>(initialVault ? 'enter-amount' : 'select-vault');
  const [selectedVault, setSelectedVault] = useState<KaminoVaultInfo | null>(initialVault);
  const [amount, setAmount] = useState('');
  const [privateMode, setPrivateMode] = useState(false);
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapComplete, setSwapComplete] = useState(false);

  useEffect(() => {
    if (!selectedVault && preSelectedVaultAddress) {
      const matchedVault = vaults.find((vault) => vault.address === preSelectedVaultAddress);
      if (matchedVault) {
        setSelectedVault(matchedVault);
        setStep('enter-amount');
      }
    }
  }, [preSelectedVaultAddress, selectedVault, vaults]);

  const estimatedUsdc = useMemo(() => parseFloat(amount) || 0, [amount]);

  const estimatedYearlyYield = useMemo(() => {
    if (!selectedVault) return 0;
    return estimatedUsdc * (selectedVault.apy / 100);
  }, [estimatedUsdc, selectedVault]);

  const swapTargetToken = useMemo(() => {
    if (!selectedVault) return null;
    if (selectedVault.tokenA.mint !== TOKEN_MINTS.USDC) return selectedVault.tokenA;
    if (selectedVault.tokenB.mint !== TOKEN_MINTS.USDC) return selectedVault.tokenB;
    return null;
  }, [selectedVault]);

  useEffect(() => {
    if (step === 'swap' && swapTargetToken && estimatedUsdc > 0) {
      setSwapLoading(true);
      setSwapQuote(null);
      const halfUsdc = estimatedUsdc / 2;
      jupiterService
        .getQuoteForUsdAmount(swapTargetToken.mint, halfUsdc)
        .then((quote) => setSwapQuote(quote))
        .catch((error) => console.error('Swap quote error:', error))
        .finally(() => setSwapLoading(false));
    }
  }, [step, swapTargetToken, estimatedUsdc]);

  const handleContinue = () => {
    if (!connected) {
      openWalletModal();
      return;
    }

    if (swapTargetToken) {
      setStep('swap');
      return;
    }

    setStep('confirmation');
  };

  const handleSwapExecute = async () => {
    setSwapLoading(true);
    try {
      await jupiterService.executeSwap();
      setSwapComplete(true);
      setTimeout(() => setStep('confirmation'), 700);
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setSwapLoading(false);
    }
  };

  const handleReset = () => {
    setStep('select-vault');
    setSelectedVault(null);
    setAmount('');
    setPrivateMode(false);
    setSwapQuote(null);
    setSwapComplete(false);
  };

  const steps: Step[] = ['select-vault', 'enter-amount', 'swap', 'confirmation'];
  const currentStepIndex = steps.indexOf(step);

  const formatSwapOutput = (quote: SwapQuote) => {
    const decimals = swapTargetToken?.decimals ?? 6;
    return (Number(quote.outAmount) / (10 ** decimals)).toFixed(4);
  };

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d]">Crypto Deposit</h2>
          <p className="text-sm text-[#6a7282] mt-1">Deposit from your wallet into Kamino vaults.</p>
        </div>

        {!connected && (
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet size={18} className="text-[#6B7280]" />
              <p className="text-sm text-[#6B7280]">Connect wallet to continue with crypto deposits.</p>
            </div>
            <Button size="sm" onClick={openWalletModal}>Connect</Button>
          </Card>
        )}

        <div className="flex items-center gap-1">
          {steps.map((currentStep, index) => {
            const labels = ['Vault', 'Amount', 'Swap', 'Done'];
            return (
              <div key={currentStep} className="flex items-center gap-1">
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

        {step === 'select-vault' && (
          <div className="space-y-3">
            <p className="label-section-light">Choose a vault</p>
            {vaults.map((vault) => (
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
                  <div>
                    <p className="text-sm font-semibold text-[#11274d]">{vault.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {vault.tokenA.symbol}/{vault.tokenB.symbol} · {vault.strategy.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="data-md text-[#059669]">{formatPercent(vault.apy)} APY</p>
                    <p className="text-xs text-[#6B7280]">
                      TVL: {vault.tvl >= 1e6 ? `$${(vault.tvl / 1e6).toFixed(1)}M` : `$${(vault.tvl / 1e3).toFixed(0)}K`}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {step === 'enter-amount' && selectedVault && (
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs text-[#6B7280] mb-1">Selected Vault</p>
              <p className="text-sm font-semibold text-[#11274d]">{selectedVault.name}</p>
              <p className="data-sm text-[#059669]">{formatPercent(selectedVault.apy)} APY</p>
            </Card>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] data-sm">$</span>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="USDC amount to deposit"
                className="w-full pl-8 pr-4 py-4 bg-white border border-[#cbd5e1] rounded-lg text-xl data-md text-[#11274d] placeholder:text-[#6B7280] focus:outline-none focus:border-[#19549b]"
              />
            </div>

            {parseFloat(amount) > 0 && (
              <Card className="space-y-2 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Deposit value</span>
                  <span className="data-md text-[#11274d]">{estimatedUsdc.toFixed(2)} USDC</span>
                </div>
                {swapTargetToken && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Auto-swap via Jupiter</span>
                    <span className="data-sm text-[#3B7DDD]">USDC → {swapTargetToken.symbol} + USDC</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Estimated yearly yield</span>
                  <span className="data-md text-[#059669]">+{formatUsd(estimatedYearlyYield)}</span>
                </div>
              </Card>
            )}

            <div className="flex items-center justify-between px-4 py-3 bg-white border border-[#cbd5e1] rounded-lg">
              <div className="flex items-center gap-2">
                <Shield size={14} className={privateMode ? 'text-[#0D9373]' : 'text-[#6B7280]'} />
                <span className="text-sm text-[#6B7280]">Private transfer routing</span>
              </div>
              <button
                onClick={() => setPrivateMode((current) => !current)}
                className={`w-10 h-5 rounded-full transition-colors ${privateMode ? 'bg-[#0D9373]' : 'bg-[#cbd5e1]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${privateMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setStep('select-vault'); setSelectedVault(null); }}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!parseFloat(amount) || !connected}
                onClick={handleContinue}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'swap' && selectedVault && swapTargetToken && (
          <div className="space-y-4">
            <Card className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#3B7DDD]/10 flex items-center justify-center">
                  <Repeat size={20} className="text-[#3B7DDD]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#11274d]">Token Swap via Jupiter</p>
                  <p className="text-xs text-[#6B7280]">Best route across Solana DEXes</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-[#6B7280] mb-1">From</p>
                  <p className="data-md text-[#11274d]">{(estimatedUsdc / 2).toFixed(2)}</p>
                  <p className="text-xs text-[#6B7280]">USDC</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Route size={16} className="text-[#3B7DDD]" />
                  <span className="text-[10px] text-[#6B7280]">Jupiter</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#6B7280] mb-1">To</p>
                  <p className="data-md text-[#11274d]">{swapQuote ? formatSwapOutput(swapQuote) : '—'}</p>
                  <p className="text-xs text-[#6B7280]">{swapTargetToken.symbol}</p>
                </div>
              </div>

              {swapLoading && (
                <div className="flex items-center justify-center gap-2 py-3">
                  <Loader2 size={14} className="text-[#3B7DDD] animate-spin" />
                  <span className="text-sm text-[#6B7280]">Fetching best route...</span>
                </div>
              )}

              {swapQuote && !swapLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Route</span>
                    <span className="text-xs text-[#6B7280]">{swapQuote.routePlan.map((route) => route.swapInfo.label).join(' → ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Price impact</span>
                    <span className="data-sm text-[#059669]">{swapQuote.priceImpactPct}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Slippage tolerance</span>
                    <span className="data-sm text-[#6B7280]">{swapQuote.slippageBps / 100}%</span>
                  </div>
                </div>
              )}

              {swapComplete ? (
                <div className="flex items-center justify-center gap-2 py-3">
                  <CheckCircle size={16} className="text-[#059669]" />
                  <span className="text-sm text-[#059669]">Swap complete! Finalizing deposit...</span>
                </div>
              ) : (
                <Button className="w-full" disabled={!swapQuote || swapLoading} onClick={handleSwapExecute}>
                  {swapLoading ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />}
                  {swapLoading ? 'Swapping...' : `Swap USDC → ${swapTargetToken.symbol}`}
                </Button>
              )}
            </Card>

            <Button variant="secondary" onClick={() => setStep('enter-amount')}>Back</Button>
          </div>
        )}

        {step === 'confirmation' && selectedVault && (
          <Card className="text-center py-8 space-y-4 px-4">
            <CheckCircle size={48} className="text-[#059669] mx-auto" />
            <h3 className="font-display font-bold text-xl text-[#11274d]">Deposit Successful!</h3>
            <div className="space-y-1">
              <p className="text-sm text-[#6B7280]">{estimatedUsdc.toFixed(2)} USDC deposited into</p>
              <p className="text-sm font-semibold text-[#3B7DDD]">{selectedVault.name}</p>
              <p className="data-md text-[#059669]">Earning {formatPercent(selectedVault.apy)} APY</p>
              {swapTargetToken && (
                <p className="text-xs text-[#6B7280] flex items-center justify-center gap-1">
                  <Route size={12} /> Swapped via Jupiter for optimal routing
                </p>
              )}
              {privateMode && (
                <p className="text-xs text-[#0D9373] flex items-center justify-center gap-1">
                  <Shield size={12} /> Private routing enabled
                </p>
              )}
            </div>
            <Button onClick={handleReset}>Make Another Deposit</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
