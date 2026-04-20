'use client';

import { useEffect, useState } from 'react';
import { Trophy, Loader2, Medal } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  isTorqueConfigured,
  getLeaderboard,
  type LeaderboardEntry,
} from '@/services/TorqueService';

interface Props {
  incentiveId: string;
  configId: string;
  title?: string;
  limit?: number;
}

export function TorqueLeaderboard({
  incentiveId,
  configId,
  title = 'Leaderboard',
  limit = 10,
}: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(() => isTorqueConfigured());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTorqueConfigured()) {
      // loading already initializes as false when Torque is not configured
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await getLeaderboard(incentiveId, configId, limit);
        if (!cancelled) setEntries(data.results ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [incentiveId, configId, limit]);

  if (!isTorqueConfigured()) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={14} className="text-[#f59e0b]" />
        <p className="label-section-light">{title}</p>
        <span className="text-[9px] text-[#94a3b8] font-ibm-plex-sans">via Torque</span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[#94a3b8] py-3">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs font-ibm-plex-sans">Loading…</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-[#991b1b] font-ibm-plex-sans py-2">{error}</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="text-xs text-[#94a3b8] font-ibm-plex-sans py-3">
          No activity yet. Be the first!
        </p>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-1">
          {entries.map((entry, i) => (
            <div
              key={entry.walletAddress}
              className="flex items-center gap-3 py-1.5 px-2 rounded-sm hover:bg-[#f8fafc] transition-colors"
            >
              <RankBadge rank={i + 1} />
              <span className="font-mono text-xs text-[#11274d] truncate flex-1">
                {short(entry.walletAddress)}
              </span>
              <span className="data-sm text-[#11274d]">
                {formatMetric(entry.metricValue)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors = ['text-[#f59e0b]', 'text-[#94a3b8]', 'text-[#cd7f32]'];
    return <Medal size={14} className={colors[rank - 1]} />;
  }
  return (
    <span className="w-3.5 text-center text-[10px] font-mono text-[#94a3b8]">
      {rank}
    </span>
  );
}

function short(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatMetric(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
