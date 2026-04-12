'use client';

import { use } from 'react';
import { Card } from '@/components/ui/Card';
import { BarChart3 } from 'lucide-react';

interface Props {
  params: Promise<{ protocol: string }>;
}

export default function DexProtocolPage({ params }: Props) {
  const { protocol } = use(params);

  // TODO: Port full Deriverse analytics from heritage branch
  // This includes: trade history, PnL cards, drawdown, time-based performance
  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <h2 className="font-display font-bold text-xl text-[#11274d] capitalize">{protocol} Analytics</h2>
          <p className="text-sm text-[#6a7282] mt-1">Trade analytics and performance tracking</p>
        </div>

        <Card className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-xl bg-[#3B7DDD]/10 flex items-center justify-center">
            <BarChart3 size={28} className="text-[#3B7DDD]" />
          </div>
          <h3 className="font-ibm-plex-sans font-semibold text-lg text-[#11274d]">
            {protocol.charAt(0).toUpperCase() + protocol.slice(1)} DEX Analytics
          </h3>
          <p className="text-sm text-[#6a7282] max-w-md mx-auto">
            Full trade history, PnL analysis, drawdown charts, and time-based performance tracking.
            Connect your wallet to view your {protocol} trading activity.
          </p>
          <p className="text-xs text-[#94a3b8] font-ibm-plex-sans">
            Powered by Helius RPC + {protocol.charAt(0).toUpperCase() + protocol.slice(1)} SDK
          </p>
        </Card>
      </div>
    </div>
  );
}
