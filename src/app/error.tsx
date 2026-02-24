'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="font-pixel text-2xl text-crt-red text-glow-red">ERROR</h1>
        <p className="text-xs text-muted-foreground">
          {error.message || 'Something went wrong. The streets are rough.'}
        </p>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="retro-btn w-full py-3 text-xs font-pixel"
          >
            TRY AGAIN
          </button>
          <Link
            href="/"
            className="retro-btn block w-full py-3 text-xs text-center font-pixel"
          >
            BACK TO MENU
          </Link>
        </div>
      </div>
    </main>
  );
}
