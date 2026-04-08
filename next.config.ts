import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — covers the project bucket used for venue images.
        // Hostname is derived from NEXT_PUBLIC_SUPABASE_URL, e.g.:
        //   https://qblcgzjvuhhudrnybumi.supabase.co  →  *.supabase.co
        // Using a wildcard subdomain allows the same config to survive
        // project migrations without changing next.config.ts.
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
