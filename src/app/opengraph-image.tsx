import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Dope Wars — The Classic Drug Trading Game';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const fontData = await fetch(
    new URL('https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2')
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Press Start 2P"',
          position: 'relative',
        }}
      >
        {/* Scanline overlay effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
            display: 'flex',
          }}
        />

        {/* Main title */}
        <div
          style={{
            fontSize: 72,
            color: '#00e5ff',
            textShadow: '0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.3)',
            marginBottom: 32,
            display: 'flex',
          }}
        >
          DOPE WARS
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 20,
            color: '#888888',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          The Classic Drug Trading Game
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 14,
            color: '#00ff88',
            textShadow: '0 0 20px rgba(0,255,136,0.4)',
            marginBottom: 48,
            display: 'flex',
          }}
        >
          Buy low, sell high, survive 30 days
        </div>

        {/* Domain */}
        <div
          style={{
            fontSize: 16,
            color: '#555555',
            display: 'flex',
          }}
        >
          playdopewars.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Press Start 2P',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
