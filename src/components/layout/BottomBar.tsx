'use client';

import { useState, useEffect } from 'react';
import { StatusDot } from '../ui/StatusDot';

const BINANCE_SOL_URL = 'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT';

export function BottomBar() {
  const [solPrice, setSolPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = () => {
      fetch(BINANCE_SOL_URL)
        .then(res => res.json())
        .then(data => {
          const price = parseFloat(data.price);
          if (price > 0) setSolPrice(price);
        })
        .catch(() => {}); // silent fail — shows "..." until next tick
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[#cbd5e1] h-9">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StatusDot variant="live" />
            <span className="font-ibm-plex-sans text-xs text-[#6a7282]">Live</span>
          </div>
          <span className="font-mono text-xs text-[#6a7282]">
            SOL {solPrice !== null ? `$${solPrice.toFixed(2)}` : '...'}
          </span>
        </div>
      </div>
    </div>
  );
}
