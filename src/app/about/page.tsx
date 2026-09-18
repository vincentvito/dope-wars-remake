import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialShell } from '@/components/seo/EditorialShell';
import { EditionFacts } from '@/components/seo/EditionFacts';
import { JsonLd } from '@/components/seo/JsonLd';
import { siteUrl, siteIds } from '@/lib/site';
import styles from '../blog/blog.module.css';

export const metadata: Metadata = {
  title: 'About Play Dope Wars — Browser, Calculator & Palm Editions',
  description: 'Meet this independent browser remake and explore the different Drug Wars and Dope Wars editions, from TI calculators and Palm handhelds to the web.',
  alternates: { canonical: '/about' },
};
export default function AboutPage() {
  return <EditorialShell><main id="main-content" className={styles.main}>
    <p className={styles.eyebrow}>About · Updated September 18, 2026</p>
    <h1>A familiar trading game. A new browser edition.</h1>
    <p className={styles.dek}>Play Dope Wars is an independent browser remake published by Play Dope Wars. Trade across New York, manage your debt, and see how much you can build in 30 in-game days.</p>
    <section className={styles.summary}><h2>This edition at a glance</h2><EditionFacts /></section>
    <section className={styles.section}>
      <h2>What is Play Dope Wars?</h2>
      <p>This is the game at <a href={siteUrl}>playdopewars.com</a>: a solo, turn-based trading game with retro pixel art and a CRT-style interface. Classic starts with $2,000 cash, $5,000 debt, and 100 inventory spaces. Each trip changes the market and advances the clock.</p>
      <p>Classic is free to play without signing up. Your run saves in the same browser; it does not sync across devices. Completed Classic runs support optional nickname posting to the leaderboard. Score validation replays submitted actions on the server, but cannot guarantee freedom from all abuse.</p>
      <p><Link href="/upgrade">Pro costs $7.99 USD once</Link> and adds 30-, 45-, and 60-day campaigns, labs, assets, weapons, and international destinations that unlock during play. A Pro account is required to use that upgrade.</p>
    </section>
    <section className={styles.section}>
      <h2>Drug Wars and Dope Wars are a family of editions</h2>
      <p>There is no single rulebook shared by every game with these names. The separate <a href="https://dopewars.sourceforge.io/">Unix/Windows dopewars project</a> identifies itself as a rewrite of John E. Dell’s Drug Wars and documents features such as multiplayer and configurable rules. Those settings do not describe this browser remake.</p>
      <h3>The calculator game: TI-82, TI-83 and TI-83 Plus</h3>
      <p>If you remember Drug Wars on a graphing calculator, you may be looking for a calculator program rather than a web game. A <a href="https://www.ticalc.org/archives/oldmail/ti-basic/2002_September/msg00077.html">2002 TI-BASIC mailing-list discussion about TI-83 Drug Wars</a> records the name in that community. Different calculator programs can have different prices, time limits, and rules.</p>
      <p>This site runs in a browser. It does not provide a TI-83 download or emulate a calculator. It offers the same kind of buy-low, sell-high decisions in a new interface.</p>
      <h3>The Palm handheld version</h3>
      <p>In a <a href="https://arstechnica.com/gaming/2006/06/mattlee/">2006 interview with Ars Technica</a>, Matt Lee described writing DopeWars for Palm as a way to learn handheld programming, drawing on the DOS game. He also distinguished his work from a separate Windows version.</p>
      <p>Play Dope Wars is independent of those projects. It is not their official continuation, and it does not offer a Palm application download.</p>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Edition comparison"><table>
        <caption>Choose the edition that matches what you want to play.</caption>
        <thead><tr><th scope="col">Edition</th><th scope="col">Where it runs</th><th scope="col">What this site provides</th></tr></thead>
        <tbody><tr><th scope="row">Play Dope Wars</th><td>Modern desktop and mobile browsers</td><td>Free Classic and optional Pro</td></tr><tr><th scope="row">Calculator programs</th><td>Compatible TI calculators</td><td>Historical context, not a calculator download</td></tr><tr><th scope="row">Palm DopeWars</th><td>Palm handhelds</td><td>Historical context, not a Palm download</td></tr><tr><th scope="row">Unix/Windows dopewars</th><td>Separate desktop project</td><td>A link to that project’s own documentation</td></tr></tbody>
      </table></div>
    </section>
    <section className={styles.section}><h2>Playing on Android or iPhone</h2><p>Open <a href={siteUrl}>playdopewars.com</a> in a modern browser and start Classic. There is no app-store installation. Keep using the same browser to resume a saved run; clearing site data or using a private session can remove the save.</p></section>
    <section className={styles.cta}><h2>Pick up the rules. Make your first trade.</h2><p>Read the <Link href="/how-to-play">quick-start rules</Link> or the <Link href="/blog/dope-wars-strategy">price and strategy guide</Link>. Writing about the game? The <Link href="/press">press kit</Link> contains facts and gameplay assets.</p><Link href="/game" className={styles.button}>Play Classic free ↗</Link></section>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'AboutPage', '@id': `${siteUrl}/about#page`, url: `${siteUrl}/about`, name: 'About Play Dope Wars', about: { '@id': siteIds.game }, publisher: { '@id': siteIds.publisher } }} />
  </main></EditorialShell>;
}
