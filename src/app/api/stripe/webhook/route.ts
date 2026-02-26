import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { resend } from '@/lib/resend';
import { createServiceClient } from '@/lib/supabase/server';
import { buildProWelcomeEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const loggedInUserId = session.metadata?.user_id ?? null;

    if (!email) {
      // Return 200 so Stripe doesn't retry forever — can't create a purchase without an email
      console.error('Stripe webhook: no customer email in session', session.id);
      return NextResponse.json({ received: true, warning: 'No customer email' });
    }

    const supabase = await createServiceClient();

    // Upsert to handle race condition with success route (both may fire simultaneously)
    const { error: upsertError } = await supabase.from('purchases').upsert(
      {
        email,
        stripe_checkout_session_id: session.id,
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
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Logged-in user: upgrade their profile directly (idempotent with success route)
    if (loggedInUserId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_pro: true,
          pro_purchased_at: new Date().toISOString(),
        })
        .eq('id', loggedInUserId);

      if (profileError) {
        console.error('Failed to upgrade profile in webhook:', profileError);
      }
    }

    // Send confirmation email
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured — skipping confirmation email');
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Dope Wars <noreply@playdopewars.com>';
      const isExistingUser = !!loggedInUserId;

      const emailHtml = buildProWelcomeEmail({
        appUrl,
        isExistingUser,
        sessionId: session.id,
      });

      console.log('[webhook] Sending welcome email', { from: fromEmail, to: email, isExistingUser });

      try {
        const { data, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Welcome to Dope Wars Pro!',
          html: emailHtml,
        });

        if (emailError) {
          console.error('[webhook] Resend API error:', JSON.stringify(emailError));
        } else {
          console.log('[webhook] Welcome email sent, id:', data?.id);
        }
      } catch (emailErr) {
        console.error('[webhook] Email send threw:', emailErr instanceof Error ? emailErr.message : emailErr);
        // Don't fail the webhook — email is non-critical
      }
    }
  }

  return NextResponse.json({ received: true });
}
