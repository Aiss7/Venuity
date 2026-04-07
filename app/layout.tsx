import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
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
  title: 'Venuity — Discover Event Venues in Butuan City',
  description:
    'Find and explore event venues in Butuan City with an interactive map and AI-powered recommendations.',
};

// ---------------------------------------------------------------------------
// Root Layout — Server Component
//
// AppShell (Client Component) handles sidebar visibility:
//   - Auth routes (/login, /signup): full-screen, no sidebar
//   - All other routes: sidebar + main layout
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} dark`}
    >
      <body className={cn('font-sans bg-background text-foreground antialiased')} suppressHydrationWarning>
        <TooltipProvider delayDuration={0}>
          <AppShell>
            {children}
          </AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
