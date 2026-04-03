import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/app-sidebar';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------
// TweakCN's @theme inline now hardcodes: --font-sans: Space Grotesk, serif
// We use a separate variable name so Next.js still self-hosts the @font-face
// without conflicting with the theme's own --font-sans declaration.
// ---------------------------------------------------------------------------

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Venuity — Discover Venues in Butuan City',
  description:
    'Find and explore event venues in Butuan City with an interactive map and AI-powered recommendations.',
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // --font-space-grotesk makes Next.js inject the @font-face.
      // Theme's font-sans utility already resolves to 'Space Grotesk, serif'
      // via @theme inline in globals.css — so the font renders correctly.
      className={`${spaceGrotesk.variable} dark`}
    >
      <body className={cn('font-sans bg-background text-foreground antialiased')}>
        <TooltipProvider delayDuration={0}>
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
        </TooltipProvider>
      </body>
    </html>
  );
}
