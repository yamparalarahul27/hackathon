'use client';

import { useState, useMemo, useEffect } from 'react';
import { CreditCard, Wallet, ArrowRight, CheckCircle, IndianRupee, DollarSign, Loader2, ExternalLink, Shield, Repeat, Route } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_KAMINO_VAULTS } from '@/lib/mockKaminoData';
import { KaminoVaultInfo } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { MockJupiterSwapService, TOKEN_MINTS, type SwapQuote } from '@/services/JupiterSwapService';

type Step = 'select-vault' | 'enter-amount' | 'payment' | 'swap' | 'confirmation';
type Method = 'fiat' | 'crypto';

const jupiterService = new MockJupiterSwapService();

interface DepositFlowProps {
  preSelectedVaultAddress?: string | null;
  vaults?: KaminoVaultInfo[];
}

export function DepositFlow({ preSelectedVaultAddress, vaults: vaultsProp }: DepositFlowProps) {
  const { walletAddress, connected, openWalletModal } = useWalletConnection();
  const vaults = (vaultsProp ?? MOCK_KAMINO_VAULTS).filter(v => v.status === 'active');

  // If a vault is pre-selected, skip to step 2
  const preVault = preSelectedVaultAddress ? vaults.find(v => v.address === preSelectedVaultAddress) : null;
  const [step, setStep] = useState<Step>(preVault ? 'enter-amount' : 'select-vault');
  const [method, setMethod] = useState<Method>('fiat');
  const [selectedVault, setSelectedVault] = useState<KaminoVaultInfo | null>(preVault ?? null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [privateMode, setPrivateMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapComplete, setSwapComplete] = useState(false);

  const estimatedUsdc = useMemo(() => {
    const num = parseFloat(amount) || 0;
    return currency === 'INR' ? num / 85 : num;
  }, [amount, currency]);

  const estimatedYearlyYield = useMemo(() => {
    if (!selectedVault) return 0;
    return estimatedUsdc * (selectedVault.apy / 100);
  }, [estimatedUsdc, selectedVault]);

  const swapTargetToken = useMemo(() => {
    if (!selectedVault) return null;
    // If tokenA is not USDC, we need to swap USDC → tokenA
    if (selectedVault.tokenA.mint !== TOKEN_MINTS.USDC) return selectedVault.tokenA;
    // If tokenB is not USDC, we swap USDC → tokenB (for the non-USDC side)
    if (selectedVault.tokenB.mint !== TOKEN_MINTS.USDC) return selectedVault.tokenB;
    return null;
  }, [selectedVault]);

  // Fetch swap quote when entering swap step
  useEffect(() => {
    if (step === 'swap' && swapTargetToken && estimatedUsdc > 0) {
      setSwapLoading(true);
      setSwapQuote(null);
      // Get quote for half the USDC (other half stays as USDC for the pair)
      const halfUsdc = estimatedUsdc / 2;
      jupiterService.getQuoteForUsdAmount(swapTargetToken.mint, halfUsdc)
        .then(quote => setSwapQuote(quote))
        .catch(err => console.error('Quote error:', err))
        .finally(() => setSwapLoading(false));
    }
  }, [step, swapTargetToken, estimatedUsdc]);

  const handlePaymentComplete = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // If vault needs a swap, go to swap step. Otherwise skip to confirmation.
      if (swapTargetToken) {
        setStep('swap');
      } else {
        setStep('confirmation');
      }
    }, 1500);
  };

  const handleSwapExecute = async () => {
    setSwapLoading(true);
    try {
      await jupiterService.executeSwap();
      setSwapComplete(true);
      setTimeout(() => setStep('confirmation'), 800);
    } catch (err) {
      console.error('Swap failed:', err);
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

  const steps: Step[] = ['select-vault', 'enter-amount', 'payment', 'swap', 'confirmation'];
  const currentIdx = steps.indexOf(step);

  // Format output amount from swap quote
  const formatSwapOutput = (quote: SwapQuote) => {
    const decimals = swapTargetToken?.decimals ?? 6;
    return (Number(quote.outAmount) / (10 ** decimals)).toFixed(4);
  };

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d]">Deposit</h2>
          <p className="text-sm text-[#6a7282] mt-1">Fund vaults with fiat or crypto</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => {
            const labels = ['Vault', 'Amount', 'Pay', 'Swap', 'Done'];
            return (
              <div key={s} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    i < currentIdx ? 'bg-[#10B981] text-white' :
                    i === currentIdx ? 'bg-[#3B7DDD] text-white' :
                    'bg-[#e2e8f0] text-[#6B7280]'
                  }`}>
                    {i < currentIdx ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-[#6B7280] hidden sm:block">{labels[i]}</span>
                </div>
                {i < 4 && <ArrowRight size={10} className="text-[#94a3b8] mb-4 sm:mb-0" />}
              </div>
            );
          })}
        </div>

      {/* Step 1: Select Vault */}
      {step === 'select-vault' && (
        <div className="space-y-3">
          <p className="label-section-light">Choose a vault</p>
          {vaults.map(vault => (
            <Card key={vault.address} hover className="p-4" onClick={() => { setSelectedVault(vault); setStep('enter-amount'); }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#11274d]">{vault.name}</p>
                  <p className="text-xs text-[#6B7280]">{vault.tokenA.symbol}/{vault.tokenB.symbol} · {vault.strategy.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                </div>
                <div className="text-right">
                  <p className="data-md text-[#059669]">{formatPercent(vault.apy)} APY</p>
                  <p className="text-xs text-[#6B7280]">TVL: {vault.tvl >= 1e6 ? `$${(vault.tvl/1e6).toFixed(1)}M` : `$${(vault.tvl/1e3).toFixed(0)}K`}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Step 2: Enter Amount */}
      {step === 'enter-amount' && selectedVault && (
        <div className="space-y-4">
          <Card className="p-4">
            <p className="text-xs text-[#6B7280] mb-1">Selected Vault</p>
            <p className="text-sm font-semibold text-[#11274d]">{selectedVault.name}</p>
            <p className="data-sm text-[#059669]">{formatPercent(selectedVault.apy)} APY</p>
          </Card>

          <div className="flex gap-2">
            <Button variant={method === 'fiat' ? 'primary' : 'secondary'} className="flex-1" onClick={() => setMethod('fiat')}>
              <CreditCard size={14} /> Pay with Fiat
            </Button>
            <Button variant={method === 'crypto' ? 'primary' : 'secondary'} className="flex-1" onClick={() => setMethod('crypto')}>
              <Wallet size={14} /> Deposit Crypto
            </Button>
          </div>

          {method === 'fiat' && (
            <>
              <div className="flex gap-2">
                <Button variant={currency === 'INR' ? 'primary' : 'secondary'} size="sm" onClick={() => setCurrency('INR')}>
                  <IndianRupee size={12} /> INR
                </Button>
                <Button variant={currency === 'USD' ? 'primary' : 'secondary'} size="sm" onClick={() => setCurrency('USD')}>
                  <DollarSign size={12} /> USD
                </Button>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] data-sm">{currency === 'INR' ? '₹' : '$'}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-4 bg-white border border-[#cbd5e1] rounded-lg text-xl data-md text-[#11274d] placeholder:text-[#6B7280] focus:outline-none focus:border-[#19549b]"
                />
              </div>

              {parseFloat(amount) > 0 && (
                <Card className="space-y-2 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">You receive (est.)</span>
                    <span className="data-md text-[#11274d]">{estimatedUsdc.toFixed(2)} USDC</span>
                  </div>
                  {swapTargetToken && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">Auto-swap via Jupiter</span>
                      <span className="data-sm text-[#3B7DDD]">USDC → {swapTargetToken.symbol} + USDC</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Est. yearly yield</span>
                    <span className="data-md text-[#059669]">+{formatUsd(estimatedYearlyYield)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Payment</span>
                    <span className="text-[#3B7DDD] text-sm">Dodo Payments</span>
                  </div>
                </Card>
              )}

              {/* Privacy toggle */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border border-[#cbd5e1] rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield size={14} className={privateMode ? 'text-[#0D9373]' : 'text-[#6B7280]'} />
                  <span className="text-sm text-[#6B7280]">Private Deposit (Umbra)</span>
                </div>
                <button
                  onClick={() => setPrivateMode(!privateMode)}
                  className={`w-10 h-5 rounded-full transition-colors ${privateMode ? 'bg-[#0D9373]' : 'bg-[#cbd5e1]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${privateMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </>
          )}

          {method === 'crypto' && (
            <Card className="text-center py-8 px-4">
              <Wallet size={24} className="text-[#6B7280] mx-auto mb-3" />
              {connected ? (
                <>
                  <p className="text-sm text-[#6B7280]">Wallet connected: <span className="data-sm text-[#11274d]">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span></p>
                  <Button className="mt-4">Deposit USDC to Vault</Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#6B7280]">Connect your wallet to deposit crypto directly.</p>
                  <Button className="mt-4" onClick={openWalletModal}>Connect Wallet</Button>
                </>
              )}
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setStep('select-vault'); setSelectedVault(null); }}>Back</Button>
            {method === 'fiat' && (
              <Button className="flex-1" disabled={!parseFloat(amount)} onClick={() => setStep('payment')}>
                Continue to Payment
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Payment (Dodo) */}
      {step === 'payment' && selectedVault && (
        <div className="space-y-4">
          <Card className="text-center py-8 space-y-4 px-4">
            <CreditCard size={32} className="text-[#3B7DDD] mx-auto" />
            <div>
              <p className="data-lg text-[#11274d]">{currency === 'INR' ? '₹' : '$'}{amount}</p>
              <p className="text-sm text-[#6B7280] mt-1">→ {estimatedUsdc.toFixed(2)} USDC{swapTargetToken ? ` → Jupiter Swap → ${selectedVault.name}` : ` → ${selectedVault.name}`}</p>
              {privateMode && (
                <p className="text-xs text-[#0D9373] mt-1 flex items-center justify-center gap-1">
                  <Shield size={12} /> Private deposit via Umbra
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 size={16} className="text-[#3B7DDD] animate-spin" />
                <span className="text-sm text-[#6B7280]">Processing payment...</span>
              </div>
            ) : (
              <Button className="w-full" onClick={handlePaymentComplete}>
                <ExternalLink size={14} /> Pay with Dodo Payments
              </Button>
            )}
          </Card>

          <Button variant="secondary" onClick={() => setStep('enter-amount')}>Back</Button>
        </div>
      )}

      {/* Step 4: Jupiter Swap */}
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

            {/* Swap visualization */}
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
                <p className="data-md text-[#11274d]">
                  {swapQuote ? formatSwapOutput(swapQuote) : '—'}
                </p>
                <p className="text-xs text-[#6B7280]">{swapTargetToken.symbol}</p>
              </div>
            </div>

            {/* Quote details */}
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
                  <span className="text-xs text-[#6B7280]">
                    {swapQuote.routePlan.map(r => r.swapInfo.label).join(' → ')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Price impact</span>
                  <span className="data-sm text-[#059669]">{swapQuote.priceImpactPct}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Slippage tolerance</span>
                  <span className="data-sm text-[#6B7280]">{swapQuote.slippageBps / 100}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Remaining USDC (for pair)</span>
                  <span className="data-sm text-[#11274d]">{(estimatedUsdc / 2).toFixed(2)} USDC</span>
                </div>
              </div>
            )}

            {swapComplete ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <CheckCircle size={16} className="text-[#059669]" />
                <span className="text-sm text-[#059669]">Swap complete! Depositing to vault...</span>
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={!swapQuote || swapLoading}
                onClick={handleSwapExecute}
              >
                {swapLoading ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />}
                {swapLoading ? 'Swapping...' : `Swap USDC → ${swapTargetToken.symbol}`}
              </Button>
            )}
          </Card>

          <Button variant="secondary" onClick={() => setStep('payment')}>Back</Button>
        </div>
      )}

      {/* Step 5: Confirmation */}
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
                <Shield size={12} /> Shielded via Umbra
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
