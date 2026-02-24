import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="font-pixel text-4xl text-crt-amber text-glow-amber">404</h1>
        <p className="text-sm text-muted-foreground">
          Page not found. Nothing to see here, dealer.
        </p>
        <Link
          href="/"
          className="retro-btn block w-full max-w-xs mx-auto py-3 text-xs text-center font-pixel"
        >
          BACK TO MENU
        </Link>
      </div>
    </main>
  );
}
