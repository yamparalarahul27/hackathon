import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeFi Triangle — Real-Time DeFi Intelligence",
  description: "Your DeFi execution and exposure app. Vaults, swaps, analytics, and privacy — powered by real on-chain data on Solana.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "DeFi Triangle",
    description: "Your DeFi execution and exposure app.",
    siteName: "DeFi Triangle",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "DeFi Triangle" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeFi Triangle",
    description: "Your DeFi execution and exposure app.",
    images: ["/api/og"],
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
