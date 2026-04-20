'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [count, setCount] = useState<number | null>(null);
  const [clicked, setClicked] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('defi-triangle-interested') === '1'
  );

  useEffect(() => {
    fetch('/api/interested')
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0));
  }, []);

  const handleInterested = useCallback(async () => {
    if (clicked) return;
    setClicked(true);
    localStorage.setItem('defi-triangle-interested', '1');

    try {
      const res = await fetch('/api/interested', { method: 'POST' });
      const data = await res.json();
      if (typeof data.count === 'number') setCount(data.count);
      else setCount((prev) => (prev != null ? prev + 1 : 1));
    } catch {
      setCount((prev) => (prev != null ? prev + 1 : 1));
    }
  }, [clicked]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 gradient-frost-hero relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/logo.svg" alt="DeFi Triangle" width={40} height={40} />
          </div>

          <h1 className="font-satoshi font-light text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
            DeFi Triangle
          </h1>

          <p className="font-ibm-plex-sans text-sm sm:text-base lg:text-lg text-white/75 max-w-lg mx-auto leading-relaxed">
            Real-time Solana yield intelligence. Vaults, swaps, analytics, and privacy — powered by real on-chain data, not mocks.
          </p>

          <p className="font-ibm-plex-sans text-xs text-white/50">
            Building in public for Colosseum Frontier Hackathon
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 pt-4">
            {!clicked ? (
              <>
                <div className="flex flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleInterested}
                    className="group relative flex items-center gap-2 h-11 px-6 rounded-sm text-sm font-ibm-plex-sans font-medium bg-white text-[#11274d] hover:bg-white/90 active:scale-[0.97] transition-all duration-200"
                  >
                    <Sparkles size={14} />
                    Interested?
                  </button>
                  <Link
                    href="/log"
                    className="flex items-center gap-2 h-11 px-6 rounded-sm text-sm font-ibm-plex-sans font-medium text-white border border-white/30 hover:bg-white/10 transition-colors"
                  >
                    <BookOpen size={14} />
                    View Log
                  </Link>
                </div>
                {count != null && count > 0 && (
                  <p className="font-ibm-plex-sans text-xs text-white/50">
                    {count.toLocaleString()} {count === 1 ? 'person has' : 'people have'} already shown interest
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="bg-white/10 border border-white/20 rounded-sm px-5 py-3 max-w-sm text-center">
                  <p className="font-ibm-plex-sans text-sm text-white/85">
                    <Sparkles size={14} className="inline mr-1.5 text-[#7ee5c6]" />
                    Thanks! You are <span className="font-mono font-semibold text-white">#{count?.toLocaleString() ?? '...'}</span> to show interest.
                  </p>
                </div>
                <Link
                  href="/log"
                  className="flex items-center gap-2 h-11 px-6 rounded-sm text-sm font-ibm-plex-sans font-medium text-white border border-white/30 hover:bg-white/10 transition-colors"
                >
                  <BookOpen size={14} />
                  View Log
                </Link>
              </>
            )}
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
