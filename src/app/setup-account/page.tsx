'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setupProAccount } from '@/actions/stripe';

function SetupAccountForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!sessionId) {
    return (
      <div className="w-full max-w-sm px-6 space-y-6 text-center">
        <h1 className="font-pixel text-lg text-crt-red text-glow-red">INVALID LINK</h1>
        <p className="text-xs text-muted-foreground">
          This setup link is invalid or expired. Check your email for the correct link.
        </p>
        <Link href="/" className="retro-btn block w-full py-3 text-xs text-center font-pixel">
          HOME
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set('sessionId', sessionId);

    try {
      const result = await setupProAccount(formData);
      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // On success, the server action redirects to /game
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm px-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-pixel text-lg text-crt-green text-glow-green">
          WELCOME TO PRO
        </h1>
        <p className="text-xs text-muted-foreground">
          Payment confirmed. Create your account to start playing.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Username
          </label>
          <input
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_-]+"
            placeholder="your-username"
            className="w-full bg-[#0a0a0a] border border-[#333] text-xs text-foreground px-3 py-2.5 focus:border-crt-green focus:outline-none"
            disabled={isSubmitting}
          />
          <p className="text-[10px] text-muted-foreground">
            3-20 characters. Letters, numbers, hyphens, underscores.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            className="w-full bg-[#0a0a0a] border border-[#333] text-xs text-foreground px-3 py-2.5 focus:border-crt-green focus:outline-none"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="text-xs text-crt-red text-center py-1">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="retro-btn retro-btn-amber w-full py-3 text-xs font-bold font-pixel disabled:opacity-50"
        >
          {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & PLAY'}
        </button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-[10px] text-muted-foreground hover:text-crt-cyan">
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}

export default function SetupAccountPage() {
  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-y-auto">
      <Suspense fallback={
        <div className="font-pixel text-sm text-crt-green text-glow-green animate-pulse">
          Loading...
        </div>
      }>
        <SetupAccountForm />
      </Suspense>
    </main>
  );
}
