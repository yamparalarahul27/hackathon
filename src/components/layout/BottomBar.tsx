'use client';

import { StatusDot } from '../ui/StatusDot';

/** Asgard-style bottom bar — darkest layer */
export function BottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#010a13] border-t border-white/10 h-9">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StatusDot variant="live" />
            <span className="font-ibm-plex-sans text-xs text-white/60">Live</span>
          </div>
          <span className="font-mono text-xs text-white/40">SOL $178.50</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-ibm-plex-sans text-xs text-white/30">Powered by Kamino + Jupiter</span>
        </div>
      </div>
    </div>
  );
}
