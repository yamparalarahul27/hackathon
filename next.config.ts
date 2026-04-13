import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude heavy Solana SDKs from server-side bundling — they're only
  // used client-side via dynamic imports in useKaminoVaults hook.
  serverExternalPackages: [
    "@kamino-finance/klend-sdk",
    "@kamino-finance/kliquidity-sdk",
    "@solana/web3.js",
  ],

  images: {
    // Allow token icons from CDN sources
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "coin-images.coingecko.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
};

export default nextConfig;
