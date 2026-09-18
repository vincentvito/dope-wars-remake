import Link from 'next/link';
import styles from '@/app/blog/blog.module.css';

export function EditorialShell({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>
    <a className={styles.skipLink} href="#main-content">Skip to content</a>
    <header className={styles.masthead}>
      <Link href="/" className={styles.brand}>DOPE WARS</Link>
      <nav aria-label="Main navigation"><Link href="/blog">Guides</Link><Link href="/about">About</Link><Link href="/game" className={styles.playLink}>Play free ↗</Link></nav>
    </header>
    {children}
    <footer className={styles.footer}><p>Play Dope Wars · Know the market. Make your move.</p><nav aria-label="Footer navigation"><Link href="/press">Press kit</Link><Link href="/how-to-play">Rules</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/privacy">Privacy</Link></nav></footer>
  </div>;
}
