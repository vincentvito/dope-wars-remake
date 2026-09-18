import Link from 'next/link';

export function EditionFacts() {
  return <dl className="grid grid-cols-2 gap-x-5 gap-y-5 text-sm">
    <div><dt className="text-crt-cyan mb-1">Classic</dt><dd>Free · 30 in-game days</dd></div>
    <div><dt className="text-crt-cyan mb-1">Platforms</dt><dd>Desktop &amp; mobile browsers</dd></div>
    <div><dt className="text-crt-cyan mb-1">Getting started</dt><dd>No download or account for Classic</dd></div>
    <div><dt className="text-crt-cyan mb-1">Saves</dt><dd>One run, saved on this browser</dd></div>
    <div><dt className="text-crt-cyan mb-1">Scores</dt><dd>Solo play · optional guest leaderboard</dd></div>
    <div><dt className="text-crt-cyan mb-1">Pro</dt><dd><Link href="/upgrade" className="underline">$7.99 USD once</Link> · more modes</dd></div>
  </dl>;
}
