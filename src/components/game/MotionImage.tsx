import type { ImgHTMLAttributes } from 'react';

/** Animated pixel art with a still frame for players who request reduced motion. */
export function MotionImage({ src, alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  return <picture className="contents">
    {src.endsWith('.gif') && <source media="(prefers-reduced-motion: reduce)" srcSet={src.replace(/\.gif$/, '-still.webp')} />}
    {/* GIFs are served directly to retain their animation. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={alt} {...props} />
  </picture>;
}
