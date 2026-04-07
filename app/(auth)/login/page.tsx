import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { login } from '@/actions/auth';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Login page — login-04 split-panel layout
// Left: brand panel (hidden on mobile)
// Right: email + password form wired to login() server action
// ---------------------------------------------------------------------------

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; action?: string; error?: string }>;
}) {
  const { next, action, error } = await searchParams;
  const redirectTo = next ?? '/';

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-muted/30 border-r border-border p-10">
        {/* Top — wordmark */}
        <div className="flex items-center gap-2">
          <MapPin size={22} className="text-primary" />
          <span className="text-lg font-semibold tracking-tight">Venuity</span>
        </div>

        {/* Middle — hero copy */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold leading-snug">
            Discover the best venues<br />in Butuan City.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Search, explore, and bookmark event spaces tailored to your needs — all in one place.
          </p>
        </div>

        {/* Bottom — tagline */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Venuity · Butuan City, PH
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile-only wordmark */}
          <div className="flex lg:hidden items-center gap-2">
            <MapPin size={20} className="text-primary" />
            <span className="text-base font-semibold tracking-tight">Venuity</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              {action === 'bookmark'
                ? 'Sign in to save this venue to your bookmarks.'
                : 'Sign in to your Venuity account.'}
            </p>
          </div>

          {/* Form */}
          <form action={login} className="space-y-5">
            <input type="hidden" name="next" value={redirectTo} />

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          {/* Switch to signup */}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={`/signup${redirectTo !== '/' ? `?next=${encodeURIComponent(redirectTo)}` : ''}`}
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
