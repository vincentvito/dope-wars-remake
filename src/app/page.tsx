import Link from 'next/link';
import { MotionImage } from '@/components/game/MotionImage';
import { HomeClient } from '@/components/home/HomeClient';
import { JsonLd } from '@/components/seo/JsonLd';

import { siteUrl as appUrl, siteIds, publisherName } from '@/lib/site';
import { EditionFacts } from '@/components/seo/EditionFacts';

export default function HomePage() {
  return (
    <>
      <main className="relative min-h-[100dvh] bg-black flex flex-col items-center justify-start pt-8 pb-6 gap-8">
        {/* GIF Background */}
        <MotionImage
          src="/sprites/landing/landing-bg.gif"
          alt="Pixel art city street scene from the Dope Wars drug trading game"
          className="absolute inset-0 w-full h-full object-cover object-bottom opacity-35 pointer-events-none"
          style={{ imageRendering: 'pixelated' as const }}
          draggable={false}
          fetchPriority="high"
          decoding="async"
        />

        {/* Interactive content — heroContent is server-rendered in initial HTML */}
        <HomeClient
          heroContent={
            <div className="text-center space-y-4">
              <h1 className="font-pixel text-3xl text-crt-cyan text-glow-blue tracking-wider">
                DOPE WARS
                <span className="block text-xs mt-4 text-crt-green">PLAY FREE ONLINE</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Buy low, sell high, and survive 30 days on the streets of New York.
                Classic is free, with no download or account required.
              </p>
            </div>
          }
        />

        {/* Footer — always pinned to bottom */}
        <div className="relative mt-auto px-4 z-10 text-[10px] text-muted-foreground text-center space-y-1">
          <p>An independent browser remake, published by Play Dope Wars.</p>
          <p>
            <Link href="/how-to-play" className="hover:text-muted-foreground transition-colors">How to Play</Link>
            {' · '}
            <Link href="/blog" className="hover:text-muted-foreground transition-colors">Blog</Link>
            {' · '}
            <Link href="/about" className="hover:text-muted-foreground transition-colors">About</Link>
            {' · '}
            <Link href="/leaderboard" className="hover:text-muted-foreground transition-colors">Leaderboard</Link>
            {' · '}
            <Link href="/press" className="hover:underline">Press kit</Link>
            {' · '}
            <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
            {' · '}
            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
          </p>
        </div>
      </main>

      {/* Game details and guides */}
      <section className="bg-black text-muted-foreground px-6 py-16 max-w-2xl mx-auto space-y-8" aria-label="About Dope Wars">
        <h2 className="font-pixel text-sm text-crt-green text-glow-green">
          The Classic Drug Trading Game — Free Online
        </h2>
        <div className="text-sm leading-relaxed space-y-4">
          <p>
            Play Dope Wars is an independent browser remake of the Drug Wars / Dope Wars trading-game formula.
            Buy low, sell high, manage debt, and survive a 30-day Classic run. Play on desktop, Android,
            or iPhone through a modern browser; this is a web game, not a native app download.
          </p>
          <p>
            Start with $2,000 in cash and $5,000 in debt to a loan shark. Travel between six New York City
            districts — Manhattan, Central Park, Brooklyn, the Bronx, Coney Island, and the Ghetto — buying
            drugs at low prices and selling at high prices. Dodge cops, survive muggers, and manage your
            bankroll across 30 intense days. Your final score is your net worth when time runs out.
          </p>
        </div>

        <EditionFacts />
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/press/classic-market.png" alt="Classic Dope Wars market with prices, cash, debt and travel controls" width={1280} height={800} loading="lazy" className="w-full h-auto border border-crt-green/20" />
          <figcaption className="text-xs mt-3">The Classic market. Compare quotes before using your cash and coat space.</figcaption>
        </figure>
        <h3 className="font-pixel text-xs text-crt-amber">Why Play This Remake?</h3>
        <ul className="text-sm space-y-2">
          <li><span className="text-crt-cyan">Instant play</span> — No download or installation required. Play in a modern desktop or mobile browser.</li>
          <li><span className="text-crt-cyan">Retro pixel art</span> — Retro pixel art visuals with a CRT screen aesthetic.</li>
          <li><span className="text-crt-cyan">Global leaderboard</span> — Compete against players worldwide for the highest net worth.</li>
          <li><span className="text-crt-cyan">Fair competition</span> — Submitted runs are replayed on the server to validate scores. This is not a guarantee against all abuse.</li>
          <li><span className="text-crt-cyan">Pro mode available</span> — Extended campaigns up to 60 days with labs, warehouses, and international routes.</li>
        </ul>

        <div className="text-sm leading-relaxed space-y-2">
          <p>
            New to the game? Read the{' '}
            <Link href="/how-to-play" className="text-crt-cyan hover:underline">rules and beginner tips</Link>{' '}
            to learn the rules, district dangers, and tips for maximizing your score.
          </p>
          <p>
            Looking for a better run? Our{' '}
            <Link href="/blog/dope-wars-strategy" className="text-crt-cyan hover:underline">Dope Wars strategy and price guide</Link>{' '}
            covers all 11 price ranges, debt and bank interest, and a practical 30-day plan.
          </p>
          <p>
            Curious about the history? Learn about the{' '}
            <Link href="/about" className="text-crt-cyan hover:underline">Drug Wars and Dope Wars editions</Link>{' '}
            including calculator games, Palm handhelds, and today’s browser version.
          </p>
          <p>
            Ready to prove yourself? Check the{' '}
            <Link href="/leaderboard" className="text-crt-cyan hover:underline">leaderboard</Link>{' '}
            to see how top players score, then{' '}
            <Link href="/game" className="text-crt-amber hover:underline">start playing</Link>.
          </p>
        </div>
      </section>

      {/* Structured Data */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        '@id': siteIds.game,
        name: 'Play Dope Wars',
        alternateName: ['Dope Wars', 'Dope Wars browser remake'],
        description: 'An independent browser trading game. Play Classic free: buy low, sell high, manage debt and survive 30 days in New York. No account or download required.',
        screenshot: `${appUrl}/press/classic-market.png`,
        publisher: { '@id': siteIds.publisher },
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
        author: { '@id': siteIds.publisher },
        inLanguage: 'en',
        isAccessibleForFree: true,
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': siteIds.website,
        name: publisherName,
        publisher: { '@id': siteIds.publisher },
        url: appUrl,
      }} />
    </>
  );
}
