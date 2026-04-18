import type { Metadata } from "next";
// Clerk disabled — keep import commented for easy re-enable later.
// import { ClerkProvider } from "@clerk/nextjs";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeFi Triangle — Real-Time DeFi Intelligence",
  description: "Real-time Solana DeFi intelligence. Vaults, swaps, analytics, and privacy — powered by real on-chain data.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ClerkProvider commented out — re-wrap <html>…</html> when re-enabling.
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f1f5f9] text-[#11274d]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
