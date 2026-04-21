'use client';

import { useState, useMemo, useCallback } from 'react';
import { DexFilterBar } from './DexFilterBar';
import { DexPnLCard } from './DexPnLCard';
import { DexPerformanceSection } from './DexPerformanceSection';
import { DexBehaviorSection } from './DexBehaviorSection';
import { DexFinancesSection } from './DexFinancesSection';
import { DexTradeTable } from './DexTradeTable';
import type { DexTrade, FilterType } from '@/lib/dex-types';
import { isToday, isYesterday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';

interface DexAnalyticsProps {
  /** Protocol display name */
  protocolName: string;
  /** All trades from this protocol */
  trades: DexTrade[];
  /** Loading state */
  loading?: boolean;
}

function filterByDate(trades: DexTrade[], filter: FilterType): DexTrade[] {
  switch (filter) {
    case 'Today': return trades.filter(t => isToday(t.closedAt));
    case 'Yesterday': return trades.filter(t => isYesterday(t.closedAt));
    case 'This Week': return trades.filter(t => isThisWeek(t.closedAt, { weekStartsOn: 1 }));
    case 'This Month': return trades.filter(t => isThisMonth(t.closedAt));
    case 'This Year': return trades.filter(t => isThisYear(t.closedAt));
    case 'All':
    default: return trades;
  }
}

/**
 * DexAnalytics — Protocol-agnostic DEX analytics dashboard.
 *
 * Accepts trades as a prop — works with Deriverse, Jupiter, or any DEX.
 * All values start at 0 when no trades are provided.
 */
export function DexAnalytics({ protocolName, trades, loading }: DexAnalyticsProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);

  const availablePairs = useMemo(() => {
    const symbols = new Set(trades.map(t => t.symbol));
    return Array.from(symbols).sort();
  }, [trades]);

  const filteredTrades = useMemo(() => {
    let result = filterByDate(trades, activeFilter);
    if (selectedPairs.length > 0) {
      result = result.filter(t => selectedPairs.includes(t.symbol));
    }
    return result;
  }, [trades, activeFilter, selectedPairs]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[#6a7282] font-ibm-plex-sans">Loading {protocolName} data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-satoshi font-bold text-xl text-[#11274d]">{protocolName} Analytics</h2>
          <p className="text-sm text-[#6a7282] mt-1">Trade analytics and performance tracking</p>
        </div>

        {/* Filters */}
        <DexFilterBar
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          availablePairs={availablePairs}
          selectedPairs={selectedPairs}
          onSelectedPairsChange={setSelectedPairs}
        />

        {/* PnL */}
        <DexPnLCard trades={filteredTrades} activeFilter={activeFilter} />

        {/* Performance */}
        <DexPerformanceSection trades={filteredTrades} />

        {/* Behavior */}
        <DexBehaviorSection trades={filteredTrades} />

        {/* Finances */}
        <DexFinancesSection trades={filteredTrades} />

        {/* Trade Table */}
        <DexTradeTable trades={filteredTrades} />
    </div>
  );
}
