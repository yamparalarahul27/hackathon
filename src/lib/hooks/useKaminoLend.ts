'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LendingMarketSnapshot } from '../lend-types';

interface UseKaminoLendReturn {
  snapshot: LendingMarketSnapshot | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

const REFRESH_INTERVAL_MS = 60_000;
const CACHE_TTL_MS = 30_000;

let cached: { timestamp: number; payload: LendingMarketSnapshot } | null = null;
let inFlight: Promise<LendingMarketSnapshot> | null = null;

async function fetchSnapshot(): Promise<LendingMarketSnapshot> {
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) return cached.payload;

  if (!inFlight) {
    inFlight = fetch('/api/kamino/lend', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? 'Unable to load lending market');
        return body as LendingMarketSnapshot;
      })
      .finally(() => { inFlight = null; });
  }

  const payload = await inFlight;
  cached = { timestamp: now, payload };
  return payload;
}

export function useKaminoLend(): UseKaminoLendReturn {
  const [snapshot, setSnapshot] = useState<LendingMarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchSnapshot();
      setSnapshot(payload);
      setLastUpdated(new Date(payload.lastUpdated));
      setError(null);
    } catch (err) {
      console.error('[useKaminoLend] Failed:', err);
      setError(err instanceof Error ? err.message : 'Unable to load lending market');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch + polling interval
    void refresh();
    intervalRef.current = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  return useMemo(
    () => ({ snapshot, loading, error, lastUpdated, refresh }),
    [snapshot, loading, error, lastUpdated, refresh]
  );
}
