'use server';

import { createClient, createServiceClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { sanitizeRedirect } from '@/lib/redirect';

export async function signUp(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const username = formData.get('username');
  const redirectTo = sanitizeRedirect(formData.get('redirectTo') as string);

  if (typeof email !== 'string' || typeof password !== 'string' || typeof username !== 'string' || !email || !password || !username) {
    return { error: 'All fields are required' };
  }
  if (username.length < 3 || username.length > 20) {
    return { error: 'Username must be 3-20 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }
  if (password.length < 6 || password.length > 128) {
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

    // Use normal signup so the configured email verification and abuse controls apply.
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username, display_name: username } },
    });
    if (error) return { error: 'Unable to create account. Check your details or sign in.' };
    if (!data.session) return { message: 'Check your email to confirm your account, then sign in.' };
  } catch {
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  redirect(redirectTo);
}

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) return { error: 'Sign in is temporarily unavailable. You can still play as a guest.' };
  const supabase = await createClient();

  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = sanitizeRedirect(formData.get('redirectTo') as string);

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || password.length > 128) return { error: 'Enter a valid email and password.' };
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Email not confirmed') {
        return { error: 'Confirm your email using the link in your inbox, then sign in.' };
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

    // Never claim purchases using email alone. Legacy accounts were auto-confirmed.
    // A guest purchase is claimed with its private checkout setup link instead.
    return {
      isLoggedIn: true,
      isPro: profile?.is_pro ?? false,
      username: profile?.username ?? null,
    };
  } catch {
    return { isLoggedIn: false, isPro: false, username: null };
  }
}
