// ---------------------------------------------------------------------------
// (auth) route group layout
//
// This file exists only to define the route group segment. The actual
// sidebar-suppression logic lives in AppShell (components/layout/AppShell.tsx)
// which checks the pathname and skips the sidebar for /login and /signup.
//
// Do NOT render <html> or <body> here — only the root app/layout.tsx may do that.
// ---------------------------------------------------------------------------

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
