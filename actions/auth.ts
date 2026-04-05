'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// login
// Authenticates an existing user. On failure, redirects back to /login with
// an ?error= query param so the page can display it without client state.
// On success, redirects to `next`.
// ---------------------------------------------------------------------------

export async function login(formData: FormData): Promise<void> {
  const email    = formData.get('email')    as string;
  const password = formData.get('password') as string;
  const next     = (formData.get('next') as string | null) ?? '/';

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

// ---------------------------------------------------------------------------
// signup
// Creates a new account with email, password, and name metadata.
// Stores first_name + last_name in Supabase Auth user_metadata.
// On failure, redirects back to /signup with ?error= so the page can display
// it without client state.
// ---------------------------------------------------------------------------

export async function signup(formData: FormData): Promise<void> {
  const email     = formData.get('email')     as string;
  const password  = formData.get('password')  as string;
  const firstName = formData.get('firstName') as string;
  const lastName  = formData.get('lastName')  as string;
  const next      = (formData.get('next') as string | null) ?? '/';

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}
