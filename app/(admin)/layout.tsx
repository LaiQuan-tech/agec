import { Noto_Serif_TC, Noto_Sans_TC } from "next/font/google";
import "@/app/globals.css";

/**
 * Wrapper shared by /login and /admin.
 *
 * globals.css and the two webfonts are loaded here rather than in the root
 * layout so that neither reaches the public tree:
 *  - globals.css is a second full Tailwind build; stacking it on
 *    app/(site)/site.css would double the Preflight and let import order decide
 *    the value of --ink / --muted / --cream / --green-deep.
 *  - next/font registers these under the literal family names "Noto Sans TC" /
 *    "Noto Serif TC", which site.css also names — loading them site-wide would
 *    silently override the reference site's own font resolution.
 * See the comment in app/layout.tsx.
 *
 * The public site's tokens (--ink / --muted / --hairline / --radius-card …)
 * are declared on :root in app/globals.css and would otherwise style the admin
 * with the same warm editorial palette. The `data-admin` attribute re-pins them
 * to the admin's neutral greys (see the [data-admin] block in app/globals.css);
 * brand colours are shared and inherited unchanged.
 */

// Heading font — see --font-heading in app/globals.css.
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

// The admin's only font.
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-admin
      // The font variables used to sit on <html>; they live here now so the
      // public tree never sees them. Everything in the admin inherits
      // font-family from the [data-admin] rule, which reads them.
      className={`${notoSerifTC.variable} ${notoSansTC.variable} min-h-screen`}
      style={{ background: "#f6f7f8" }}
    >
      {children}
    </div>
  );
}
