'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DexTrade } from '@/lib/dex-types';

const ITEMS_PER_PAGE = 20;

interface DexTradeTableProps {
  trades: DexTrade[];
}

export const DexTradeTable = React.memo(function DexTradeTable({ trades }: DexTradeTableProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return trades.slice(start, start + ITEMS_PER_PAGE);
  }, [trades, page]);

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (trades.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="label-section-light">Trades</h3>
        <Card className="p-8 text-center">
          <p className="text-sm text-[#94a3b8] font-ibm-plex-sans">
            No trades found. Connect wallet and fetch trades to see your analytics.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="label-section-light">Trades</h3>
        <span className="text-xs text-[#6a7282] font-ibm-plex-sans">{trades.length} trades</span>
      </div>

      {/* Desktop Table */}
      <Card className="hidden sm:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="text-left py-2.5 px-3 label-section-light">Date</th>
                <th className="text-left py-2.5 px-3 label-section-light">Pair</th>
                <th className="text-left py-2.5 px-3 label-section-light">Side</th>
                <th className="text-left py-2.5 px-3 label-section-light hidden md:table-cell">Type</th>
                <th className="text-right py-2.5 px-3 label-section-light">Price</th>
                <th className="text-right py-2.5 px-3 label-section-light">PnL</th>
                <th className="text-right py-2.5 px-3 label-section-light hidden lg:table-cell">Fee</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(trade => (
                <tr key={trade.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="text-xs text-[#11274d] font-ibm-plex-sans">{formatDate(trade.closedAt)}</div>
                    <div className="text-[10px] text-[#94a3b8]">{formatTime(trade.closedAt)}</div>
                  </td>
                  <td className="py-2.5 px-3 text-sm font-medium text-[#11274d] font-ibm-plex-sans">{trade.symbol}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                      trade.side === 'long' || trade.side === 'buy'
                        ? 'bg-[#059669]/10 text-[#059669]'
                        : 'bg-[#EF4444]/10 text-[#EF4444]'
                    }`}>
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[#6a7282] font-ibm-plex-sans hidden md:table-cell capitalize">
                    {trade.orderType.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-right data-sm text-[#11274d]">
                    ${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2.5 px-3 text-right data-sm ${trade.pnl >= 0 ? 'text-[#059669]' : 'text-[#EF4444]'}`}>
                    {trade.pnl >= 0 ? '+' : '-'}${Math.abs(trade.pnl).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right data-sm text-[#6a7282] hidden lg:table-cell">
                    ${trade.fee.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card List */}
      <div className="sm:hidden space-y-2">
        {paginated.map(trade => (
          <Card key={trade.id} className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#11274d] font-ibm-plex-sans">{trade.symbol}</span>
                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                  trade.side === 'long' || trade.side === 'buy'
                    ? 'bg-[#059669]/10 text-[#059669]'
                    : 'bg-[#EF4444]/10 text-[#EF4444]'
                }`}>
                  {trade.side.toUpperCase()}
                </span>
              </div>
              <span className={`data-sm ${trade.pnl >= 0 ? 'text-[#059669]' : 'text-[#EF4444]'}`}>
                {trade.pnl >= 0 ? '+' : '-'}${Math.abs(trade.pnl).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
              <span>{formatDate(trade.closedAt)} {formatTime(trade.closedAt)}</span>
              <span>${trade.price.toFixed(2)} · {trade.orderType}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded border border-[#cbd5e1] bg-white hover:bg-[#e2e8f0] disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-[#6a7282] font-ibm-plex-sans">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded border border-[#cbd5e1] bg-white hover:bg-[#e2e8f0] disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
});
