import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { COLORS } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "InvestorWeb",
  description: "Private web client for Investor portfolios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" data-theme="investor">
      <body className="antialiased" style={{ background: COLORS.bg, color: COLORS.text }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
