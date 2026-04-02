import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components ('use client').
 * Call this at the top of a Client Component — it is safe to call on every
 * render because @supabase/ssr internally memoises the instance per-tab.
 *
 * IMPORTANT: Never use this in Server Components or Server Actions —
 * use createServerSupabaseClient() from lib/supabase/server.ts instead.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
