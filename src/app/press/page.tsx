/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialShell } from '@/components/seo/EditorialShell';
import { EditionFacts } from '@/components/seo/EditionFacts';
import { JsonLd } from '@/components/seo/JsonLd';
import { siteUrl, siteIds } from '@/lib/site';
import styles from '../blog/blog.module.css';

export const metadata: Metadata = {
  title: 'Play Dope Wars Press Kit — Facts, Screenshots & Gameplay',
  description: 'Facts, downloadable screenshots and a gameplay clip for Play Dope Wars, an independent browser trading game with free Classic and optional Pro.',
  alternates: { canonical: '/press' },
};
export default function PressPage() {
  return <EditorialShell><main id="main-content" className={styles.main}>
    <p className={styles.eyebrow}>Press kit · Updated September 18, 2026</p>
    <h1>Play Dope Wars</h1>
    <p className={styles.dek}>A retro trading game, one browser tab away.</p>
    <section className={styles.summary}><h2>Factsheet</h2><EditionFacts /><p className="mt-6">Publisher: Play Dope Wars<br />Website: <a href={siteUrl}>playdopewars.com</a><br />Language: English<br />Genre: turn-based trading / strategy<br />Theme: fictional drug trading, police encounters and combat.</p></section>
    <section className={styles.section}><h2>Short description</h2><p>Play Dope Wars is an independent browser trading game inspired by the Drug Wars / Dope Wars formula. Start with $2,000 and a $5,000 debt, compare prices across six New York districts, and manage risk through a 30-day Classic run. Classic is free and requires no account or download.</p><h3>What makes this edition distinct</h3><ul><li>Retro pixel art and a CRT-style interface on desktop and mobile.</li><li>Automatic saves in the current browser, plus optional nickname posting for completed Classic runs.</li><li>A strategy guide with the exact rules, price ranges and a reproducible engine-run example.</li><li>An optional $7.99 USD Pro upgrade with longer campaigns, labs, assets, weapons and international destinations.</li></ul><p>This is an independent remake, not an official release by the authors of the historical calculator, Palm or desktop editions. See the <Link href="/about">edition history and sources</Link>.</p></section>
    <section className={styles.section}><h2>Screenshots</h2><p>Actual captures of this browser edition. Images can be downloaded at their original resolution.</p>
      <figure><img src="/press/classic-market.png" alt="Classic market with prices and trading controls" width={1280} height={800} loading="lazy" className="w-full h-auto" /><figcaption><a href="/press/classic-market.png" download>Desktop market · PNG, 1280 × 800</a></figcaption></figure>
      <figure className="mt-8"><img src="/press/classic-mobile.png" alt="Dope Wars Classic displayed in a mobile browser" width={390} height={844} loading="lazy" className="w-full max-w-sm h-auto mx-auto" /><figcaption><a href="/press/classic-mobile.png" download>Mobile market · PNG, 390 × 844</a></figcaption></figure>
    </section>
    <section className={styles.section}><h2>Gameplay clip</h2><video controls playsInline preload="none" poster="/press/classic-market.png" width={1280} height={800} className="w-full h-auto" aria-label="Silent Classic gameplay demonstration"><source src="/press/classic-gameplay.mp4" type="video/mp4" /></video><p className={styles.note}>Silent capture showing the market, a trade, and travel controls. <a href="/press/classic-gameplay.mp4" download>Download MP4</a>.</p></section>
    <section className={styles.section}><h2>Downloads and editorial use</h2><p><a href="/press/play-dope-wars-press-kit.zip" download>Download the press kit ZIP</a> for both screenshots, the gameplay clip, icon and factsheet. You may use the supplied game assets in editorial coverage of Play Dope Wars with attribution and a link to <a href={siteUrl}>playdopewars.com</a>. This permission does not cover third-party marks or imply endorsement.</p><p><a href="/press/factsheet.txt" download>Plain-text factsheet</a> · <a href="/icon-512.png" download>Game icon, PNG</a> · <Link href="/blog/dope-wars-strategy#recorded-run">Recorded run and downloadable action log</Link></p></section>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Play Dope Wars Press Kit', url: `${siteUrl}/press`, about: { '@id': siteIds.game }, publisher: { '@id': siteIds.publisher } }} />
  </main></EditorialShell>;
}
