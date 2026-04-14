'use client';

import { useState, useMemo } from 'react';
import { ArrowDownUp, Loader2 } from 'lucide-react';
import { Connection } from '@solana/web3.js';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { JupiterSwapService, TOKEN_MINTS, type SwapQuote } from '@/services/JupiterSwapService';
import { useWalletConnection } from '@/lib/hooks/useWalletConnection';
import { WALLET_CLUSTER_CONFIG, DEFAULT_WALLET_CLUSTER } from '@/lib/constants';

const swapService = new JupiterSwapService();

const TOKENS = [
  { symbol: 'SOL', mint: TOKEN_MINTS.SOL, decimals: 9 },
  { symbol: 'USDC', mint: TOKEN_MINTS.USDC, decimals: 6 },
  { symbol: 'USDT', mint: TOKEN_MINTS.USDT, decimals: 6 },
  { symbol: 'ETH', mint: TOKEN_MINTS.ETH, decimals: 8 },
  { symbol: 'JUP', mint: TOKEN_MINTS.JUP, decimals: 6 },
  { symbol: 'JTO', mint: TOKEN_MINTS.JTO, decimals: 9 },
];

export default function SwapPage() {
  const {
    connected,
    openWalletModal,
    publicKey,
    signTransaction,
    canSignTransactions,
    hasInstalledWallets,
  } = useWalletConnection();
  const [inputToken, setInputToken] = useState(TOKENS[1]); // USDC
  const [outputToken, setOutputToken] = useState(TOKENS[0]); // SOL
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rpcUrl = WALLET_CLUSTER_CONFIG[DEFAULT_WALLET_CLUSTER].rpcUrl;
  const connection = useMemo(() => {
    if (!rpcUrl) return null;
    return new Connection(rpcUrl, 'confirmed');
  }, [rpcUrl]);

  const outputAmount = useMemo(() => {
    if (!quote) return '';
    return (Number(quote.outAmount) / (10 ** outputToken.decimals)).toFixed(6);
  }, [quote, outputToken.decimals]);

  const handleGetQuote = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    if (inputToken.mint === outputToken.mint) {
      setError('Select two different tokens to swap.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setTxSignature(null);
    setQuote(null);
    try {
      const baseUnits = Math.floor(num * (10 ** inputToken.decimals));
      const q = await swapService.getQuote({
        inputMint: inputToken.mint,
        outputMint: outputToken.mint,
        amount: baseUnits,
        slippageBps: 50,
      });
      setQuote(q);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch quote.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    if (!connected || !publicKey) {
      openWalletModal();
      return;
    }
    if (!signTransaction || !canSignTransactions) {
      setError('Connected wallet does not support transaction signing.');
      return;
    }
    if (!connection) {
      setError('No public RPC URL configured. Set NEXT_PUBLIC_RPC_MAINNET or NEXT_PUBLIC_HELIUS_RPC_URL.');
      return;
    }

    setSwapping(true);
    setError(null);
    try {
      const baseUnits = Math.floor(num * (10 ** inputToken.decimals));
      const result = await swapService.executeSwap(
        {
          inputMint: inputToken.mint,
          outputMint: outputToken.mint,
          amount: baseUnits,
          slippageBps: 50,
        },
        publicKey.toBase58(),
        signTransaction,
        connection
      );

      setTxSignature(result.txSignature);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setQuote(null);
      setAmount('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed.';
      setError(message);
    } finally {
      setSwapping(false);
    }
  };

  const handleFlip = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setQuote(null);
    setAmount('');
    setError(null);
  };

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d]">Swap</h2>
          <p className="text-sm text-[#6a7282] mt-1">Swap tokens via Jupiter with pre-sign quote checks and on-chain confirmation.</p>
        </div>

        <Card className="p-5 space-y-4">
          {/* Input Token */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6a7282] font-ibm-plex-sans">You pay</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f1f5f9] rounded-lg p-3">
              <select
                value={inputToken.symbol}
                onChange={e => {
                  const t = TOKENS.find(t => t.symbol === e.target.value);
                  if (t) { setInputToken(t); setQuote(null); }
                }}
                className="bg-transparent text-sm font-semibold text-[#11274d] font-ibm-plex-sans focus:outline-none"
              >
                {TOKENS.map(t => <option key={t.mint} value={t.symbol}>{t.symbol}</option>)}
              </select>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => { setAmount(e.target.value); setQuote(null); }}
                className="flex-1 text-right bg-transparent text-lg font-ibm-plex-sans text-[#11274d] focus:outline-none placeholder:text-[#94a3b8]"
              />
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center">
            <button
              onClick={handleFlip}
              className="p-2 rounded-lg bg-white border border-[#cbd5e1] hover:bg-[#e2e8f0] transition-colors"
            >
              <ArrowDownUp size={16} className="text-[#11274d]" />
            </button>
          </div>

          {/* Output Token */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6a7282] font-ibm-plex-sans">You receive</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f1f5f9] rounded-lg p-3">
              <select
                value={outputToken.symbol}
                onChange={e => {
                  const t = TOKENS.find(t => t.symbol === e.target.value);
                  if (t) { setOutputToken(t); setQuote(null); }
                }}
                className="bg-transparent text-sm font-semibold text-[#11274d] font-ibm-plex-sans focus:outline-none"
              >
                {TOKENS.map(t => <option key={t.mint} value={t.symbol}>{t.symbol}</option>)}
              </select>
              <div className="flex-1 text-right text-lg font-ibm-plex-sans text-[#11274d]">
                {loading ? '...' : outputAmount || '0.00'}
              </div>
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
              <p className="text-[11px] text-[#11274d] font-ibm-plex-sans font-medium">Review before wallet signature</p>
              <div className="flex justify-between text-xs font-ibm-plex-sans">
                <span className="text-[#6a7282]">Price impact</span>
                <span className="text-[#059669]">{quote.priceImpactPct}%</span>
              </div>
              <div className="flex justify-between text-xs font-ibm-plex-sans">
                <span className="text-[#6a7282]">Route</span>
                <span className="text-[#6a7282]">{quote.routePlan.map(r => r.swapInfo.label).join(' → ')}</span>
              </div>
              <div className="flex justify-between text-xs font-ibm-plex-sans">
                <span className="text-[#6a7282]">Slippage</span>
                <span className="text-[#6a7282]">{quote.slippageBps / 100}%</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="text-center py-2 text-sm text-[#059669] font-ibm-plex-sans font-medium">
              Swap successful!
            </div>
          )}

          {txSignature && (
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-[#3B7DDD] hover:underline"
            >
              View transaction on Solscan
            </a>
          )}

          {error && (
            <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2">
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
          ) : !quote ? (
            <Button className="w-full" onClick={handleGetQuote} disabled={!amount || loading || inputToken.mint === outputToken.mint}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Get Quote'}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleSwap} disabled={swapping || !canSignTransactions}>
              {swapping ? <Loader2 size={14} className="animate-spin" /> : `Swap ${inputToken.symbol} → ${outputToken.symbol}`}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
