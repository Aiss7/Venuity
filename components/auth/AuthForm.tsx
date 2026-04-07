'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { login, signup } from '@/actions/auth';

// ---------------------------------------------------------------------------
// AuthForm — tabbed Login / Sign Up form (legacy, kept for compatibility).
// Error display is now handled server-side via ?error= redirect params on the
// dedicated /login and /signup pages. Form actions return void.
// ---------------------------------------------------------------------------

interface AuthFormProps {
  next?: string;
  action?: string;
}

export function AuthForm({ next = '/', action }: AuthFormProps) {
  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Create Account</TabsTrigger>
      </TabsList>

      {/* Login tab */}
      <TabsContent value="login">
        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          {action && <input type="hidden" name="action" value={action} />}

          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
          </div>

          <Button type="submit" className="w-full" size="lg">Sign In</Button>
        </form>
      </TabsContent>

      {/* Sign Up tab */}
      <TabsContent value="signup">
        <form action={signup} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          {action && <input type="hidden" name="action" value={action} />}

          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="signup-firstName">First Name</Label>
              <Input id="signup-firstName" name="firstName" type="text" placeholder="Taehyung" autoComplete="given-name" required />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="signup-lastName">Last Name</Label>
              <Input id="signup-lastName" name="lastName" type="text" placeholder="Kim" autoComplete="family-name" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" name="email" type="email" placeholder="you@gmail.com" autoComplete="email" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" minLength={6} required />
          </div>

          <Button type="submit" className="w-full" size="lg">Create Account</Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
