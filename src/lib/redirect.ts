/** Only allow same-origin paths, including after browser URL normalization. */
export function sanitizeRedirect(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const url = new URL(value, 'https://dope-wars.invalid');
    return url.origin === 'https://dope-wars.invalid' && !url.pathname.startsWith('//') ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch { return fallback; }
}
