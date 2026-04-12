'use client';

import { use } from 'react';
import { DexAnalytics } from '@/components/features/dex/DexAnalytics';
import type { DexTrade } from '@/lib/dex-types';

interface Props {
  params: Promise<{ protocol: string }>;
}

// Protocol display names
const PROTOCOL_NAMES: Record<string, string> = {
  deriverse: 'Deriverse',
  jupiter: 'Jupiter',
  raydium: 'Raydium',
};

export default function DexProtocolPage({ params }: Props) {
  const { protocol } = use(params);
  const name = PROTOCOL_NAMES[protocol] ?? protocol.charAt(0).toUpperCase() + protocol.slice(1);

  // TODO: Fetch real trades from protocol-specific service
  // For Deriverse: use DeriverseTradeService + Helius RPC
  // For now: empty array (all values show as 0)
  const trades: DexTrade[] = [];

  return <DexAnalytics protocolName={name} trades={trades} />;
}
