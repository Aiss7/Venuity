import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { signup } from '@/actions/auth';

// ---------------------------------------------------------------------------
// Signup page — signup-04 split-panel layout
// Left: brand panel (hidden on mobile)
// Right: first name, last name, email, password — wired to signup() action
// ---------------------------------------------------------------------------

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
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
            Your event shortlist<br />starts here.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            Create an account to bookmark venues, track your history, and get personalised recommendations.
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
            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">
              Join Venuity and start discovering event venues.
            </p>
          </div>

          {/* Form */}
          <form action={signup} className="space-y-5">
            <input type="hidden" name="next" value={redirectTo} />

            {/* First name + Last name — 2-column grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Taehyung"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Kim"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@gmail.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          {/* Switch to login */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={`/login${redirectTo !== '/' ? `?next=${encodeURIComponent(redirectTo)}` : ''}`}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
