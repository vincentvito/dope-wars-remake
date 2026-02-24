'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { createCheckoutSession } from '@/actions/stripe';

const PRO_BENEFITS = [
  'Choose your campaign: 30, 45, or 60 days',
  'Buy a Lab — cut drugs for 2x profit',
  'Build a Warehouse for bulk storage',
  'Unlock Plane routes to Miami, LA & Medellin',
  'Buy a Plantation in Colombia',
  'Collect weapons & survive DEA raids',
  'Compete on the Pro Leaderboards',
];

export default function UpgradePage() {
  useAuthHydration();
  const isPro = useAuthStore((s) => s.isPro);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createCheckoutSession();

      if ('error' in result && result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      } else {
        setError('Failed to create checkout session. Please try again.');
        setIsLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-y-auto">
      <div className="w-full max-w-sm px-6 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-pixel text-2xl text-crt-amber text-glow-amber">
            DOPE WARS: PRO
          </h1>
          <p className="text-sm text-muted-foreground">
            Build your narcos empire.
          </p>
        </div>

        {isLoaded && isPro ? (
          /* Already Pro */
          <div className="space-y-4 text-center">
            <div className="retro-card p-6 border-crt-green/30">
              <p className="font-pixel text-sm text-crt-green text-glow-green">
                YOU&apos;RE ALREADY PRO
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                You have access to all Pro features.
              </p>
            </div>
            <Link
              href="/game"
              className="retro-btn retro-btn-amber block w-full py-3 text-xs font-bold text-center font-pixel"
            >
              PLAY NOW
            </Link>
          </div>
        ) : (
          <>
            {/* Benefits */}
            <div className="retro-card p-4 border-crt-amber/30 space-y-3">
              <ul className="space-y-2.5">
                {PRO_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-crt-amber shrink-0">+</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price + CTA */}
            <div className="space-y-3">
              <div className="text-center">
                <span className="font-pixel text-lg text-crt-green text-glow-green">$7.99</span>
                <span className="text-xs text-muted-foreground ml-2">one-time payment</span>
              </div>

              <button
                onClick={handleUpgrade}
                disabled={isLoading || !isLoaded}
                className="retro-btn retro-btn-amber w-full py-4 text-sm font-bold font-pixel disabled:opacity-50"
              >
                {isLoading ? 'REDIRECTING...' : 'BUY PRO — $7.99'}
              </button>

              {error && (
                <p className="text-xs text-crt-red text-center">{error}</p>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                Secure payment via Stripe. No subscription — pay once, play forever.
              </p>
            </div>
          </>
        )}

        {/* Back */}
        <Link
          href="/"
          className="retro-btn block w-full py-2 text-xs text-center font-pixel"
        >
          BACK TO MENU
        </Link>
      </div>
    </main>
  );
}
