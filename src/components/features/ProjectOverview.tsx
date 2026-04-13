'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, BarChart3, ArrowLeftRight, Vault, Wallet } from 'lucide-react';
import { Card, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TokenPairIcons } from '@/components/ui/TokenIcon';
import { RpcErrorBanner } from '@/components/ui/RpcErrorBanner';
import { KaminoVaultInfo, KaminoVaultPosition, LPPortfolioSummary } from '@/lib/lp-types';
import { formatUsd, formatPercent, formatCompact } from '@/lib/utils';

const EMPTY_SUMMARY: LPPortfolioSummary = {
  totalPositions: 0, totalDepositedUsd: 0, totalCurrentValueUsd: 0,
  totalYieldEarnedUsd: 0, totalImpermanentLossUsd: 0, weightedAvgApy: 0,
  bestPerformingVault: null, worstPerformingVault: null,
};

interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
}

function useMarketData() {
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const symbols = ['SOLUSDT', 'BTCUSDT', 'ETHUSDT'];

    async function fetchTickers() {
      try {
        const results = await Promise.all(
          symbols.map(async (sym) => {
            const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`);
            const data = await res.json();
            return {
              symbol: sym.replace('USDT', ''),
              price: parseFloat(data.lastPrice),
              change24h: parseFloat(data.priceChangePercent),
            };
          })
        );
        setTickers(results);
      } catch {
        // Silent — market data is non-critical
      } finally {
        setLoading(false);
      }
    }

    fetchTickers();
    const interval = setInterval(fetchTickers, 30_000);
    return () => clearInterval(interval);
  }, []);

  return { tickers, loading };
}

const QUICK_ACTIONS = [
  {
    label: 'Explore Vaults',
    description: 'Browse Kamino vaults, compare APY and TVL',
    href: '/vault/kamino/explore',
    icon: Vault,
  },
  {
    label: 'DEX Analytics',
    description: 'Trade journal, PnL breakdown, fills history',
    href: '/dex/deriverse',
    icon: BarChart3,
  },
  {
    label: 'Swap Tokens',
    description: 'Jupiter-powered swaps with best routing',
    href: '/swap',
    icon: ArrowLeftRight,
  },
];

interface ProjectOverviewProps {
  vaults: KaminoVaultInfo[];
  positions: KaminoVaultPosition[];
  summary: LPPortfolioSummary;
  loading: boolean;
  error: string | null;
  walletConnected: boolean;
  onConnectWallet: () => void;
  lastUpdated: Date | null;
}

export function ProjectOverview({
  vaults,
  positions,
  summary = EMPTY_SUMMARY,
  loading,
  error,
  walletConnected,
  onConnectWallet,
  lastUpdated,
}: ProjectOverviewProps) {
  const { tickers, loading: marketLoading } = useMarketData();
  const topVaults = [...vaults].sort((a, b) => b.apy - a.apy).slice(0, 5);
  const totalPnl = summary.totalCurrentValueUsd - summary.totalDepositedUsd;

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div
        className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-8 border-b border-white/20"
        style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)',
          paddingRight: 'calc(50vw - 50%)',
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-1">
            DeFi Cockpit
          </h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70 mb-6">
            Real-time Solana yield intelligence — Kamino vaults, DEX analytics, and swaps in one view.
          </p>

          {walletConnected ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Portfolio Value', value: formatUsd(summary.totalCurrentValueUsd), color: 'text-white' },
                { label: 'Total Yield', value: `+${formatUsd(summary.totalYieldEarnedUsd)}`, color: 'text-[#7ee5c6]' },
                { label: 'Net P&L', value: `${totalPnl >= 0 ? '+' : ''}${formatUsd(totalPnl)}`, color: totalPnl >= 0 ? 'text-[#7ee5c6]' : 'text-[#ef4444]' },
                { label: 'Avg APY', value: formatPercent(summary.weightedAvgApy), color: 'text-[#7ee5c6]' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="label-section mb-1">{stat.label}</p>
                  <p className={`data-lg ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-sm px-4 py-3">
                <Wallet size={18} className="text-white/60" />
                <span className="font-ibm-plex-sans text-sm text-white/80">
                  Connect your wallet to see portfolio stats
                </span>
              </div>
              <Button variant="ghost-dark" size="md" onClick={onConnectWallet}>
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-[1400px] mx-auto mb-4">
          <RpcErrorBanner message={error} />
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* ── Quick Actions ─────────────────────────────────────── */}
        <section>
          <h2 className="label-section-light mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card hover className="p-4 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-sm bg-[#f1f5f9] flex items-center justify-center">
                      <action.icon size={18} className="text-[#19549b]" />
                    </div>
                    <ArrowRight size={14} className="text-[#6a7282] mt-1" />
                  </div>
                  <p className="font-ibm-plex-sans text-sm font-medium text-[#11274d] mb-0.5">
                    {action.label}
                  </p>
                  <p className="font-ibm-plex-sans text-xs text-[#6a7282]">
                    {action.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Market Pulse ──────────────────────────────────────── */}
        <section>
          <h2 className="label-section-light mb-3">Market Pulse</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {marketLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="h-12 animate-pulse bg-[#e2e8f0] rounded-sm" />
                  </Card>
                ))
              : tickers.map((t) => (
                  <Card key={t.symbol} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-ibm-plex-sans text-xs text-[#6a7282] mb-1">{t.symbol}/USD</p>
                        <p className="data-md text-[#11274d]">{formatUsd(t.price)}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-ibm-plex-sans font-medium ${t.change24h >= 0 ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#ef4444]'}`}>
                        <TrendingUp size={12} className={t.change24h < 0 ? 'rotate-180' : ''} />
                        {t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </Card>
                ))}
          </div>
        </section>

        {/* ── Top Vaults by APY ─────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="label-section-light">Top Vaults by APY</h2>
              {lastUpdated && (
                <span className="font-ibm-plex-sans text-[10px] text-[#94a3b8]">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · refreshes every 1hr
                </span>
              )}
            </div>
            <Link href="/vault/kamino/explore" className="font-ibm-plex-sans text-xs text-[#19549b] hover:text-[#143f78] flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <Card className="p-4">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse bg-[#e2e8f0] rounded-sm" />
                ))}
              </div>
            </Card>
          ) : topVaults.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-sm raised-frosted">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left py-3 pr-4 pl-4"><span className="label-section-light">Vault</span></th>
                    <th className="text-right py-3 px-3"><span className="label-section-light">APY</span></th>
                    <th className="text-right py-3 px-3"><span className="label-section-light">TVL</span></th>
                    <th className="text-right py-3 px-3 hidden md:table-cell"><span className="label-section-light">24h Fees</span></th>
                    <th className="text-right py-3 pl-3 pr-4"><span className="label-section-light">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {topVaults.map((vault) => (
                    <tr key={vault.address} className="border-b border-[#e2e8f0] last:border-0 hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3.5 pr-4 pl-4">
                        <div className="flex items-center gap-3">
                          <TokenPairIcons tokenA={vault.tokenA} tokenB={vault.tokenB} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-[#11274d]">{vault.name}</p>
                            <p className="text-xs text-[#6B7280] hidden sm:block">
                              {vault.strategy.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3.5 px-3">
                        <span className="data-md text-[#059669] flex items-center justify-end gap-1">
                          <TrendingUp size={12} />{formatPercent(vault.apy)}
                        </span>
                      </td>
                      <td className="text-right py-3.5 px-3">
                        <span className="data-md text-[#11274d]">{formatCompact(vault.tvl)}</span>
                      </td>
                      <td className="text-right py-3.5 px-3 hidden md:table-cell">
                        <span className="data-sm text-[#6B7280]">{formatCompact(vault.fees24h)}</span>
                      </td>
                      <td className="text-right py-3.5 pl-3 pr-4">
                        <Link href={`/vault/kamino/${vault.address}`}>
                          <Button variant="execute" size="sm">Deposit</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-sm text-[#6a7282]">No vault data available.</p>
            </Card>
          )}
        </section>

        {/* ── Your Positions (wallet connected) ─────────────────── */}
        {walletConnected && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="label-section-light">Your Positions</h2>
              <Link href="/vault/kamino" className="font-ibm-plex-sans text-xs text-[#19549b] hover:text-[#143f78] flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {positions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {positions.slice(0, 3).map((p, i) => {
                  const pnl = p.currentValueUsd - p.depositValueUsd;
                  const pnlPct = p.depositValueUsd > 0 ? (pnl / p.depositValueUsd) * 100 : 0;
                  const positive = pnl >= 0;

                  return (
                    <Link key={p.id} href={`/vault/kamino/${p.vaultAddress}`}>
                      <Card hover className="animate-fade-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}>
                        <div className="flex items-center justify-between px-3.5 pt-3.5 pb-3 border-b-thin">
                          <div className="flex items-center gap-2">
                            <TokenPairIcons tokenA={p.tokenA} tokenB={p.tokenB} size="sm" />
                            <span className="font-ibm-plex-sans text-sm font-medium text-[#11274d]">
                              {p.tokenA.symbol}/{p.tokenB.symbol}
                            </span>
                          </div>
                          <span className="data-sm text-[#0fa87a]">{formatPercent(p.apy)} APY</span>
                        </div>
                        <CardFooter className="flex items-center justify-between">
                          <span className="font-ibm-plex-sans text-xs text-[#6a7282]">
                            {formatUsd(p.currentValueUsd)}
                          </span>
                          <span className={`font-ibm-plex-sans text-xs font-medium ${positive ? 'text-[#0fa87a]' : 'text-[#ef4444]'}`}>
                            {positive ? '+' : ''}{formatPercent(pnlPct)}
                          </span>
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-sm text-[#6a7282] mb-3">No active positions yet.</p>
                <Link href="/vault/kamino/explore">
                  <Button variant="primary" size="sm">Explore Vaults</Button>
                </Link>
              </Card>
            )}
          </section>
        )}

        {/* ── Protocol Stats ────────────────────────────────────── */}
        {vaults.length > 0 && (
          <section>
            <h2 className="label-section-light mb-3">Protocol Stats</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Vaults', value: vaults.length.toString() },
                { label: 'Combined TVL', value: formatCompact(vaults.reduce((s, v) => s + v.tvl, 0)) },
                { label: 'Highest APY', value: formatPercent(Math.max(...vaults.map(v => v.apy))) },
                { label: '24h Volume', value: formatCompact(vaults.reduce((s, v) => s + v.volume24h, 0)) },
              ].map((stat) => (
                <Card key={stat.label} className="p-4">
                  <p className="label-section-light mb-1">{stat.label}</p>
                  <p className="data-md text-[#11274d]">{stat.value}</p>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
