'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import {
  Bookmark,
  Compass,
  History,
  LogIn,
  LogOut,
  MapPin,
  MapPinned,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Discover', href: '/', icon: Compass },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'History', href: '/history', icon: History },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.trim()[0]?.toUpperCase() ?? '';
  const l = lastName?.trim()[0]?.toUpperCase() ?? '';
  return f + l || '?';
}

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Fetch current session on mount.
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Keep state in sync with login / logout events.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  const firstName = user?.user_metadata?.first_name as string | undefined;
  const lastName  = user?.user_metadata?.last_name  as string | undefined;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <SidebarHeader>
        <div className="flex items-center gap-2 p-4">
          <MapPinned size={20} className="text-primary shrink-0" />
          <span className="text-base font-medium text-foreground font-sans group-data-[collapsible=icon]:hidden">
            Venuity
          </span>
        </div>
      </SidebarHeader>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
            Explore
          </SidebarGroupLabel>

          <SidebarMenu>
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={label}
                    className="gap-3 text-sm font-medium text-sidebar-foreground hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground rounded-md transition-colors"
                  >
                    <Link href={href}>
                      <Icon size={16} className="shrink-0" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <SidebarFooter>
        <Separator className="mb-3 bg-sidebar-border" />

        <div className="flex flex-col gap-3 p-4 pt-0 group-data-[collapsible=icon]:hidden">

          {user ? (
            /* ── Logged in ──────────────────────────────────────────────── */
            <>
              {/* Profile block */}
              <div className="flex items-center gap-3 p-2">
                <Avatar className="h-9 w-9 shrink-0">
                  {/* No profile picture yet — initials fallback */}
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">
                    {getInitials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {firstName} {lastName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-32">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Welcome message */}
              <p className="text-xs text-muted-foreground italic mt-2 p-2 bg-sidebar-accent/50 rounded-md leading-relaxed">
                Welcome back, {firstName}! Start building your ultimate event shortlist.
              </p>

              {/* Sign out */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 gap-2 text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                <LogOut size={14} />
                Sign Out
              </Button>
            </>
          ) : (
            /* ── Logged out ─────────────────────────────────────────────── */
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Sign in to unlock personalized features like Bookmarks and History.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Sign In / Create Account</Link>
              </Button>
            </div>
          )}

        </div>
      </SidebarFooter>

    </Sidebar>
  );
}
