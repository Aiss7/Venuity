import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase session-refresh middleware.
 *
 * Runs on every non-static request and ensures the Supabase access token is
 * silently refreshed before any Server Component renders.
 *
 * Key design decisions:
 * - getAll reads cookies from the *incoming* request.
 * - setAll writes refreshed cookies to *both* the forwarded request (so
 *   downstream Server Components see the new token) and the outgoing response
 *   (so the browser persists the token for the next request).
 * - No route protection here — that belongs in individual layouts or a DAL.
 */
export async function middleware(request: NextRequest) {
  // Clone the request so we can mutate its headers for downstream use.
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to the request so Server Components rendered after
          // this middleware see the refreshed token immediately.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Rebuild the response with the mutated request headers, then
          // write each cookie to the response so the browser persists it.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: calling getUser() here triggers the token refresh if the
  // access token is expired. Do NOT remove this call — without it the
  // session will never be refreshed and users will be randomly logged out.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (Next.js static files)
     *   - _next/image   (Next.js image optimisation)
     *   - favicon.ico, sitemap.xml, robots.txt (metadata files)
     *   - Any path segment starting with a dot   (hidden files)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
