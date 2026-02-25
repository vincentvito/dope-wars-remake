'use server';

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

function sanitizeRedirect(url: string | null): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) {
    return '/game';
  }
  return url;
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  const redirectTo = sanitizeRedirect(formData.get('redirectTo') as string);

  if (!email || !password || !username) {
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

  try {
    const serviceClient = await createServiceClient();

    // Check username uniqueness
    const { data: existing } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return { error: 'Username is already taken' };
    }

    // Create user via admin API (email auto-confirmed, no confirmation email needed)
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
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

    // Sign in immediately (sets session cookies)
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return { error: 'Account created but sign-in failed. Please log in manually.' };
    }
  } catch {
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  redirect(redirectTo);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = sanitizeRedirect(formData.get('redirectTo') as string);

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Email not confirmed') {
        return { error: 'Your email is not confirmed. Please register again to create a new account.' };
      }
      return { error: error.message };
    }
  } catch {
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function getProStatus(): Promise<{
  isLoggedIn: boolean;
  isPro: boolean;
  username: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { isLoggedIn: false, isPro: false, username: null };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isLoggedIn: false, isPro: false, username: null };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro, username')
      .eq('id', user.id)
      .single();

    // If not pro, check for orphaned purchases with this email
    if (!profile?.is_pro && user.email) {
      try {
        const serviceClient = await createServiceClient();
        const { data: purchase } = await serviceClient
          .from('purchases')
          .select('id')
          .eq('email', user.email)
          .eq('status', 'completed')
          .is('user_id', null)
          .limit(1)
          .single();

        if (purchase) {
          await serviceClient
            .from('purchases')
            .update({ user_id: user.id })
            .eq('id', purchase.id);
          await serviceClient
            .from('profiles')
            .update({ is_pro: true, pro_purchased_at: new Date().toISOString() })
            .eq('id', user.id);

          return {
            isLoggedIn: true,
            isPro: true,
            username: profile?.username ?? null,
          };
        }
      } catch {
        // Purchase linking failed — not critical, user can still play
      }
    }

    return {
      isLoggedIn: true,
      isPro: profile?.is_pro ?? false,
      username: profile?.username ?? null,
    };
  } catch {
    return { isLoggedIn: false, isPro: false, username: null };
  }
}
