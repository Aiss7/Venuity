'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bookmark,
  Compass,
  History,
  LogIn,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Discover', href: '/', icon: Compass },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'History', href: '/history', icon: History },
] as const;

// ---------------------------------------------------------------------------
// AppSidebar
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const pathname = usePathname();

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
          {/* Login CTA */}
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            asChild
          >
            <Link href="/login">
              <LogIn size={14} />
              Login
            </Link>
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Sign in to save venues<br />and view your history
          </p>

          {/* Location pill */}
          <div className="flex items-center justify-center gap-1.5 bg-muted rounded-md px-3 py-1.5">
            <MapPin size={11} className="text-primary" />
            <span className="text-xs text-muted-foreground">Butuan City, PH</span>
          </div>
        </div>
      </SidebarFooter>

    </Sidebar>
  );
}
