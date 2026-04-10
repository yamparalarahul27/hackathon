'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { KaminoVaultPosition } from '@/lib/lp-types';
import { calculateYieldBreakdown } from '@/lib/mockKaminoData';
import { formatUsd, formatPercent } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#3B7DDD', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

const tooltipStyle = {
  contentStyle: { background: '#1A2332', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 12 },
  labelStyle: { color: '#9CA3AF' },
};

interface Props {
  positions: KaminoVaultPosition[];
}

export function YieldAnalytics({ positions }: Props) {
  const yieldBreakdown = useMemo(() => calculateYieldBreakdown(positions), [positions]);

  const barData = useMemo(() => positions.map(p => ({
    name: `${p.tokenA.symbol}/${p.tokenB.symbol}`,
    yield: p.yieldEarnedUsd,
    il: Math.abs(p.impermanentLossUsd),
  })), [positions]);

  const pieData = useMemo(() => yieldBreakdown.map(y => ({
    name: y.vaultName,
    value: Math.max(0, y.yieldUsd),
  })), [yieldBreakdown]);

  const totalYield = positions.reduce((s, p) => s + p.yieldEarnedUsd, 0);
  const totalIL = positions.reduce((s, p) => s + p.impermanentLossUsd, 0);
  const netReturn = totalYield + totalIL;

  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d]">Yield Analytics</h2>
          <p className="text-sm text-[#6a7282] mt-1">Performance breakdown across vaults</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="label-section-light mb-1">Total Yield</p>
            <p className="data-lg text-[#10B981]">+{formatUsd(totalYield)}</p>
          </Card>
          <Card className="p-4">
            <p className="label-section-light mb-1">Total IL</p>
            <p className="data-lg text-[#F59E0B]">{formatUsd(totalIL)}</p>
          </Card>
          <Card className="p-4">
            <p className="label-section-light mb-1">Net Return</p>
            <p className={`data-lg ${netReturn >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {netReturn >= 0 ? '+' : ''}{formatUsd(netReturn)}
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card className="p-4">
            <p className="label-section-light mb-4">Yield vs Impermanent Loss</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={2}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip {...tooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`]} />
                  <Bar dataKey="yield" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="il" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pie Chart */}
          <Card className="p-4">
            <p className="label-section-light mb-4">Yield Distribution</p>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Yield']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {yieldBreakdown.map((y, i) => (
                <div key={y.vaultAddress} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-[#6B7280]">{y.vaultName.split(' ')[0]} ({formatPercent(y.share)})</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Breakdown Table */}
        <Card className="p-4">
          <p className="label-section-light mb-3">Detailed Breakdown</p>
          {yieldBreakdown.map((y, i) => (
            <div key={y.vaultAddress} className="flex items-center justify-between py-3 border-b border-[#e2e8f0] last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-[#334155]">{y.vaultName}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="data-sm text-[#10B981]">+{formatUsd(y.yieldUsd)}</span>
                <span className="data-sm text-[#6B7280]">{formatPercent(y.yieldPercent)} return</span>
                <span className="data-sm text-[#4B5563] hidden sm:inline">{formatPercent(y.share)} of total</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
