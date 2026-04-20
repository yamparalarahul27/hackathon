'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Shield, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const sec = await fetchTokenSecurity(mint);
        if (cancelled) return;
        setScore(scoreTokenSecurity(sec));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to fetch safety data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [mint]);

  // When the proxy returns a non-OK (e.g. 503 no key configured), hide the card
  // rather than showing a scary error on a public page.
  if (error) return null;

  if (loading) {
    return (
      <Card className="p-4">
        <p className="label-section-light mb-2">Safety Score</p>
        <div className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs font-ibm-plex-sans">Analyzing via Birdeye…</span>
        </div>
      </Card>
    );
  }

  if (!score) return null;

  const config = LEVEL_CONFIG[score.level];
  const Icon = config.icon;

  return (
    <Card className="p-4">
      <p className="label-section-light mb-3">Safety Score</p>

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
