/** Only coarse, allowlisted acquisition labels may reach analytics or Stripe. */
export const landingPages = ['/', '/how-to-play', '/about', '/blog', '/blog/dope-wars-strategy', '/press', '/upgrade', '/leaderboard', '/game'] as const;
export const channels = ['organic_search', 'ai_referral', 'referral', 'direct'] as const;
export type Acquisition = { channel: typeof channels[number]; landing: typeof landingPages[number] };
export function sanitizeAcquisition(value: unknown): Acquisition {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    channel: channels.includes(input.channel as Acquisition['channel']) ? input.channel as Acquisition['channel'] : 'direct',
    landing: landingPages.includes(input.landing as Acquisition['landing']) ? input.landing as Acquisition['landing'] : '/',
  };
}
export function classifyAcquisition(referrer: string, pathname: string, origin: string): Acquisition {
  let channel: Acquisition['channel'] = 'direct';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    const matches = (domain: string) => host === domain || host.endsWith(`.${domain}`);
    if (url.origin !== origin) {
      if (['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'copilot.microsoft.com'].some(matches)) channel = 'ai_referral';
      else if (/^(www\.)?google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host) || ['bing.com', 'search.yahoo.com', 'duckduckgo.com', 'search.brave.com', 'ecosia.org'].some(matches)) channel = 'organic_search';
      else channel = 'referral';
    }
  } catch { /* Empty and malformed referrers reveal no acquisition source. */ }
  return sanitizeAcquisition({ channel, landing: pathname });
}
