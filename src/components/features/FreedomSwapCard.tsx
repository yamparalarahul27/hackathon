'use client';

import { Shield, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PUSD_MINT } from '@/lib/constants';

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export function FreedomSwapCard() {
  if (!PUSD_MINT) return null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-r from-[#0d2137] to-[#19549b] px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#7ee5c6]" />
              <h3 className="font-satoshi font-medium text-sm text-white">
                Freedom Swap
              </h3>
            </div>
            <p className="font-ibm-plex-sans text-xs text-white/70 max-w-xs leading-relaxed">
              Upgrade your stablecoins. PUSD cannot be frozen, blacklisted, or paused by anyone.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#7ee5c6]/15 rounded-sm border border-[#7ee5c6]/30">
            <ShieldCheck size={10} className="text-[#7ee5c6]" />
            <span className="text-[9px] uppercase tracking-wider text-[#7ee5c6] font-ibm-plex-sans font-medium">
              Non-freezable
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full bg-[#2775ca] flex items-center justify-center text-white text-[10px] font-bold">$</div>
            <div>
              <p className="text-xs font-semibold text-[#11274d] font-ibm-plex-sans">USDC</p>
              <p className="text-[9px] text-[#94a3b8] font-ibm-plex-sans">Freezable</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-[#6a7282]" />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full bg-[#059669] flex items-center justify-center text-white text-[10px] font-bold">P</div>
            <div>
              <p className="text-xs font-semibold text-[#11274d] font-ibm-plex-sans">PUSD</p>
              <p className="text-[9px] text-[#059669] font-ibm-plex-sans">Non-freezable</p>
            </div>
          </div>
        </div>

        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-sm p-2.5 space-y-1">
          <p className="text-[10px] text-[#6a7282] font-ibm-plex-sans font-medium">Why switch?</p>
          <ul className="space-y-0.5">
            <li className="text-[10px] text-[#11274d] font-ibm-plex-sans flex items-start gap-1.5">
              <span className="text-[#059669] mt-0.5">✓</span>
              No freeze authority — your tokens can never be locked
            </li>
            <li className="text-[10px] text-[#11274d] font-ibm-plex-sans flex items-start gap-1.5">
              <span className="text-[#059669] mt-0.5">✓</span>
              No blacklist — no address can be blocked
            </li>
            <li className="text-[10px] text-[#11274d] font-ibm-plex-sans flex items-start gap-1.5">
              <span className="text-[#059669] mt-0.5">✓</span>
              USD-pegged — same value, sovereign ownership
            </li>
          </ul>
        </div>

        <Link href={`/cockpit/swap?inputMint=${USDC_MINT}&outputMint=${PUSD_MINT}`}>
          <Button className="w-full" size="sm">
            Swap USDC → PUSD
          </Button>
        </Link>
      </div>
    </Card>
  );
}
