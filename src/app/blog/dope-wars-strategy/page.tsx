import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { DRUGS, DISTRICTS } from '@/engine/constants';
import { blogBaseUrl, strategyPost } from '@/lib/blog';
import styles from '../blog.module.css';
import { siteIds } from '@/lib/site';
import guideRun from '@/lib/guide-run.json';
import { InterestCalculator } from '@/components/seo/InterestCalculator';

const articleUrl = `${blogBaseUrl}${strategyPost.path}`;
const money = (value: number) => `$${value.toLocaleString('en-US')}`;
const range = (low: number, high: number) => `${money(low)}–${money(high)}`;
const sections = [
  ['price-guide', 'The complete price guide'],
  ['debt-and-bank', 'Debt versus bank interest'],
  ['better-trades', 'How to choose a trade'],
  ['districts', 'Where to travel'],
  ['thirty-day-plan', 'Your 30-day plan'],
  ['final-day', 'The final-day checklist'],
  ['recorded-run', 'A recorded Classic run'],
  ['interest-calculator', 'Interest calculator'],
  ['questions', 'Common questions'],
] as const;

export const metadata: Metadata = {
  title: { absolute: strategyPost.title },
  description: strategyPost.description,
  authors: [{ name: strategyPost.author, url: `${blogBaseUrl}/about` }],
  alternates: { canonical: articleUrl },
  openGraph: {
    type: 'article', title: strategyPost.title, description: strategyPost.description,
    url: articleUrl, siteName: 'Dope Wars', locale: 'en_US',
    publishedTime: strategyPost.published, modifiedTime: strategyPost.modified,
    authors: [`${blogBaseUrl}/about`], section: 'Game strategy',
    images: [{ url: `${blogBaseUrl}${strategyPost.image}`, width: 1200, height: 630, alt: strategyPost.title }],
  },
  twitter: {
    card: 'summary_large_image', title: strategyPost.title, description: strategyPost.description,
    images: [`${blogBaseUrl}${strategyPost.image}`],
  },
};

