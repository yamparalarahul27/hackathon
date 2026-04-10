'use client';

import { StatusDot } from '../ui/StatusDot';

/** Asgard-style bottom bar — darkest layer */
export function BottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[#cbd5e1] h-9">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StatusDot variant="live" />
            <span className="font-ibm-plex-sans text-xs text-[#6a7282]">Live</span>
          </div>
          <span className="font-mono text-xs text-[#6a7282]">SOL $178.50</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-ibm-plex-sans text-xs text-[#94a3b8]">Design & Engineered by Yamparala Rahul</span>
        </div>
      </div>
    </div>
  );
}
