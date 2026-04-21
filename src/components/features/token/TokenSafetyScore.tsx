'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StateNotice } from '@/components/ui/StateNotice';
import {
  BirdeyeUpstreamError,
  fetchTokenSecurity,
  scoreTokenSecurity,
  type SecurityScore,
  type SecurityLevel,
} from '@/services/BirdeyeService';

interface Props {
  mint: string;
}

const LEVEL_CONFIG: Record<SecurityLevel, { icon: typeof ShieldCheck; color: string; bg: string; border: string; label: string }> = {
  safe: { icon: ShieldCheck, color: 'text-[#059669]', bg: 'bg-[#ecfdf5]', border: 'border-[#a7f3d0]', label: 'Safe' },
  caution: { icon: Shield, color: 'text-[#d97706]', bg: 'bg-[#fffbeb]', border: 'border-[#fde68a]', label: 'Caution' },
  danger: { icon: ShieldAlert, color: 'text-[#dc2626]', bg: 'bg-[#fef2f2]', border: 'border-[#fecaca]', label: 'Risk' },
};

export const TokenSafetyScore = React.memo(function TokenSafetyScore({ mint }: Props) {
  const [score, setScore] = useState<SecurityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<'rate_limited' | 'upstream_error' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showStale, setShowStale] = useState(false);
  const [manualRefreshToken, setManualRefreshToken] = useState(0);
  const scoreRef = useRef<SecurityScore | null>(null);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    setScore(null);
    setLoading(true);
    setErrorState(null);
    setLastUpdated(null);
    setShowStale(false);
  }, [mint]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorState(null);

    (async () => {
      try {
        const sec = await fetchTokenSecurity(mint);
        if (cancelled) return;
        const next = scoreTokenSecurity(sec);
        setScore(next);
        setLastUpdated(new Date());
        setShowStale(false);
      } catch (err) {
        if (cancelled) return;
        const nextError = classifySafetyError(err);
        if (scoreRef.current) {
          setShowStale(true);
        } else {
          setErrorState(nextError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [manualRefreshToken, mint]);

  function handleRefresh() {
    setManualRefreshToken((value) => value + 1);
  }

  if (loading) {
    return (
      <Card className="p-4">
        <p className="label-section-light mb-2">Safety Score</p>
        <StateNotice severity="info" message="Calculating token safety..." />
      </Card>
    );
  }

  if (!score && errorState) {
    return (
      <Card className="p-4">
        <p className="label-section-light mb-3">Safety Score</p>
        <StateNotice
          severity={errorState === 'rate_limited' ? 'warning' : 'error'}
          message={
            errorState === 'rate_limited'
              ? 'Rate limit reached (429). Safety check is temporarily paused.'
              : 'Token safety is temporarily unavailable. Please try again.'
          }
          actionLabel="Retry"
          onAction={handleRefresh}
        />
        <p className="text-[9px] text-[#94a3b8] font-ibm-plex-sans mt-3">
          Powered by Birdeye Data
        </p>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className="p-4">
        <p className="label-section-light mb-3">Safety Score</p>
        <StateNotice
          severity="info"
          message="No safety profile is available for this token yet."
          lastUpdated={lastUpdated}
        />
        <p className="text-[9px] text-[#94a3b8] font-ibm-plex-sans mt-3">
          Powered by Birdeye Data
        </p>
      </Card>
    );
  }

  const config = LEVEL_CONFIG[score.level];
  const Icon = config.icon;

  return (
    <Card className="p-4">
      <p className="label-section-light mb-3">Safety Score</p>

      {showStale ? (
        <div className="mb-3">
          <StateNotice
            severity="warning"
            message="Showing last known safety score while fresh data loads."
            actionLabel="Refresh"
            onAction={handleRefresh}
            lastUpdated={lastUpdated}
            showStaleBadge
          />
        </div>
      ) : null}

      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border ${config.bg} ${config.border} mb-3`}>
        <Icon size={20} className={config.color} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold font-ibm-plex-sans ${config.color}`}>
              {config.label}
            </span>
            <span className="data-sm text-[#11274d]">{score.score}/100</span>
          </div>
          <div className="w-full h-1.5 bg-white/60 rounded-full mt-1.5">
            <div
              className={`h-full rounded-full transition-all ${
                score.level === 'safe' ? 'bg-[#059669]' :
                score.level === 'caution' ? 'bg-[#d97706]' : 'bg-[#dc2626]'
              }`}
              style={{ width: `${score.score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {score.checks.map((check) => (
          <div key={check.label} className="flex items-start gap-2">
            <span className={`mt-0.5 text-xs ${check.passed ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
              {check.passed ? '✓' : '✗'}
            </span>
            <div className="min-w-0">
              <p className={`text-xs font-ibm-plex-sans ${check.passed ? 'text-[#11274d]' : 'text-[#dc2626]'}`}>
                {check.label}
              </p>
              <p className="text-[10px] text-[#94a3b8] font-ibm-plex-sans">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-[#94a3b8] font-ibm-plex-sans mt-3">
        Powered by Birdeye Data
      </p>
    </Card>
  );
});

function classifySafetyError(error: unknown): 'rate_limited' | 'upstream_error' {
  if (error instanceof BirdeyeUpstreamError) {
    return error.upstreamStatus === 429 ? 'rate_limited' : 'upstream_error';
  }
  if (error instanceof Error && /\b429\b/.test(error.message)) {
    return 'rate_limited';
  }
  return 'upstream_error';
}
