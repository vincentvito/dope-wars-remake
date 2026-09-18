'use client';

import { useLayoutEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { configureAnalytics, getAcquisition } from '@/lib/analytics';

export function AcquisitionAnalytics({ enabled, customEventsEnabled }: { enabled: boolean; customEventsEnabled: boolean }) {
  useLayoutEffect(() => { configureAnalytics(enabled && customEventsEnabled); getAcquisition(); return () => configureAnalytics(false); }, [enabled, customEventsEnabled]);
  if (!enabled) return null;
  return <Analytics beforeSend={event => {
    const url = new URL(event.url);
    // Account routes and payment/session query strings are never sent to analytics.
    if (/^\/(api|setup-account|login|register|preview)(\/|$)/.test(url.pathname)) return null;
    url.search = ''; url.hash = '';
    return { ...event, url: url.toString() };
  }} />;
}
