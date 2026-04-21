'use client';

import { ArrowRight, LayoutDashboard, Radio } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 gradient-frost-hero relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/logo.svg" alt="DeFi Triangle" width={40} height={40} />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight font-light" style={{ fontFamily: "'Geist Pixel Square', 'Geist Mono', monospace" }}>
            DeFi Triangle
          </h1>

          <p className="font-ibm-plex-sans text-sm sm:text-base lg:text-lg text-white/75 max-w-lg mx-auto leading-relaxed">
            Your DeFi execution and exposure layer.
          </p>

          <p className="font-ibm-plex-sans text-xs text-white/50">
            Building in public for Colosseum Frontier Hackathon
          </p>

          <div className="rounded-sm border border-white/25 bg-white/10 backdrop-blur px-5 py-5 text-left max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Radio size={14} className="text-[#7ee5c6]" />
              <p className="text-[11px] tracking-[0.14em] text-white/85 font-ibm-plex-sans">
                BIRDEYE PULSE (NEW)
              </p>
            </div>
            <p className="font-ibm-plex-sans text-sm text-white/80 mb-4">
              Discover movers. Validate token safety.
            </p>
            <Link
              href="/cockpit/market"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-sm text-sm font-ibm-plex-sans font-medium bg-white text-[#11274d] hover:bg-white/90 active:scale-[0.97] transition-all duration-200"
            >
              <LayoutDashboard size={14} />
              Open Market Pulse
            </Link>
          </div>

          <p className="font-ibm-plex-sans text-[11px] text-white/50 pt-1">
            Building in public for Colosseum Frontier Hackathon
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-xl mx-auto">
            <div className="rounded-sm border border-white/20 bg-white/10 px-4 py-3 text-left">
              <p className="text-sm text-white font-ibm-plex-sans">Yamparala Rahul</p>
              <p className="text-xs text-white/70 font-ibm-plex-sans">Engineer & Builder</p>
              <a
                href="https://x.com/yamparalarahul1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white mt-2 font-ibm-plex-sans"
              >
                @yamparalarahul1 <ArrowRight size={10} />
              </a>
            </div>
            <div className="rounded-sm border border-white/20 bg-white/10 px-4 py-3 text-left">
              <p className="text-sm text-white font-ibm-plex-sans">Release Log</p>
              <p className="text-xs text-white/70 font-ibm-plex-sans">Weekly updates + shipped work</p>
              <Link
                href="/log"
                className="inline-flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white mt-2 font-ibm-plex-sans"
              >
                View Release Log <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
