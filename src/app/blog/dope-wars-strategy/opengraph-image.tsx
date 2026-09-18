import { ImageResponse } from 'next/og';

export const alt = 'Dope Wars strategy: price guide, 10% debt interest, 5% bank interest, and a 30-day plan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function StrategyImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0a0e0d', color: '#f0f5f3', padding: '64px 72px', fontFamily: 'sans-serif', borderTop: '12px solid #82eac6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#82eac6', fontSize: 22, letterSpacing: 3 }}><span>DOPE WARS</span><span>CLASSIC MODE</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -3 }}>Make every day count.</div>
          <div style={{ fontSize: 32, color: '#c7cecc' }}>The price guide &amp; 30-day strategy plan</div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            ['11', 'Price ranges', '#82eac6'],
            ['10%', 'Debt per travel day', '#e8b775'],
            ['5%', 'Bank per travel day', '#82eac6'],
          ].map(([value, label, color]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 8, borderTop: '1px solid #375646', paddingTop: 20 }}>
              <span style={{ fontSize: 48, color, fontWeight: 700 }}>{value}</span>
              <span style={{ fontSize: 21, color: '#c7cecc' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 20, color: '#a5b4ad' }}>playdopewars.com/blog</div>
      </div>
    ),
    size,
  );
}
