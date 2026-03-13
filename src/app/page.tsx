import Link from 'next/link';
import { HomeClient } from '@/components/home/HomeClient';
import { JsonLd } from '@/components/seo/JsonLd';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function HomePage() {
  return (
    <>
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-start pt-[6vh] overflow-hidden">
        {/* GIF Background */}
        <img
          src="/sprites/landing/landing-bg.gif"
          alt="Pixel art city street scene from the Dope Wars drug trading game"
          className="absolute inset-0 w-full h-full object-cover object-bottom opacity-35 pointer-events-none"
          style={{ imageRendering: 'pixelated' as const }}
          draggable={false}
          loading="lazy"
          decoding="async"
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
            <Link href="/leaderboard" className="hover:text-muted-foreground transition-colors">Leaderboard</Link>
            {' · '}
            <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms</Link>
            {' · '}
            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
          </p>
        </div>
      </main>

      {/* Below-fold SEO content — accessible to crawlers, not visible in viewport */}
      <section className="bg-black text-muted-foreground px-6 py-16 max-w-2xl mx-auto space-y-8" aria-label="About Dope Wars">
        <h2 className="font-pixel text-sm text-crt-green text-glow-green">
          The Classic Drug Trading Game — Free Online
        </h2>
        <div className="text-sm leading-relaxed space-y-4">
          <p>
            Dope Wars is a classic drug trading strategy game originally created by John E. Dell in 1984.
            This free online remake brings the full experience to your browser — no download, no app store,
            no install. Play instantly on desktop or mobile.
          </p>
          <p>
            Start with $2,000 in cash and $5,000 in debt to a loan shark. Travel between six New York City
            districts — Manhattan, Central Park, Brooklyn, the Bronx, Coney Island, and the Ghetto — buying
            drugs at low prices and selling at high prices. Dodge cops, survive muggers, and manage your
            bankroll across 30 intense days. Your final score is your net worth when time runs out.
          </p>
        </div>

        <h3 className="font-pixel text-xs text-crt-amber">Why Play This Remake?</h3>
        <ul className="text-sm space-y-2">
          <li><span className="text-crt-cyan">Instant play</span> — No download or installation required. Works on any browser.</li>
          <li><span className="text-crt-cyan">Retro pixel art</span> — Handcrafted pixel art visuals with a CRT screen aesthetic.</li>
          <li><span className="text-crt-cyan">Global leaderboard</span> — Compete against players worldwide for the highest net worth.</li>
          <li><span className="text-crt-cyan">Fair competition</span> — Server-validated scores ensure nobody can cheat.</li>
          <li><span className="text-crt-cyan">Pro mode available</span> — Extended campaigns up to 60 days with labs, warehouses, and international routes.</li>
        </ul>

        <div className="text-sm leading-relaxed space-y-2">
          <p>
            New to the game? Read the{' '}
            <Link href="/how-to-play" className="text-crt-cyan hover:underline">complete strategy guide</Link>{' '}
            to learn the rules, district dangers, and tips for maximizing your score.
          </p>
          <p>
            Curious about the history? Learn about the{' '}
            <Link href="/about" className="text-crt-cyan hover:underline">original 1984 Dope Wars game</Link>{' '}
            and how it spread from DOS to TI-83 calculators to the modern web.
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
    </>
  );
}
