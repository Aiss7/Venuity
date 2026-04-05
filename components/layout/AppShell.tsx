'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

// ---------------------------------------------------------------------------
// AppShell — Client Component
//
// Wraps the sidebar layout. On auth routes (/login, /signup) the sidebar and
// its provider are skipped entirely — children are rendered full-screen.
// This pattern keeps app/layout.tsx a Server Component while still letting
// us conditionally suppress the sidebar based on the current pathname.
// ---------------------------------------------------------------------------

const AUTH_PATHS = ['/login', '/signup'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthRoute) {
    // Auth pages: no sidebar, no providers, just children full-screen.
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile sidebar toggle — hidden on md+ */}
          <SidebarTrigger className="m-2 md:hidden" />

          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
