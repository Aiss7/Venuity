import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses `getAll`/`setAll` cookie methods (required by
 * @supabase/ssr ^0.10.0 — the deprecated get/set/remove API is not used).
 *
 * IMPORTANT: Never call this in Client Components — use createBrowserClient() instead.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` is called from a Server Component where cookies cannot
            // be mutated. This is safe to ignore — the middleware is responsible
            // for refreshing the session cookie on every request.
          }
        },
      },
    },
  );
}
