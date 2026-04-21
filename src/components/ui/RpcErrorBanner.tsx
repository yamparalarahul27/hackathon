'use client';

import { AlertTriangle } from 'lucide-react';

interface RpcErrorBannerProps {
  message?: string;
}

export function RpcErrorBanner({ message }: RpcErrorBannerProps) {
  return (
    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-sm px-4 py-3 flex items-center gap-3">
      <AlertTriangle size={16} className="text-[#EF4444] flex-shrink-0" />
      <div>
        <p className="text-sm font-ibm-plex-sans font-medium text-[#991B1B]">
          RPC Error — Team is on it
        </p>
        {message && (
          <p className="text-xs font-ibm-plex-sans text-[#B91C1C] mt-0.5">{message}</p>
        )}
        <p className="text-[10px] font-ibm-plex-sans text-[#DC2626] mt-1">
          Showing cached data. Live data will resume shortly.
        </p>
      </div>
    </div>
  );
}
