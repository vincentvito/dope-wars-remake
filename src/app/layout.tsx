import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import { AcquisitionAnalytics } from '@/components/analytics/AcquisitionAnalytics';
import { publisher, siteUrl } from '@/lib/site';
import { GamePersistence } from "@/components/game/GamePersistence";
import { ThemeSync } from "@/components/ThemeSync";
import { JsonLd } from "@/components/seo/JsonLd";
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

const appUrl = siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Dope Wars Online — Play Free in Your Browser',
    template: '%s | Dope Wars',
  },
  description:
    'Play Dope Wars online free. Trade across New York in a 30-day Classic game, save locally, and post your score. No download or account required for Classic.',
  openGraph: {
    title: 'Dope Wars Online — Play Free in Your Browser',
    description:
      'An independent browser remake of Drug Wars. Free Classic play, local saves and guest scores. No download required.',
    siteName: 'Play Dope Wars',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dope Wars Online — Play Free in Your Browser',
    description:
      'An independent browser remake of Drug Wars. Free Classic play, local saves and guest scores. No download required.',
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
        <GamePersistence />
        <div className="app-viewport">
          <div className="crt-overlay" />
          {children}
        </div>
        <JsonLd data={{ '@context': 'https://schema.org', ...publisher }} />
        <AcquisitionAnalytics enabled={process.env.VERCEL === '1'} customEventsEnabled={process.env.NEXT_PUBLIC_FUNNEL_ANALYTICS === '1'} />
      </body>
    </html>
  );
}
