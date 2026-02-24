'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

function sanitizeRedirect(url: string | null): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) {
    return '/game';
  }
  return url;
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  const redirectTo = sanitizeRedirect(formData.get('redirectTo') as string);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: username,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = sanitizeRedirect(formData.get('redirectTo') as string);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
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

    return {
      isLoggedIn: true,
      isPro: profile?.is_pro ?? false,
      username: profile?.username ?? null,
    };
  } catch {
    return { isLoggedIn: false, isPro: false, username: null };
  }
}
