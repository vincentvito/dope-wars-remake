import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono, Inter } from "next/font/google";
import { ThemeSync } from "@/components/ThemeSync";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const modernFont = Inter({
  subsets: ["latin"],
  variable: "--font-modern",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Dope Wars — The Classic Drug Trading Game',
    template: '%s',
  },
  description:
    'Buy low, sell high, and survive 30 days on the streets of New York. A modern remake of the classic 1984 game by John E. Dell.',
  openGraph: {
    title: 'Dope Wars — The Classic Drug Trading Game',
    description:
      'Buy low, sell high, and survive 30 days on the streets of New York. A modern remake of the classic 1984 game.',
    siteName: 'Dope Wars',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Dope Wars — The Classic Drug Trading Game',
    description:
      'Buy low, sell high, and survive 30 days on the streets of New York.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pixelFont.variable} ${monoFont.variable} ${modernFont.variable} antialiased bg-black`}>
        <ThemeSync />
        <div className="app-viewport">
          <div className="crt-overlay" />
          {children}
        </div>
      </body>
    </html>
  );
}
