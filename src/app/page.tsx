import Link from 'next/link';
import { HomeClient } from '@/components/home/HomeClient';
import { JsonLd } from '@/components/seo/JsonLd';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function HomePage() {
  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-start pt-[6vh] overflow-hidden">
      {/* GIF Background */}
      <img
        src="/sprites/landing/landing-bg.gif"
        alt="Pixel art city street scene from the Dope Wars drug trading game"
        className="absolute inset-0 w-full h-full object-cover object-bottom opacity-35 pointer-events-none"
        style={{ imageRendering: 'pixelated' as const }}
        draggable={false}
      />

      {/* Interactive content — heroContent is server-rendered in initial HTML */}
      <HomeClient
        heroContent={
          <div className="text-center space-y-4">
            <h1 className="font-pixel text-4xl text-crt-cyan text-glow-blue tracking-wider">
              DOPE WARS
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Buy low, sell high, and survive 30 days on the streets of New York.
              Pay off your debt to the loan shark and build your empire.
            </p>
          </div>
        }
      />

      {/* Footer — always pinned to bottom */}
      <div className="absolute bottom-4 z-10 text-[10px] text-muted-foreground/50 text-center space-y-1">
        <p>A modern remake of the original 1984 dope wars game by John E. Dell</p>
        <p>
          <Link href="/how-to-play" className="hover:text-muted-foreground transition-colors">How to Play</Link>
          {' · '}
          <Link href="/about" className="hover:text-muted-foreground transition-colors">About</Link>
          {' · '}
          <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
        </p>
      </div>

      {/* Structured Data */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: 'Dope Wars',
        alternateName: ['Dope Wars Remake', 'Dope War Game'],
        description: 'A modern web remake of the classic 1984 drug trading game by John E. Dell. Buy low, sell high, survive 30 days on the streets of New York.',
        url: appUrl,
        genre: ['Strategy', 'Simulation'],
        gamePlatform: ['Web Browser', 'Mobile Web'],
        applicationCategory: 'Game',
        operatingSystem: 'Any',
        offers: [
          {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Free classic mode',
          },
          {
            '@type': 'Offer',
            price: '7.99',
            priceCurrency: 'USD',
            description: 'Pro mode with extended campaigns',
          },
        ],
        author: {
          '@type': 'Organization',
          name: 'Dope Wars',
          url: appUrl,
        },
        inLanguage: 'en',
        isAccessibleForFree: true,
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Dope Wars',
        url: appUrl,
      }} />
    </main>
  );
}
