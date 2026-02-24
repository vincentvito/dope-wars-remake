'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          background: '#000',
          color: '#e0e0e0',
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <h1
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '1.5rem',
              color: '#ff3333',
              textShadow: '0 0 8px rgba(255,51,51,0.6)',
              marginBottom: '1rem',
            }}
          >
            FATAL ERROR
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '1.5rem' }}>
            Something went critically wrong.
          </p>
          <button
            onClick={reset}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '0.75rem',
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: '#00ffcc',
              border: '1px solid #00ffcc',
              cursor: 'pointer',
            }}
          >
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}
