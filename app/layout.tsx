import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/site-routes";

/**
 * The root layout deliberately imports NO stylesheet and loads NO font.
 *
 * Two independent Tailwind v4 builds live in this repo — app/globals.css
 * (`@import "tailwindcss"`, the admin's) and app/(site)/site.css (the
 * reference site's prebuilt bundle). Loading both in one tree would stack two
 * Preflights, two `.container` definitions, two `@property --tw-*` blocks, and
 * four same-named-different-valued tokens (--ink / --muted / --cream /
 * --green-deep) on a bare `:root`, with import order deciding the winner. So
 * each route group owns its own stylesheet instead:
 *   app/(site)/layout.tsx   → ./site.css
 *   app/(admin)/layout.tsx  → @/app/globals.css  + next/font
 * Nothing here may import CSS or call next/font, or the isolation is gone.
 *
 * The fonts moved to the admin layout for a subtler reason: `next/font/google`
 * registers its @font-face under the *literal* family name "Noto Sans TC" /
 * "Noto Serif TC", which are the exact names site.css asks for. Loading them
 * site-wide silently replaced the reference site's own resolved fonts with a
 * latin-subset webfont, shifting every Latin run and digit by ~1–10% in width.
 * The reference site loads no webfonts at all, so the public tree must not
 * either.
 */

export const metadata: Metadata = {
  // Required for the hreflang alternates in lib/site-routes.ts: Next only
  // emits absolute alternate URLs, and without a base it cannot build them.
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    template: "%s | 國立臺灣大學 農業經濟學系",
    default: "國立臺灣大學 農業經濟學系",
  },
  description:
    "國立臺灣大學農業經濟學系（Dept. of Agricultural Economics, NTU）官方網站：最新消息、本系簡介、系所成員、招生資訊、課程資訊、學生專區與系友專區。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      {/* No utility classes here: Tailwind utilities only exist in the
          stylesheet each route group loads, so classes on <body> would resolve
          in one tree and silently no-op in the other. Both groups set their own
          body background/colour/font. */}
      <body>{children}</body>
    </html>
  );
}
