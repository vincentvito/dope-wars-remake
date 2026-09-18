/** Read-only Stripe report. Never outputs customers, session IDs, or payment details.
 * node --env-file=.env.local --import tsx scripts/report-acquisition.ts YYYY-MM-DD YYYY-MM-DD
 * Dates are inclusive UTC; use a restricted read-only Stripe key when available.
 */
import Stripe from 'stripe';
import { sanitizeAcquisition } from '../src/lib/acquisition';
const [from, through] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(through || '')) throw Error('Provide inclusive UTC start/end dates (YYYY-MM-DD)');
const start = Date.parse(`${from}T00:00:00Z`) / 1000;
const end = Date.parse(`${through}T00:00:00Z`) / 1000 + 86400;
if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 93 * 86400) throw Error('Invalid range: maximum 93 days');
const key = process.env.STRIPE_SECRET_KEY;
const price = process.env.STRIPE_PRO_PRICE_ID;
if (!key || !price) throw Error('STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID are required');
const stripe = new Stripe(key);
const totals: Record<string, { purchases: number; grossPaidCents: number; currency: string }> = {};
let legacyUnattributed = 0;
for await (const session of stripe.checkout.sessions.list({ created: { gte: start, lt: end }, limit: 100 })) {
  if (session.mode !== 'payment' || session.payment_status !== 'paid' || session.status !== 'complete') continue;
  const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  if (!lines.data.some(line => line.price?.id === price)) continue;
  const meta = session.metadata || {};
  const hasAttribution = !!meta.acquisition_channel && !!meta.acquisition_landing;
  if (!hasAttribution) legacyUnattributed++;
  const attribution = sanitizeAcquisition({ channel: meta.acquisition_channel, landing: meta.acquisition_landing });
  const currency = session.currency || 'unknown';
  const group = `${hasAttribution ? attribution.channel : 'unattributed'} | ${hasAttribution ? attribution.landing : 'unknown'} | ${currency}`;
  totals[group] ||= { purchases: 0, grossPaidCents: 0, currency };
  totals[group].purchases++;
  totals[group].grossPaidCents += session.amount_total || 0;
}
console.log(JSON.stringify({ from, through, metric: 'Completed, paid Pro checkouts by checkout creation date; gross amount includes tax/discount effects and excludes refund adjustments. Not net revenue.', legacyUnattributed, totals }, null, 2));
