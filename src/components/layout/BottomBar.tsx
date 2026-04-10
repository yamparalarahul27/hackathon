'use client';

import { StatusDot } from '../ui/StatusDot';

/** Asgard-style bottom status bar */
export function BottomBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F18] border-t border-white/8 h-9">
      <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StatusDot variant="live" size="sm" />
            <span className="text-xs text-[#9CA3AF]">Live</span>
          </div>
          <span className="data-sm text-[#6B7280]">SOL $178.50</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#4B5563]">Powered by Kamino + Jupiter</span>
        </div>
      </div>
    </div>
  );
}
