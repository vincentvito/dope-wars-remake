'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signUp } from '@/actions/auth';

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    if (redirect) formData.set('redirectTo', redirect);
    try {
      const result = await signUp(formData);
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
          REGISTER
        </h1>
        <p className="text-xs text-muted-foreground mt-2">
          Create an account to track your scores
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Username</label>
          <input
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_-]+"
            className="w-full bg-background border border-[var(--border-strong)] text-xs text-foreground px-3 py-2"
            placeholder="dealer_420"
          />
          <p className="text-[10px] text-muted-foreground">Letters, numbers, hyphens, underscores</p>
        </div>

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
          <p className="text-[10px] text-muted-foreground">Minimum 6 characters</p>
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-crt-green hover:underline">
            Log in
          </Link>
        </p>
        <Link href="/game" className="text-xs text-muted-foreground hover:text-foreground block">
          Play as guest →
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
