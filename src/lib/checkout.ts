import type Stripe from 'stripe';

export function isPaidProCheckout(session: Pick<Stripe.Checkout.Session, 'mode' | 'payment_status'>, priceIds: (string | undefined)[], expectedPrice: string | undefined): boolean {
  return session.mode === 'payment' && session.payment_status === 'paid' && !!expectedPrice && priceIds.length === 1 && priceIds[0] === expectedPrice;
}
