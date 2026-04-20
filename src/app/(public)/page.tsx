'use client';

import { ArrowRight, BookOpen, LayoutDashboard } from 'lucide-react';
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

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 pt-4">
            <div className="flex flex-row items-center justify-center gap-3">
              <Link
                href="/cockpit/market"
                className="flex items-center gap-2 h-11 px-6 rounded-sm text-sm font-ibm-plex-sans font-medium bg-white text-[#11274d] hover:bg-white/90 active:scale-[0.97] transition-all duration-200"
              >
                <LayoutDashboard size={14} />
                Launch Cockpit
              </Link>
              <Link
                href="/log"
                className="flex items-center gap-2 h-11 px-6 rounded-sm text-sm font-ibm-plex-sans font-medium text-white border border-white/30 hover:bg-white/10 transition-colors"
              >
                <BookOpen size={14} />
                View Log
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle connect link */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <a
            href="https://x.com/yamparalarahul1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 font-ibm-plex-sans transition-colors"
          >
            Connect with the Engineer
            <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
