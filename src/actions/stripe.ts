'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';

export async function createCheckoutSession() {
  // If user is already logged in and pro, bail early
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single();

    if (profile?.is_pro) {
      return { error: 'Already a Pro member' };
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    console.error('STRIPE_PRO_PRICE_ID is not configured');
    return { error: 'Payment system not configured. Please try again later.' };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/upgrade`,
  });

  return { url: session.url };
}

export async function setupProAccount(formData: FormData) {
  const sessionId = formData.get('sessionId') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!sessionId || !username || !password) {
    return { error: 'All fields are required' };
  }

  if (username.length < 3 || username.length > 20) {
    return { error: 'Username must be 3-20 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  const serviceClient = await createServiceClient();

  // 1. Verify purchase exists, is completed, and has no user yet
  const { data: purchase, error: purchaseError } = await serviceClient
    .from('purchases')
    .select('id, email, user_id, status')
    .eq('stripe_checkout_session_id', sessionId)
    .single();

  if (purchaseError || !purchase) {
    return { error: 'Purchase not found. Please check your email for the setup link.' };
  }

  if (purchase.status !== 'completed') {
    return { error: 'Payment has not been completed yet. Please try again in a moment.' };
  }

  if (purchase.user_id) {
    return { error: 'An account has already been created for this purchase.' };
  }

  // 2. Check username availability
  const { data: existing } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (existing) {
    return { error: 'Username is already taken' };
  }

  // 3. Create Supabase auth user via service client (admin API)
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: purchase.email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: username,
    },
  });

  if (authError || !authData.user) {
    if (authError?.message?.includes('already been registered')) {
      return { error: 'An account with this email already exists. Please log in instead.' };
    }
    return { error: authError?.message || 'Failed to create account' };
  }

  const userId = authData.user.id;

  // 4. Update profile to pro (trigger auto-created profile, now set is_pro)
  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({
      is_pro: true,
      pro_purchased_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Failed to set Pro status on profile:', profileError);
    return { error: 'Account created but failed to activate Pro. Please contact support.' };
  }

  // 5. Link purchase to user
  const { error: linkError } = await serviceClient
    .from('purchases')
    .update({ user_id: userId })
    .eq('id', purchase.id);

  if (linkError) {
    console.error('Failed to link purchase to user:', linkError);
    // Non-fatal — user is already Pro, purchase link is just bookkeeping
  }

  // 6. Sign in the user on the regular client
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({
    email: purchase.email,
    password,
  });

  redirect('/game?pro_success=1');
}
