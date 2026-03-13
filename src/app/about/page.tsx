import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'About Dope Wars — History of the Original 1984 Game',
  description:
    'The history of Dope Wars, from John E. Dell\'s original 1984 game to this modern web remake. Learn about the classic drug dealing game that started it all.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-pixel text-2xl text-crt-green text-glow-green">
            ABOUT DOPE WARS
          </h1>
          <p className="text-sm text-muted-foreground">
            The story behind the original drug trading game.
          </p>
        </div>

        {/* The Original */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            THE ORIGINAL GAME
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              The original Dope Wars was created by John E. Dell in 1984. Originally called
              &ldquo;Drug Wars,&rdquo; it was a text-based DOS game where players assumed the role
              of a drug dealer on the streets of New York City. The premise was simple: buy
              drugs at low prices, travel between neighborhoods, and sell at higher prices —
              all while avoiding law enforcement and street criminals.
            </p>
            <p>
              The game drew inspiration from the economic simulation genre, reducing
              complex market dynamics to a compelling buy-low-sell-high loop. Despite its
              controversial subject matter, the game became widely popular due to its
              addictive gameplay mechanics and the thrill of risk-versus-reward decision making.
            </p>
          </div>
        </section>

        {/* Cultural Phenomenon */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            A CULTURAL PHENOMENON
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Throughout the late 1980s and 1990s, Dope Wars spread across platforms in ways
              its creator never anticipated. The game was ported to TI-83 graphing calculators,
              making it a staple of high school classrooms everywhere. Students would pass
              calculators between classes, competing for the highest net worth.
            </p>

            <h3 className="font-pixel text-xs text-crt-cyan">Platform Evolution</h3>
            <p>
              In the late 1990s, a Palm Pilot version brought the game to the emerging
              mobile platform. The early 2000s saw versions appear on Java-enabled cell phones
              and Windows Mobile devices. When the iPhone launched in 2007, Dope Wars was
              among the earliest games ported to iOS, and Android versions soon followed.
              Each version preserved the core gameplay loop while adding its own twist —
              new cities, new drugs, new events.
            </p>

            <h3 className="font-pixel text-xs text-crt-cyan">Legacy & Influence</h3>
            <p>
              The Dope Wars formula also inspired countless clones and spiritual successors.
              The basic video game dealer simulation — buy low, sell high, manage risk,
              survive a time limit — became its own sub-genre. Titles like &ldquo;Drugwars,&rdquo;
              &ldquo;Dealer,&rdquo; and &ldquo;Pusher&rdquo; all trace their lineage back to Dell&apos;s
              original creation. The game&apos;s economic mechanics have been echoed in trading
              sims across genres, from space trading games to merchant RPGs.
            </p>
          </div>
        </section>

        {/* This Remake */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            THIS REMAKE
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              This modern web remake brings the original Dope Wars experience to your
              browser with no download required. Built with retro pixel art aesthetics
              and a CRT-style visual design, it captures the feel of the classic
              while adding modern features:
            </p>
            <ul className="space-y-2">
              <li><span className="text-crt-cyan">Play instantly</span> — No installation, no app store. Open the browser and start dealing.</li>
              <li><span className="text-crt-cyan">Pixel art visuals</span> — Handcrafted retro pixel art for every screen and event.</li>
              <li><span className="text-crt-cyan">Global leaderboard</span> — Compete against players worldwide for the highest net worth.</li>
              <li><span className="text-crt-cyan">Pro mode</span> — Extended campaigns up to 60 days with labs, warehouses, planes, and international routes.</li>
              <li><span className="text-crt-cyan">Fair competition</span> — Deterministic game engine with server-side score validation ensures nobody cheats.</li>
            </ul>
            <p>
              Whether you played the original Dope Wars on a TI-83 calculator, a Palm Pilot,
              or are discovering this classic drug trading game for the first time, this
              remake aims to deliver the definitive Dope Wars experience on the modern web.
            </p>
          </div>
        </section>

        {/* Cross-links */}
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2 border-t border-crt-green/10 pt-6">
          <p>
            Ready to play? Check the{' '}
            <Link href="/how-to-play" className="text-crt-cyan hover:underline">rules and strategy guide</Link>{' '}
            for tips on maximizing your score.
          </p>
          <p>
            Want the full experience? Upgrade to{' '}
            <Link href="/upgrade" className="text-crt-amber hover:underline">Dope Wars Pro</Link>{' '}
            for extended campaigns, drug labs, and international routes.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-4">
          <Link
            href="/game"
            className="retro-btn retro-btn-amber block w-full py-4 text-sm font-bold text-center font-pixel"
          >
            PLAY DOPE WARS NOW
          </Link>
          <div className="flex gap-3">
            <Link
              href="/how-to-play"
              className="retro-btn flex-1 py-2 text-[10px] text-center font-pixel"
            >
              HOW TO PLAY
            </Link>
            <Link
              href="/leaderboard"
              className="retro-btn flex-1 py-2 text-[10px] text-center font-pixel"
            >
              LEADERBOARD
            </Link>
            <Link
              href="/"
              className="retro-btn flex-1 py-2 text-[10px] text-center font-pixel"
            >
              MENU
            </Link>
          </div>
        </div>
      </div>

      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
          { '@type': 'ListItem', position: 2, name: 'About', item: `${appUrl}/about` },
        ],
      }} />
    </main>
  );
}
