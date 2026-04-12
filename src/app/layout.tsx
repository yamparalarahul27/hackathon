import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeFi Cockpit — Real-Time DeFi Intelligence",
  description: "Real-time DeFi intelligence powered by Solana. Live vault data, token prices, and portfolio analytics.",
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f1f5f9] text-[#11274d]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
