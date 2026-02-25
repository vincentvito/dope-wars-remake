import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!sessionId) {
    return NextResponse.redirect(new URL('/upgrade', appUrl));
  }

  let loggedInUserId: string | null = null;

  // Verify the Stripe session is paid (fallback in case webhook hasn't fired yet)
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    loggedInUserId = session.metadata?.user_id ?? null;

    if (session.payment_status === 'paid') {
      const email = session.customer_details?.email;

      if (email) {
        const supabase = await createServiceClient();

        // Upsert to handle race condition with webhook (both may fire simultaneously)
        const { error: upsertError } = await supabase.from('purchases').upsert(
          {
            email,
            stripe_checkout_session_id: sessionId,
            stripe_payment_intent_id: typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
            stripe_customer_id: typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id ?? null,
            amount_cents: session.amount_total ?? 0,
            currency: session.currency ?? 'usd',
            status: 'completed',
            completed_at: new Date().toISOString(),
            ...(loggedInUserId ? { user_id: loggedInUserId } : {}),
          },
          { onConflict: 'stripe_checkout_session_id' }
        );

        if (upsertError) {
          console.error('Failed to upsert purchase:', upsertError);
        }

        // Logged-in user: upgrade their profile directly
        if (loggedInUserId) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              is_pro: true,
              pro_purchased_at: new Date().toISOString(),
            })
            .eq('id', loggedInUserId);

          if (profileError) {
            console.error('Failed to upgrade profile in success route:', profileError);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error verifying Stripe session:', err);
  }

  // Logged-in user: skip setup-account, go straight to game with mode select
  if (loggedInUserId) {
    return NextResponse.redirect(new URL('/game?pro_success=1', appUrl));
  }

  // Anonymous user: existing setup-account flow
  return NextResponse.redirect(new URL(`/setup-account?session_id=${sessionId}`, appUrl));
}
