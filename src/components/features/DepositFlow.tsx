'use client';

import { useState, useMemo } from 'react';
import { CreditCard, Wallet, ArrowRight, CheckCircle, IndianRupee, DollarSign, Zap, Loader2, ExternalLink, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_KAMINO_VAULTS } from '@/lib/mockKaminoData';
import { KaminoVaultInfo } from '@/lib/lp-types';
import { formatUsd, formatPercent } from '@/lib/utils';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';

type Step = 'select-vault' | 'enter-amount' | 'payment' | 'confirmation';
type Method = 'fiat' | 'crypto';

export function DepositFlow() {
  const { walletAddress, connected, openWalletModal } = useWalletConnection();
  const [step, setStep] = useState<Step>('select-vault');
  const [method, setMethod] = useState<Method>('fiat');
  const [selectedVault, setSelectedVault] = useState<KaminoVaultInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [privateMode, setPrivateMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const vaults = MOCK_KAMINO_VAULTS.filter(v => v.status === 'active');

  const estimatedUsdc = useMemo(() => {
    const num = parseFloat(amount) || 0;
    return currency === 'INR' ? num / 85 : num;
  }, [amount, currency]);

  const estimatedYearlyYield = useMemo(() => {
    if (!selectedVault) return 0;
    return estimatedUsdc * (selectedVault.apy / 100);
  }, [estimatedUsdc, selectedVault]);

  const handleDeposit = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('confirmation'); }, 1500);
  };

  const handleReset = () => {
    setStep('select-vault');
    setSelectedVault(null);
    setAmount('');
    setPrivateMode(false);
  };

  // Progress indicator
  const steps: Step[] = ['select-vault', 'enter-amount', 'payment', 'confirmation'];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-xl text-white">Deposit</h2>
        <p className="text-sm text-[#9CA3AF] mt-1">Fund vaults with fiat or crypto</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < currentIdx ? 'bg-[#10B981] text-white' :
              i === currentIdx ? 'bg-[#3B7DDD] text-white' :
              'bg-white/8 text-[#6B7280]'
            }`}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            {i < 3 && <ArrowRight size={12} className="text-[#4B5563]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Vault */}
      {step === 'select-vault' && (
        <div className="space-y-3">
          <p className="label-section">Choose a vault</p>
          {vaults.map(vault => (
            <Card key={vault.address} hover onClick={() => { setSelectedVault(vault); setStep('enter-amount'); }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{vault.name}</p>
                  <p className="text-xs text-[#6B7280]">{vault.tokenA.symbol}/{vault.tokenB.symbol} · {vault.strategy.replace('-', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="data-md text-[#10B981]">{formatPercent(vault.apy)} APY</p>
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
          <Card>
            <p className="text-xs text-[#6B7280] mb-1">Selected Vault</p>
            <p className="text-sm font-semibold text-white">{selectedVault.name}</p>
            <p className="data-sm text-[#10B981]">{formatPercent(selectedVault.apy)} APY</p>
          </Card>

          {/* Method toggle */}
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
              {/* Currency */}
              <div className="flex gap-2">
                <Button variant={currency === 'INR' ? 'primary' : 'secondary'} size="sm" onClick={() => setCurrency('INR')}>
                  <IndianRupee size={12} /> INR
                </Button>
                <Button variant={currency === 'USD' ? 'primary' : 'secondary'} size="sm" onClick={() => setCurrency('USD')}>
                  <DollarSign size={12} /> USD
                </Button>
              </div>

              {/* Amount input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] font-data">{currency === 'INR' ? '₹' : '$'}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-4 bg-transparent border border-white/12 rounded-lg text-xl font-data text-white placeholder:text-[#6B7280] focus:outline-none focus:border-white/25"
                />
              </div>

              {parseFloat(amount) > 0 && (
                <Card className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">You receive (est.)</span>
                    <span className="data-md text-white">{estimatedUsdc.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Est. yearly yield</span>
                    <span className="data-md text-[#10B981]">+{formatUsd(estimatedYearlyYield)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">Powered by</span>
                    <span className="text-[#3B7DDD] text-sm">Dodo Payments</span>
                  </div>
                </Card>
              )}

              {/* Privacy toggle (Umbra) */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#1A2332] border border-white/8 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield size={14} className={privateMode ? 'text-[#0D9373]' : 'text-[#6B7280]'} />
                  <span className="text-sm text-[#9CA3AF]">Private Deposit (Umbra)</span>
                </div>
                <button
                  onClick={() => setPrivateMode(!privateMode)}
                  className={`w-10 h-5 rounded-full transition-colors ${privateMode ? 'bg-[#0D9373]' : 'bg-white/12'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${privateMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </>
          )}

          {method === 'crypto' && (
            <Card className="text-center py-8">
              <Wallet size={24} className="text-[#6B7280] mx-auto mb-3" />
              {connected ? (
                <>
                  <p className="text-sm text-[#9CA3AF]">Wallet connected: <span className="data-sm text-white">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span></p>
                  <Button className="mt-4">Deposit USDC to Vault</Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#9CA3AF]">Connect your wallet to deposit crypto directly.</p>
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

      {/* Step 3: Payment */}
      {step === 'payment' && selectedVault && (
        <div className="space-y-4">
          <Card className="text-center py-8 space-y-4">
            <CreditCard size={32} className="text-[#3B7DDD] mx-auto" />
            <div>
              <p className="data-lg text-white">{currency === 'INR' ? '₹' : '$'}{amount}</p>
              <p className="text-sm text-[#6B7280] mt-1">→ {estimatedUsdc.toFixed(2)} USDC → {selectedVault.name}</p>
              {privateMode && (
                <p className="text-xs text-[#0D9373] mt-1 flex items-center justify-center gap-1">
                  <Shield size={12} /> Private deposit via Umbra
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 size={16} className="text-[#3B7DDD] animate-spin" />
                <span className="text-sm text-[#9CA3AF]">Processing payment...</span>
              </div>
            ) : (
              <Button className="w-full" onClick={handleDeposit}>
                <ExternalLink size={14} /> Pay with Dodo Payments
              </Button>
            )}
          </Card>

          <Button variant="secondary" onClick={() => setStep('enter-amount')}>Back</Button>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirmation' && selectedVault && (
        <Card className="text-center py-8 space-y-4">
          <CheckCircle size={48} className="text-[#10B981] mx-auto" />
          <h3 className="font-display font-bold text-xl text-white">Deposit Successful!</h3>
          <div className="space-y-1">
            <p className="text-sm text-[#9CA3AF]">{estimatedUsdc.toFixed(2)} USDC deposited into</p>
            <p className="text-sm font-semibold text-[#3B7DDD]">{selectedVault.name}</p>
            <p className="data-md text-[#10B981]">Earning {formatPercent(selectedVault.apy)} APY</p>
            {privateMode && <p className="text-xs text-[#0D9373] flex items-center justify-center gap-1"><Shield size={12} /> Shielded via Umbra</p>}
          </div>
          <Button onClick={handleReset}>Make Another Deposit</Button>
        </Card>
      )}
    </div>
  );
}
