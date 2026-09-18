import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { blogBaseUrl, strategyPost } from '@/lib/blog';
import styles from './blog.module.css';

export const metadata: Metadata = {
  title: 'Blog — Dope Wars Strategy & Guides',
  description: 'Practical Dope Wars guides, with price tables, worked examples and strategies for the free browser game.',
  alternates: { canonical: `${blogBaseUrl}/blog` },
  openGraph: {
    type: 'website', title: 'Dope Wars Blog', url: `${blogBaseUrl}/blog`,
    description: 'Practical guides to trading, debt and surviving a 30-day run.',
    images: [{ url: `${blogBaseUrl}${strategyPost.image}`, width: 1200, height: 630, alt: strategyPost.title }],
  },
  twitter: { card: 'summary_large_image', title: 'Dope Wars Blog', description: strategyPost.description, images: [`${blogBaseUrl}${strategyPost.image}`] },
};

export default function BlogPage() {
  return (
    <main id="main-content" className={styles.main}>
      <p className={styles.eyebrow}>The Dope Wars field guide</p>
      <h1>A better plan for your next run.</h1>
      <p className={styles.dek}>Learn the prices, understand the risks, and make your next 30 days count.</p>
      <article className={styles.postCard}>
        <p className={styles.eyebrow}>Classic mode · Strategy</p>
        <h2><Link href={strategyPost.path}>{strategyPost.title}</Link></h2>
        <p>{strategyPost.description}</p>
        <p className={styles.note}>By Dope Wars · <time dateTime={strategyPost.published}>September 17, 2026</time></p>
        <Link href={strategyPost.path}>Read the strategy guide →</Link>
      </article>
      <p className={styles.note}>First time playing? Start with the <Link href="/how-to-play">rules and controls</Link>, or <Link href="/game">play Dope Wars free</Link>.</p>
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: blogBaseUrl },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${blogBaseUrl}/blog` },
        ],
      }} />
    </main>
  );
}
