'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn } from '@/actions/auth';
import { useAuthStore } from '@/stores/auth-store';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    useAuthStore.getState().clear();
    if (redirect) formData.set('redirectTo', redirect);
    try {
      const result = await signIn(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm w-full space-y-6">
      <div className="text-center">
        <h1 className="font-pixel text-lg text-crt-green text-glow-green">
          LOG IN
        </h1>
        <p className="text-xs text-muted-foreground mt-2">
          Sign in to save games and submit to the leaderboard
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full bg-background border border-[var(--border-strong)] text-xs text-foreground px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full bg-background border border-[var(--border-strong)] text-xs text-foreground px-3 py-2"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-xs text-crt-red border border-crt-red/30 bg-crt-red/5 px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="retro-btn w-full py-2.5 text-xs font-bold"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          No account?{' '}
          <Link href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-crt-green hover:underline">
            Register
          </Link>
        </p>
        <Link href="/game" className="text-xs text-muted-foreground hover:text-foreground block">
          Play as guest →
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
