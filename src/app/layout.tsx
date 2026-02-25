import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Dope Wars — Play the Classic Drug Trading Game Online Free',
    template: '%s | Dope Wars',
  },
  description:
    'Play Dope Wars online free — the original 1984 drug dealing game remade for the web. Buy low, sell high, survive 30 days in New York. No download required.',
  keywords: ['dope wars', 'dope war game', 'drug games', 'video game dealer', 'original dope wars', 'drug trading game', 'dope wars online', 'dope wars remake'],
  openGraph: {
    title: 'Dope Wars — Play the Classic Drug Trading Game Online Free',
    description:
      'The original 1984 drug dealing game, remade for the web. Trade drugs, dodge cops, survive 30 days on the streets of New York.',
    siteName: 'Dope Wars',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dope Wars — Play the Classic Drug Trading Game Online Free',
    description:
      'The original 1984 drug dealing game, remade for the web. Buy low, sell high, survive 30 days.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: 'PqXOvVj9kABgNqIho7NwHwifQnYvHF4KQ4cSGdCQPUg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pixelFont.variable} ${monoFont.variable} antialiased bg-black`}>
        <ThemeSync />
        <div className="app-viewport">
          <div className="crt-overlay" />
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
