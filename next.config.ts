import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Faculty photos / news covers / journal & poster art live in Supabase
    // Storage (public buckets) and are referenced by full URL from lib/data.ts
    // rows (faculty.photo_url, news.cover_url). Whitelisted so next/image can
    // optimize them once the theme components start rendering real photos.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "amwiaanlvxupzfzaruwr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
