import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { resend } from '@/lib/resend';
import { createServiceClient } from '@/lib/supabase/server';

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

      const emailHtml = isExistingUser
        ? `
          <div style="font-family: monospace; background: #0a0a0a; color: #00ff41; padding: 32px; max-width: 500px;">
            <h1 style="color: #00ff41; font-size: 20px;">DOPE WARS: PRO</h1>
            <p style="color: #ccc;">Your payment of <strong style="color: #00ff41;">$7.99</strong> has been confirmed.</p>
            <p style="color: #ccc;">Your account has been upgraded to Pro! You now have access to:</p>
            <ul style="color: #ccc;">
              <li>Pro game modes (30, 45, 60 days)</li>
              <li>Assets, weapons, labs &amp; extra cities</li>
              <li>Pro leaderboards</li>
            </ul>
            <a href="${appUrl}/game" style="display: inline-block; background: #00ff41; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; margin-top: 8px;">
              PLAY NOW
            </a>
          </div>
        `
        : `
          <div style="font-family: monospace; background: #0a0a0a; color: #00ff41; padding: 32px; max-width: 500px;">
            <h1 style="color: #00ff41; font-size: 20px;">DOPE WARS: PRO</h1>
            <p style="color: #ccc;">Your payment of <strong style="color: #00ff41;">$7.99</strong> has been confirmed.</p>
            <p style="color: #ccc;">You now have access to:</p>
            <ul style="color: #ccc;">
              <li>Pro game modes (30, 45, 60 days)</li>
              <li>Assets, weapons, labs &amp; extra cities</li>
              <li>Pro leaderboards</li>
            </ul>
            <p style="color: #ccc;">Set up your account to start playing:</p>
            <a href="${appUrl}/setup-account?session_id=${session.id}" style="display: inline-block; background: #00ff41; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; margin-top: 8px;">
              CREATE YOUR ACCOUNT
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
              If you already set up your account, you can ignore this email.
            </p>
          </div>
        `;

      try {
        const { data, error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Welcome to Dope Wars Pro!',
          html: emailHtml,
        });

        if (emailError) {
          console.error('Resend API returned error:', emailError);
        } else {
          console.log('Confirmation email sent successfully, id:', data?.id);
        }
      } catch (emailErr) {
        console.error('Failed to send confirmation email:', emailErr);
        // Don't fail the webhook — email is non-critical
      }
    }
  }

  return NextResponse.json({ received: true });
}