export default function StrategyPost() {
  return (
    <main id="main-content" className={styles.main}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
        <span aria-current="page">Dope Wars strategy</span>
      </nav>
      <article>
        <header>
          <p className={styles.eyebrow}>Classic mode · The strategy guide</p>
          <h1>{strategyPost.title}</h1>
          <p className={styles.dek}>The prices worth remembering, the debt that quietly eats your profits, and the decisions that make a stronger run.</p>
          <div className={styles.byline}>
            <span>By <Link href="/about">Dope Wars</Link></span>
            <time dateTime={strategyPost.published}>September 17, 2026</time>
            <a href="#sources">Based on this remake’s game rules</a>
          </div>
        </header>

        <aside className={styles.summary} aria-labelledby="quick-answer">
          <h2 id="quick-answer">What is a good Dope Wars strategy?</h2>
          <p>In this browser remake’s Classic mode, buy well below normal prices, take profitable exits, and reduce your 10% daily debt while keeping enough cash to trade. Bank spare cash for 5% interest per travel day. Prefer lower-risk districts, and sell profitable inventory before the trip that ends day 30.</p>
        </aside>
        <p>You begin with $2,000 cash, $5,000 debt, and 100 inventory spaces. A great price is only one part of the puzzle: you also need room to carry the purchase, time to sell it, and enough health to reach the next market.</p>
        <p>This guide covers <Link href="/game">Classic mode on Play Dope Wars</Link>. Other Dope Wars and Drug Wars editions use different prices, loans, and scoring rules. For the controls and basic rules, start with <Link href="/how-to-play">how to play</Link>; for decisions between turns, use the examples below.</p>

        <nav className={styles.toc} aria-label="In this guide">
          <h2>In this guide</h2>
          <ol>{sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol>
        </nav>

        <section id="price-guide" className={styles.section}>
          <h2>1. Learn the normal prices before chasing a bargain</h2>
          <p>A low number is not automatically a good price. Ecstasy at $60 is at the top of its normal range; Cocaine at $7,500 is a crash price. Compare each quote with that item’s own range.</p>
          <p>The table lists all 11 in-game goods, ordered by their minimum normal price. Most price spikes multiply the normal price by four; crashes divide it by four. Ecstasy uses an eightfold multiplier or divisor. Crash prices are rounded down to whole dollars.</p>
          <p className={styles.tableHint}>Swipe or scroll the table sideways to see crash and spike prices →</p>
          <div className={styles.tableScroll} role="region" aria-label="Dope Wars price guide, scroll horizontally on small screens" tabIndex={0}>
            <table className={styles.prices}>
              <caption>Classic mode price ranges per unit, in game dollars. These are possible ranges, not guaranteed offers.</caption>
              <thead><tr><th scope="col">In-game good</th><th scope="col">Normal</th><th scope="col">Crash</th><th scope="col">Spike</th></tr></thead>
              <tbody>{[...DRUGS].sort((a, b) => a.minPrice - b.minPrice).map(drug => (
                <tr key={drug.name}>
                  <th scope="row">{drug.name}</th>
                  <td>{range(drug.minPrice, drug.maxPrice)}</td>
                  <td>{range(Math.floor(drug.minPrice / drug.crashDivisor), Math.floor(drug.maxPrice / drug.crashDivisor))}</td>
                  <td>{range(drug.minPrice * drug.spikeMultiplier, drug.maxPrice * drug.spikeMultiplier)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p><strong>A crash can offer room for profit without needing a spike.</strong> Buying Cocaine at $5,000 and later selling at $15,000 would triple the purchase money, even though the sale is at the bottom of its normal range. Waiting for $120,000 risks passing up several useful exits.</p>
          <p>Availability matters, too. Each good has a one-in-eight chance of being absent from a newly generated market. An absent good cannot be bought or sold there. A cheap purchase is a position you may have to carry for more than one trip.</p>
        </section>

        <section id="debt-and-bank" className={styles.section}>
          <h2>2. Treat debt as a cost of every trip</h2>
          <p>In Classic mode, travel advances the day and applies interest: 10% to debt and 5% to bank savings. Buying, selling, depositing, withdrawing, and repaying debt do not advance the day. Leaving the browser open does not run the clock.</p>
          <p>Here is what happens to separate $5,000 balances if you make no payments or withdrawals. Each interest payment is rounded down, just as it is in the game.</p>
          <div className={styles.tableScroll} role="region" aria-label="Debt and bank interest comparison" tabIndex={0}>
            <table>
              <caption>Equal starting balances, different outcomes. A new run actually starts with $0 in the bank.</caption>
              <thead><tr><th scope="col">Trips elapsed</th><th scope="col">Debt at 10%</th><th scope="col">Bank at 5%</th></tr></thead>
              <tbody>
                <tr><th scope="row">0</th><td>$5,000</td><td>$5,000</td></tr>
                <tr><th scope="row">5</th><td>$8,052</td><td>$6,379</td></tr>
                <tr><th scope="row">10</th><td>$12,965</td><td>$8,138</td></tr>
                <tr><th scope="row">20</th><td>$33,621</td><td>$13,249</td></tr>
              </tbody>
            </table>
          </div>
          <p>With $5,000 debt, putting $1,000 toward repayment saves $100 on the next trip. Depositing that $1,000 into an empty bank earns $50 instead. For money you do not need for your next trade, repayment is the stronger immediate choice while debt remains.</p>
          <div className={styles.callout}>
            <p><strong>Keep a working bankroll.</strong> Paying your entire opening $2,000 toward debt leaves $3,000 owed and no cash to buy inventory. You would need a free find or another opportunity to restart trading. First identify an affordable trade, then use spare cash and realized profits to bring the debt down.</p>
          </div>
          <p>Once you are debt-free, deposit cash you are not putting into inventory. The bank is available from the market in every district, and withdrawals do not cost a day. Banked money also sits outside the cash balance that a mugging can take.</p>
        </section>

        <section id="better-trades" className={styles.section}>
          <h2>3. Choose trades by cash, space, and time</h2>
          <p>Every unit uses one inventory space. Early in a run, cash usually limits your purchases. Later, a full coat can become the bigger constraint. Compare both the return on the money spent and the dollars earned per space.</p>
          <h3>A small-bankroll example</h3>
          <p>Suppose Ecstasy is offered at $10. Buying 100 units costs $1,000 and fills the starting coat. Selling those units later at $40 brings in $4,000, for a $3,000 trading profit. Both quotes fall within its normal range; neither requires a special event.</p>
          <p>But that is a hypothetical trade, not a promised opening. You need an available market with a suitable sale price. If it takes two trips and you have not reduced the starting debt, that debt rises from $5,000 to $6,050. The $1,050 increase absorbs part of the gain before any encounter losses.</p>
          <h3>Why expensive goods become useful later</h3>
          <p>Suppose you have $20,000 and see Cocaine at $5,000. Four units cost $20,000 and occupy four spaces. A later sale at $15,000 yields $60,000: $40,000 profit, or $10,000 per space. The earlier Ecstasy example earns $30 per space.</p>
          <p>That does not make Cocaine the best purchase at every price. It illustrates why a larger bankroll changes your choices. A small purchase with a strong percentage return can grow your opening cash; a high-value bargain can put more capital to work without filling the coat.</p>
          <p className={styles.formula}>Trading profit = quantity × (sale price − purchase price)</p>
          <p>Before buying, check the current quote, free space, outstanding debt, and days remaining. Before holding for another turn, ask whether the possible improvement is worth another interest charge and encounter. Selling some inventory can fund a debt payment while leaving a smaller position for a later opportunity.</p>
        </section>

        <section id="districts" className={styles.section}>
          <h2>4. Choose districts for risk, not a mythical fixed route</h2>
          <p><strong>Classic mode has no district-specific price bonuses.</strong> The destination helps determine the next market, but all six districts use the same normal ranges and event rules. A more dangerous district does not automatically buy high or sell cheap.</p>
          <div className={styles.tableScroll} role="region" aria-label="District danger levels" tabIndex={0}>
            <table>
              <caption>Police encounter risk per trip into a district, before the final trip that ends the run.</caption>
              <thead><tr><th scope="col">Destination</th><th scope="col">Danger</th><th scope="col">Police chance</th></tr></thead>
              <tbody>{[...DISTRICTS].sort((a, b) => a.dangerLevel - b.dangerLevel).map(district => (
                <tr key={district.name}><th scope="row">{district.name}</th><td>{district.dangerLevel} / 4</td><td>1 in {10 - district.dangerLevel}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <p>Manhattan has the lowest police risk; Central Park and Brooklyn are tied next. Moving between lower-risk districts is a reasonable default when you want fresh prices. You cannot travel to your current district, and no route guarantees a profitable market.</p>
          <p>Low risk still means risk. Deposit spare cash before leaving, watch your health, and avoid assuming that carrying no inventory prevents a police encounter. In this version, the police check depends on the destination’s danger level.</p>
          <h3>Should you fight or run?</h3>
          <p>With no guns and no rounds yet played, the first escape attempt has a 50% success chance. Failed attempts can cost health; successful escapes can lose some inventory. Guns add damage when fighting but reduce escape chances, and a combat victory consumes your guns. Compare your health, weapons, and the officer’s remaining health instead of always choosing the same button.</p>
        </section>

        <section id="thirty-day-plan" className={styles.section}>
          <h2>5. A flexible plan for the 30-day game</h2>
          <p>Prices and encounters vary, so a fixed shopping list is brittle. Use these phases as priorities, not deadlines you must hit in every run.</p>
          <h3><span className={styles.phase}>Opening · Roughly days 1–5</span>Build enough cash to get moving</h3>
          <p>Inspect the opening market before spending. Ecstasy and Speed have the lowest normal entry prices, but another good may be affordable during a crash. Favor a quote with room to recover within its normal range. Take a useful profit when it appears and put part of it toward debt without emptying your trading bankroll.</p>
          <h3><span className={styles.phase}>Middle · Roughly days 6–20</span>Clear debt and make space count</h3>
          <p>Recheck your debt after each trip. Once profits cover it while preserving enough cash for your next chosen trade, clear it. With debt gone, bank idle cash and use larger bargains when they offer a sensible exit. Avoid filling every space with low-value stock simply because it is affordable.</p>
          <h3><span className={styles.phase}>Closing · Roughly days 21–29</span>Shorten your holding time</h3>
          <p>A bargain with one remaining opportunity to sell is different from the same bargain with twenty. Take profitable exits more readily, keep surplus funds earning interest, and stop relying on a rare spike to rescue an overpriced purchase. A good run can finish well without selling everything at its maximum possible price.</p>
        </section>

        <section id="final-day" className={styles.section}>
          <h2>6. Day 30: understand what your final score counts</h2>
          <p><strong>Day 30 is the last playable market day.</strong> The next trip applies one final interest step and ends the run without opening another market. Finish your trades, debt payments, and banking before taking it.</p>
          <p className={styles.formula}>Net worth = cash + bank − debt + inventory value</p>
          <p>During play, inventory uses the current market price when available, otherwise its recorded average purchase price. At the normal time-limit ending, the market is cleared, so unsold inventory is valued at its recorded average purchase price. It does not keep the last quoted market value.</p>
          <div className={styles.callout}>
            <p><strong>Example:</strong> Ten units bought at $100 have a recorded cost of $1,000. If the day-30 quote is $400, selling converts them into $4,000 cash. Carrying them through the final trip instead leaves $1,000 of inventory value. Selling captures the $3,000 gain.</p>
          </div>
          <p>Selling at a loss is a different decision. If the quote is below your recorded average purchase price, compare the sale proceeds plus any final bank interest with the inventory’s fallback value. If the good is unavailable, you cannot sell it in that market at all.</p>
          <ol>
            <li><strong>Check each holding.</strong> Sell available inventory when that gives a better final result than carrying it at its recorded cost.</li>
            <li><strong>Pay remaining debt from available cash.</strong> Avoid the final 10% interest charge where you can.</li>
            <li><strong>Bank spare cash.</strong> The final trip still credits 5% interest, rounded down.</li>
            <li><strong>End the run deliberately.</strong> Read the last-day warning before confirming travel.</li>
          </ol>
          <p>Use the <Link href="/leaderboard">Classic leaderboard</Link> to compare completed runs. A score is the result of trading, interest, inventory valuation, and survival together, rather than the biggest cash balance you briefly held.</p>
        </section>

        <section id="recorded-run" className={styles.section}>
          <h2>A recorded Classic run: decisions and results</h2>
          <p>This automated demonstration used one fixed seed, selected before running: <code>{guideRun.seed}</code>. Every action went through the same Classic game engine as normal play, and replaying the complete action log reproduced the final state. It was not submitted to the public leaderboard.</p>
          <p>The policy uses only the current market: sell at a 25% gain or on day 30; buy the deepest discount below 75% of the normal price midpoint with up to 80% of cash; keep $2,000 when repaying debt; bank cash above $10,000 after clearing debt; alternate Manhattan and Central Park; decline optional offers and run from combat. It is a simple demonstration, not an optimal strategy.</p>
          <div className={styles.callout}><p><strong>Observed result: {money(guideRun.netWorth)} net worth.</strong> The run reached its time limit with {money(guideRun.cash)} cash, {money(guideRun.bank)} in the bank, no debt, and {guideRun.health} health. One successful run does not establish a typical result or guarantee the same outcome on a new seed.</p></div>
          <p>The first trade bought six Hashish for $234 each and sold them for $720 each on day 2: $2,916 gross trading profit. A final-day price spike also helped: 14 Crack bought on day 29 for $542 sold on day 30 for $3,934. These favorable quotes materially affected the result.</p>
          <div className={styles.tableScroll} role="region" aria-label="Recorded run checkpoints" tabIndex={0}><table><caption>Selected actions, in order. Balances are after the action.</caption><thead><tr><th scope="col">Day</th><th scope="col">Decision</th><th scope="col">Cash</th><th scope="col">Debt</th><th scope="col">Bank</th></tr></thead><tbody>{guideRun.rows.map((row, i) => <tr key={i}><td>{row.day}</td><td>{row.decision}</td><td>{money(row.cash)}</td><td>{money(row.debt)}</td><td>{money(row.bank)}</td></tr>)}</tbody></table></div>
          <p><a href="/press/recorded-classic-run.json" download>Download all 104 actions and observed balances (JSON)</a>. This is an automated engine run, not a claim of human playtesting. The public script <a href="https://github.com/vincentvito/dope-wars-remake/blob/main/scripts/generate-guide-run.ts">generate-guide-run.ts</a> records the decision policy.</p>
        </section>
        <section id="interest-calculator" className={styles.section}><h2>Debt and bank interest calculator</h2><p>Compare the effect of travel on unchanged balances. This calculation uses Classic’s 10% debt and 5% bank interest, rounded down to whole dollars after every trip. It excludes trades, payments, encounters and deaths.</p><InterestCalculator /></section>

        <section id="questions" className={styles.section}>
          <h2>Common Dope Wars strategy questions</h2>
          <h3>What should I buy first in Dope Wars?</h3>
          <p>Choose from the actual opening quotes. Ecstasy and Speed are accessible at normal prices with $2,000 cash. A crash in another good may be better. Check the price table, quantity you can afford, and available space before committing.</p>
          <h3>Is the most expensive item always the most profitable?</h3>
          <p>No. Profit depends on the gap between your purchase and sale prices, multiplied by quantity. Expensive goods can generate more dollars per inventory space, but buying near a spike can leave you with a loss when prices return to normal.</p>
          <h3>Can I borrow more money from the loan shark?</h3>
          <p>Not in this remake’s Classic mode. You start with $5,000 debt and can repay some or all of it. Strategies from other editions that require taking out larger loans do not apply here.</p>
          <h3>Does refreshing the page give me new prices?</h3>
          <p>No. Prices are determined by the run, day, and district. Reloading a saved run restores the same situation; it does not reroll the market. Travel is how you advance to another day and market.</p>
          <h3>Does this guide also cover Pro mode?</h3>
          <p>The general ideas about cash, capacity, and time are useful, but these tables and examples cover Classic. <Link href="/upgrade">Pro mode</Link> adds city markets, assets, labs, and different combat systems, so do not assume the same route or price strategy applies unchanged.</p>
        </section>

        <section id="sources" className={`${styles.section} ${styles.sources}`}>
          <h2>Sources and how this guide was checked</h2>
          <p>This article was prepared with AI assistance and checked against this remake’s Classic game rules on September 18, 2026. The price table comes directly from the game’s item definitions; the district table uses its danger settings. Interest examples apply the game’s whole-dollar rounding on every trip. The recorded-run section is a reproducible engine demonstration. Other trading examples are illustrative; none guarantees an outcome.</p>
          <p>We also checked travel timing, inventory valuation, banking, and combat behavior against the game logic. The <Link href="/how-to-play">rules page</Link> provides a shorter introduction. For background on why editions differ, the separate <a href="https://dopewars.sourceforge.io/">Unix/Windows dopewars project</a> documents its configurable rewrite and additional features. Its settings are not the source of the numbers in this guide.</p>
        </section>

        <aside className={styles.cta} aria-labelledby="play-heading">
          <p className={styles.eyebrow}>Put the plan to work</p>
          <h2 id="play-heading">Your next run starts with a better first trade.</h2>
          <p>Play Classic free in your browser. Keep this guide handy, check the opening prices, and make your first move.</p>
          <Link href="/game" className={styles.button}>Play Dope Wars free ↗</Link>
        </aside>
      </article>

      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        '@id': `${articleUrl}#article`, url: articleUrl, mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
        headline: strategyPost.title, description: strategyPost.description,
        datePublished: strategyPost.published, dateModified: strategyPost.modified,
        author: { '@id': siteIds.publisher },
        publisher: { '@id': siteIds.publisher },
        image: { '@type': 'ImageObject', url: `${blogBaseUrl}${strategyPost.image}`, width: 1200, height: 630 },
        articleSection: 'Game strategy', inLanguage: 'en', isAccessibleForFree: true,
        about: { '@id': siteIds.game },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: blogBaseUrl },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${blogBaseUrl}/blog` },
          { '@type': 'ListItem', position: 3, name: strategyPost.title, item: articleUrl },
        ],
      }} />
    </main>
  );
}
