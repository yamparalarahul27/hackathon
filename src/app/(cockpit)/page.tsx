'use client';

export default function DashboardPage() {
  return (
    <div className="flex-1 bg-[#f1f5f9] -mx-6 -mt-6 px-4.5 lg:px-10 pt-6 pb-16 min-h-screen">
      <div
        className="gradient-frost-hero -mt-6 mb-6 pt-16 pb-8 border-b border-white/20"
        style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          paddingLeft: 'calc(50vw - 50%)',
          paddingRight: 'calc(50vw - 50%)',
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <h1 className="font-satoshi font-light text-2xl lg:text-4xl text-white tracking-tight mb-1">
            DeFi Cockpit
          </h1>
          <p className="font-ibm-plex-sans text-xs lg:text-sm text-white/70">
            Real-time Solana yield intelligence — Kamino vaults, DEX analytics, and swaps in one view.
          </p>
        </div>
      </div>
    </div>
  );
}
