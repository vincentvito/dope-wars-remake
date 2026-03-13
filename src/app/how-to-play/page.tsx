import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'How to Play Dope Wars — Rules, Tips & Strategy Guide',
  description:
    'Learn how to play Dope Wars. Complete guide to drug trading, districts, events, combat, and strategies to maximize your score in this classic drug game.',
  alternates: { canonical: '/how-to-play' },
};

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-pixel text-2xl text-crt-green text-glow-green">
            HOW TO PLAY DOPE WARS
          </h1>
          <p className="text-sm text-muted-foreground">
            The complete guide to surviving the streets and building your empire.
          </p>
        </div>

        {/* The Basics */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            THE BASICS
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Dope Wars is a classic drug trading game originally created by John E. Dell in 1984.
              You play as a dealer on the streets of New York City. Your goal is simple: buy drugs
              at low prices, sell them at high prices, and make as much money as possible
              before time runs out.
            </p>
            <p>
              You start with <span className="text-crt-green">$2,000</span> in cash
              and <span className="text-crt-red">$5,000</span> in debt to a loan shark.
              Your debt grows by <span className="text-crt-red">10% every day</span>, so
              paying it off quickly is critical. After 30 days, your final score is your
              net worth — cash plus bank savings minus any remaining debt.
            </p>
          </div>
        </section>

        {/* Districts */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            DISTRICTS OF NEW YORK
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Travel between 6 districts across New York City. Each trip to a new
              district advances the clock by one day. Each district has its own danger
              level that affects how likely you are to encounter cops or muggers.
            </p>
            <h3 className="font-pixel text-xs text-crt-cyan">Safe Zones</h3>
            <div className="retro-card p-4 border-crt-green/20">
              <ul className="space-y-2">
                <li><span className="text-crt-cyan">Manhattan</span> — Safest area, lower prices on upscale goods</li>
                <li><span className="text-crt-cyan">Central Park</span> — Relatively safe, balanced market</li>
              </ul>
            </div>
            <h3 className="font-pixel text-xs text-crt-cyan">Danger Zones</h3>
            <div className="retro-card p-4 border-crt-green/20">
              <ul className="space-y-2">
                <li><span className="text-crt-cyan">Brooklyn</span> — Moderate danger, good deals on street drugs</li>
                <li><span className="text-crt-cyan">Bronx</span> — Dangerous, higher risk but better prices</li>
                <li><span className="text-crt-cyan">Coney Island</span> — Dangerous, volatile drug market</li>
                <li><span className="text-crt-cyan">Ghetto</span> — Most dangerous, biggest risks and rewards</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Drugs */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            THE DRUG MARKET
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Drug prices fluctuate daily based on supply and demand. The key to winning
              Dope Wars is recognizing when prices are abnormally low (buy!) or high (sell!).
              Random market events can cause prices to spike or crash dramatically.
            </p>
            <div className="retro-card p-4 border-crt-green/20">
              <p className="text-xs text-crt-amber mb-3">Available drugs (cheapest to most expensive):</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <span>Weed</span><span>Shrooms</span>
                <span>Peyote</span><span>Speed</span>
                <span>Ecstasy</span><span>Hashish</span>
                <span>Opium</span><span>Smack</span>
                <span>Crack</span><span>Heroin</span>
                <span className="col-span-2">Cocaine</span>
              </div>
            </div>
            <p>
              Expensive drugs like Cocaine and Heroin offer the highest profit margins but
              require more capital. Cheap drugs like Weed and Shrooms are low-risk and good
              for building your starting cash.
            </p>
          </div>
        </section>

        {/* Events */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            RANDOM EVENTS
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              When traveling between districts, you may encounter random events that can
              help or hurt your game:
            </p>
            <h3 className="font-pixel text-xs text-crt-red">Threats</h3>
            <ul className="space-y-2">
              <li><span className="text-crt-red">Cop encounters</span> — Police may catch you carrying drugs. Fight or run.</li>
              <li><span className="text-crt-red">Muggers</span> — Thugs may try to steal your cash.</li>
            </ul>
            <h3 className="font-pixel text-xs text-crt-green">Opportunities</h3>
            <ul className="space-y-2">
              <li><span className="text-crt-green">Coat finds</span> — Find a larger trenchcoat, increasing your inventory space.</li>
              <li><span className="text-crt-green">Drug finds</span> — Discover free drugs to add to your stash.</li>
              <li><span className="text-crt-green">Gun finds</span> — Pick up weapons to improve your odds in combat.</li>
              <li><span className="text-crt-cyan">Market events</span> — Drug busts, lab discoveries, or supply changes that swing prices.</li>
            </ul>
          </div>
        </section>

        {/* Banking */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            BANKING & LOANS
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              The bank is your best friend in Dope Wars. Cash sitting in the bank
              earns <span className="text-crt-green">5% daily interest</span>. Meanwhile,
              your loan shark debt grows at <span className="text-crt-red">10% per day</span>.
            </p>
            <p>
              Smart strategy: pay off your debt as early as possible to stop the
              bleeding, then start depositing profits into the bank to let compound
              interest work in your favor.
            </p>
          </div>
        </section>

        {/* Pro Features */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            PRO MODE
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              <Link href="/upgrade" className="text-crt-amber hover:underline">Dope Wars Pro</Link> unlocks
              the full drug empire experience with extended campaigns and new features:
            </p>
            <ul className="space-y-2">
              <li><span className="text-crt-amber">Extended campaigns</span> — Play 30, 45, or 60 day games</li>
              <li><span className="text-crt-amber">The Lab</span> — Cut drugs to double your profit margins</li>
              <li><span className="text-crt-amber">Warehouse</span> — Store bulk inventory between trips</li>
              <li><span className="text-crt-amber">Plane routes</span> — Fly to Miami, LA, and Medellin for exotic markets</li>
              <li><span className="text-crt-amber">Plantation</span> — Grow your own supply in Colombia</li>
              <li><span className="text-crt-amber">Weapons</span> — Collect guns and survive DEA raids</li>
              <li><span className="text-crt-amber">Pro Leaderboards</span> — Compete with the best players worldwide</li>
            </ul>
          </div>
        </section>

        {/* Strategy Tips */}
        <section className="space-y-3">
          <h2 className="font-pixel text-sm text-crt-amber text-glow-amber">
            TIPS & STRATEGY
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <ol className="list-decimal list-inside space-y-2">
              <li><strong className="text-crt-green">Pay off debt first.</strong> At 10% daily interest, your $5,000 debt becomes crushing fast.</li>
              <li><strong className="text-crt-green">Buy low, sell high.</strong> Watch for market crashes (blue prices) to buy, and spikes (red prices) to sell.</li>
              <li><strong className="text-crt-green">Use the bank.</strong> Once debt-free, deposit cash for 5% daily interest. It compounds.</li>
              <li><strong className="text-crt-green">Diversify early.</strong> Trade cheap drugs like Weed and Speed to build capital before going for Cocaine and Heroin.</li>
              <li><strong className="text-crt-green">Watch your space.</strong> Your trenchcoat has limited capacity. Maximize profit per slot.</li>
              <li><strong className="text-crt-green">Avoid danger.</strong> Stick to safer districts early. Losing cash to muggers or drugs to cops can be devastating.</li>
            </ol>
          </div>
        </section>

        {/* Cross-links */}
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2 border-t border-crt-green/10 pt-6">
          <p>
            Want to learn the full story? Read about the{' '}
            <Link href="/about" className="text-crt-cyan hover:underline">history of Dope Wars</Link> from
            the original 1984 game to this modern remake.
          </p>
          <p>
            See how you compare on the{' '}
            <Link href="/leaderboard" className="text-crt-cyan hover:underline">global leaderboard</Link>.
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
              href="/leaderboard"
              className="retro-btn flex-1 py-2 text-[10px] text-center font-pixel"
            >
              LEADERBOARD
            </Link>
            <Link
              href="/about"
              className="retro-btn flex-1 py-2 text-[10px] text-center font-pixel"
            >
              ABOUT
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
          { '@type': 'ListItem', position: 2, name: 'How to Play', item: `${appUrl}/how-to-play` },
        ],
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do you play Dope Wars?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Dope Wars is a drug trading game where you buy drugs at low prices and sell them at high prices across New York City districts. You start with $2,000 cash and $5,000 in debt. Travel between 6 districts over 30 days to maximize your net worth.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the best strategy for Dope Wars?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Pay off your loan shark debt first — it grows at 10% daily. Then use the bank to earn 5% daily compound interest. Buy cheap drugs like Weed and Speed early to build capital, then invest in Cocaine and Heroin for the highest profit margins.',
            },
          },
          {
            '@type': 'Question',
            name: 'Which districts are safest in Dope Wars?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Manhattan is the safest district with the lowest danger level. Central Park is also relatively safe. Brooklyn has moderate danger, while the Bronx, Coney Island, and the Ghetto are increasingly dangerous but offer better drug prices and bigger rewards.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the bank work in Dope Wars?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The bank pays 5% daily interest on deposits. Meanwhile, your loan shark debt grows at 10% per day. Smart players pay off debt first, then deposit cash to earn compound interest for the rest of the game.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is Dope Wars Pro?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Dope Wars Pro is a $7.99 one-time upgrade that unlocks extended campaigns (30, 45, or 60 days), drug labs, warehouses, international plane routes to Miami, LA, and Medellin, plantations, weapons, and Pro leaderboards.',
            },
          },
        ],
      }} />
    </main>
  );
}
